import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User, { UserDocument } from '../models/user';
import { findActiveRelationshipForUser } from '../utils/relationshipHelpers';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { resolvePartnerContext } from '../utils/resolvePartnerId';
import { hasActivePartner } from '../utils/normalizeId';
import { hasCryptoBackup } from '../utils/hasCryptoBackup';
import { ACCOUNT_BLOCKED_ERROR, buildBlockReasons, getLocalizedBlockReason } from '../utils/userBlock';
import { awardRegistrationBonus } from '../utils/currencyRewards';
import { getBalance } from '../services/currencyService';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/emailService';
import { resolveLocale } from '../i18n/locales';
import {
  createEmailVerificationToken,
  getVerificationResendCooldownMs,
  getVerificationResendRetryAfterSeconds,
  hashEmailVerificationToken,
} from '../utils/emailVerification';
import {
  createPasswordResetToken,
  getPasswordResetCooldownMs,
  getPasswordResetRetryAfterSeconds,
  hashPasswordResetToken,
} from '../utils/passwordReset';
import {
  signAccessToken,
  signGoogleSignupPendingToken,
  verifyGoogleSignupPendingToken,
} from '../utils/authTokens';

const router = express.Router();

export const EMAIL_NOT_VERIFIED_ERROR = 'EMAIL_NOT_VERIFIED';
export const USE_PASSWORD_LOGIN_ERROR = 'USE_PASSWORD_LOGIN';
export const RESEND_COOLDOWN_ERROR = 'RESEND_COOLDOWN';

/** Generic success copy — same whether or not an account exists (anti-enumeration). */
const PASSWORD_RESET_REQUEST_MESSAGE =
  'Если аккаунт с этим email существует, мы отправили письмо для сброса пароля';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const resolveRequestLocale = (req: Request, stored?: string | null) => {
  const fromBody = typeof req.body?.locale === 'string' ? req.body.locale.trim() : '';
  return resolveLocale(fromBody || stored);
};

const googleClient = new OAuth2Client();

const issueAuthSuccess = async (user: UserDocument) => {
  const token = signAccessToken(user._id.toString());
  const {
    password: _password,
    emailVerificationTokenHash: _evHash,
    emailVerificationExpires: _evExp,
    passwordResetTokenHash: _prHash,
    passwordResetExpires: _prExp,
    readNewsIds: _readNewsIds,
    readNewsBackfilled: _readNewsBackfilled,
    readAnnouncementKeys: _readAnnouncementKeys,
    readAnnouncementsBackfilled: _readAnnouncementsBackfilled,
    ...userWithoutSensitive
  } = user.toObject();
  const userHasCryptoBackup = await hasCryptoBackup(user._id);
  return {
    token,
    user: { ...userWithoutSensitive, hasCryptoBackup: userHasCryptoBackup },
  };
};

const nextResendAvailableInSeconds = (sendCountAfterThisSend: number): number =>
  Math.ceil(getVerificationResendCooldownMs(sendCountAfterThisSend) / 1000);

const assignVerificationToken = async (user: UserDocument): Promise<string> => {
  const { token, tokenHash, expiresAt } = createEmailVerificationToken();
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpires = expiresAt;
  await user.save();
  return token;
};

/** Send verification email and bump send counters. Caller must ensure cooldown already passed. */
const sendVerificationAndTrack = async (
  user: UserDocument,
  email: string,
  locale?: string | null
): Promise<{ resendAvailableInSeconds: number }> => {
  const verificationToken = await assignVerificationToken(user);
  await sendVerificationEmail(email, verificationToken, resolveLocale(locale || user.locale));
  const sendCount = (user.emailVerificationSendCount ?? 0) + 1;
  user.emailVerificationSendCount = sendCount;
  user.emailVerificationSentAt = new Date();
  await user.save();
  return { resendAvailableInSeconds: nextResendAvailableInSeconds(sendCount) };
};

// Регистрация нового пользователя
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Введите корректный email'),
    body('username').isLength({ min: 3 }).withMessage('Логин должен содержать минимум 3 символа'),
    body('password').isLength({ min: 8 }).withMessage('Пароль должен содержать минимум 8 символов')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const email = normalizeEmail(req.body.email);
      const username = String(req.body.username || '').trim();
      const { password } = req.body;

      const existingByEmail = await User.findOne({ email });

      // Unverified local account: treat re-register as "resend + refresh credentials"
      // so a page reload doesn't trap the user on "email already exists".
      if (existingByEmail && !existingByEmail.emailVerified && existingByEmail.authProvider === 'local') {
        existingByEmail.password = password;
        existingByEmail.locale = resolveRequestLocale(req, existingByEmail.locale);
        if (username !== existingByEmail.username) {
          const usernameTaken = await User.findOne({
            username,
            _id: { $ne: existingByEmail._id },
          });
          if (!usernameTaken) {
            existingByEmail.username = username;
          }
        }
        await existingByEmail.save();

        const retryAfterSeconds = getVerificationResendRetryAfterSeconds(existingByEmail);
        if (retryAfterSeconds > 0) {
          return res.status(200).json({
            message: 'Проверьте почту для подтверждения email',
            needsEmailVerification: true,
            email,
            resendAvailableInSeconds: retryAfterSeconds,
          });
        }

        try {
          const { resendAvailableInSeconds } = await sendVerificationAndTrack(
            existingByEmail,
            email,
            existingByEmail.locale
          );
          return res.status(200).json({
            message: 'Проверьте почту для подтверждения email',
            needsEmailVerification: true,
            email,
            resendAvailableInSeconds,
          });
        } catch (emailError) {
          console.error('Ошибка отправки письма подтверждения:', emailError);
          return res.status(200).json({
            message: 'Аккаунт ожидает подтверждения, но не удалось отправить письмо. Запросите повторную отправку.',
            needsEmailVerification: true,
            email,
            emailSendFailed: true,
            resendAvailableInSeconds: 0,
          });
        }
      }

      if (existingByEmail) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      }

      const existingByUsername = await User.findOne({ username });
      if (existingByUsername) {
        return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
      }

      const locale = resolveRequestLocale(req);
      const newUser = new User({
        email,
        username,
        password,
        authProvider: 'local',
        emailVerified: false,
        locale,
      });

      await newUser.save();

      try {
        const { resendAvailableInSeconds } = await sendVerificationAndTrack(newUser, email, locale);
        res.status(201).json({
          message: 'Проверьте почту для подтверждения email',
          needsEmailVerification: true,
          email,
          resendAvailableInSeconds,
        });
      } catch (emailError) {
        console.error('Ошибка отправки письма подтверждения:', emailError);
        return res.status(201).json({
          message: 'Аккаунт создан, но не удалось отправить письмо. Запросите повторную отправку.',
          needsEmailVerification: true,
          email,
          emailSendFailed: true,
          resendAvailableInSeconds: 0,
        });
      }
    } catch (error) {
      console.error('Ошибка при регистрации пользователя:', error);
      res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
    }
  }
);

router.post(
  '/resend-verification',
  [body('email').isEmail().withMessage('Введите корректный email')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const email = normalizeEmail(req.body.email);
      const user = await User.findOne({ email });

      // Avoid account enumeration for unknown / verified / non-local accounts
      if (!user || user.emailVerified || user.authProvider !== 'local') {
        return res.json({
          message: 'Если аккаунт требует подтверждения, письмо отправлено',
          resendAvailableInSeconds: Math.ceil(getVerificationResendCooldownMs(1) / 1000),
        });
      }

      const retryAfterSeconds = getVerificationResendRetryAfterSeconds(user);
      if (retryAfterSeconds > 0) {
        return res.status(429).json({
          error: RESEND_COOLDOWN_ERROR,
          code: RESEND_COOLDOWN_ERROR,
          message: 'Подождите перед повторной отправкой письма',
          resendAvailableInSeconds: retryAfterSeconds,
        });
      }

      const { resendAvailableInSeconds } = await sendVerificationAndTrack(
        user,
        email,
        resolveRequestLocale(req, user.locale)
      );

      res.json({
        message: 'Если аккаунт требует подтверждения, письмо отправлено',
        resendAvailableInSeconds,
      });
    } catch (error) {
      console.error('Ошибка повторной отправки подтверждения:', error);
      res.status(500).json({ error: 'Не удалось отправить письмо подтверждения' });
    }
  }
);

router.post(
  '/verify-email',
  [body('token').isString().isLength({ min: 20 }).withMessage('Некорректный токен')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const rawToken = String(req.body.token);
      const tokenHash = hashEmailVerificationToken(rawToken);

      const user = await User.findOne({
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpires: { $gt: new Date() },
      });

      if (!user) {
        return res.status(400).json({ error: 'Ссылка подтверждения недействительна или устарела' });
      }

      // Keep token hash until expiry so Strict Mode / double-submit can verify idempotently.
      const newlyVerified = !user.emailVerified;
      if (newlyVerified) {
        user.emailVerified = true;
        await user.save();
      }

      const currencyAward = newlyVerified
        ? await awardRegistrationBonus(user._id.toString())
        : { awarded: false, amount: 0 };
      const wallet = await getBalance(user._id.toString());
      const auth = await issueAuthSuccess(user);

      res.json({
        message: 'Email подтверждён',
        ...auth,
        balance: wallet.balance,
        canAffordFirstPet: wallet.canAffordFirstPet,
        awardedAmount: currencyAward.awarded ? currencyAward.amount : 0,
      });
    } catch (error) {
      console.error('Ошибка подтверждения email:', error);
      res.status(500).json({ error: 'Ошибка подтверждения email' });
    }
  }
);

// Вход пользователя
router.post('/login', async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body.email || '');
    const { password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: ACCOUNT_BLOCKED_ERROR,
        blockReason: getLocalizedBlockReason(user),
        blockedReasons: buildBlockReasons(user.blockedReasons),
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: EMAIL_NOT_VERIFIED_ERROR,
        code: EMAIL_NOT_VERIFIED_ERROR,
        email: user.email,
      });
    }

    const auth = await issueAuthSuccess(user);

    res.json({
      message: 'Вход выполнен успешно',
      ...auth,
    });
  } catch (error) {
    console.error('Ошибка при входе пользователя:', error);
    res.status(500).json({ error: 'Ошибка при входе пользователя' });
  }
});

router.post('/google', async (req: Request, res: Response) => {
  try {
    const idToken = req.body.idToken as string | undefined;
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();

    if (!idToken) {
      return res.status(400).json({ error: 'Не передан Google idToken' });
    }
    if (!clientId) {
      return res.status(500).json({ error: 'Google Sign-In не настроен на сервере' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      return res.status(401).json({ error: 'Не удалось проверить Google аккаунт' });
    }

    const googleId = payload.sub;
    const email = normalizeEmail(payload.email);
    const firstName = payload.given_name;
    const lastName = payload.family_name;
    const avatar = payload.picture;

    const byGoogleId = await User.findOne({ googleId });
    if (byGoogleId) {
      if (byGoogleId.isBlocked) {
        return res.status(403).json({
          error: ACCOUNT_BLOCKED_ERROR,
          blockReason: getLocalizedBlockReason(byGoogleId),
          blockedReasons: buildBlockReasons(byGoogleId.blockedReasons),
        });
      }
      const auth = await issueAuthSuccess(byGoogleId);
      return res.json({ message: 'Вход выполнен успешно', ...auth });
    }

    const byEmail = await User.findOne({ email });
    if (byEmail) {
      if (byEmail.authProvider === 'local' || byEmail.password) {
        return res.status(409).json({
          error: USE_PASSWORD_LOGIN_ERROR,
          code: USE_PASSWORD_LOGIN_ERROR,
          message: 'Аккаунт с этим email уже зарегистрирован. Войдите паролем.',
        });
      }
      return res.status(409).json({
        error: USE_PASSWORD_LOGIN_ERROR,
        code: USE_PASSWORD_LOGIN_ERROR,
        message: 'Аккаунт с этим email уже зарегистрирован. Войдите паролем.',
      });
    }

    const suggestedUsername = email.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 24) || '';
    const pendingToken = signGoogleSignupPendingToken({
      googleId,
      email,
      firstName,
      lastName,
      avatar,
    });

    res.json({
      needsUsername: true,
      pendingToken,
      email,
      suggestedUsername: suggestedUsername.length >= 3 ? suggestedUsername : '',
    });
  } catch (error) {
    console.error('Ошибка Google Sign-In:', error);
    res.status(401).json({ error: 'Не удалось выполнить вход через Google' });
  }
});

router.post(
  '/google/complete',
  [
    body('pendingToken').isString().withMessage('Некорректный токен'),
    body('username').isLength({ min: 3 }).withMessage('Логин должен содержать минимум 3 символа'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let pending;
      try {
        pending = verifyGoogleSignupPendingToken(String(req.body.pendingToken));
      } catch {
        return res.status(400).json({ error: 'Сессия регистрации Google истекла. Попробуйте снова.' });
      }

      const username = String(req.body.username || '').trim();
      const email = normalizeEmail(pending.email);

      const existingGoogle = await User.findOne({ googleId: pending.googleId });
      if (existingGoogle) {
        const auth = await issueAuthSuccess(existingGoogle);
        return res.json({ message: 'Вход выполнен успешно', ...auth });
      }

      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({
          error: USE_PASSWORD_LOGIN_ERROR,
          code: USE_PASSWORD_LOGIN_ERROR,
          message: 'Аккаунт с этим email уже зарегистрирован. Войдите паролем.',
        });
      }

      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
      }

      const newUser = new User({
        email,
        username,
        authProvider: 'google',
        googleId: pending.googleId,
        emailVerified: true,
        firstName: pending.firstName,
        lastName: pending.lastName,
        avatar: pending.avatar,
      });

      await newUser.save();

      const currencyAward = await awardRegistrationBonus(newUser._id.toString());
      const wallet = await getBalance(newUser._id.toString());
      const auth = await issueAuthSuccess(newUser);

      res.status(201).json({
        message: 'Регистрация через Google завершена',
        ...auth,
        balance: wallet.balance,
        canAffordFirstPet: wallet.canAffordFirstPet,
        awardedAmount: currencyAward.awarded ? currencyAward.amount : 0,
      });
    } catch (error) {
      console.error('Ошибка завершения Google Sign-In:', error);
      res.status(500).json({ error: 'Ошибка регистрации через Google' });
    }
  }
);

// Получение данных текущего пользователя
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Не авторизован' });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'amorely') as { userId: string };
    
    const user = await User.findById(decoded.userId).select(
      '-password -emailVerificationTokenHash -passwordResetTokenHash -readNewsIds -readNewsBackfilled -readAnnouncementKeys -readAnnouncementsBackfilled'
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: ACCOUNT_BLOCKED_ERROR,
        blockReason: getLocalizedBlockReason(user),
        blockedReasons: buildBlockReasons(user.blockedReasons),
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: EMAIL_NOT_VERIFIED_ERROR,
        code: EMAIL_NOT_VERIFIED_ERROR,
        email: user.email,
      });
    }
    
    const { partnerId: resolvedPartnerId, hasPartner } = await resolvePartnerContext(
      user._id.toString()
    );

    let relationshipStartDate = null;
    if (hasPartner) {
      const relationship = await findActiveRelationshipForUser(user._id.toString());

      if (relationship) {
        relationshipStartDate = relationship.startDate;
      }
    }

    const userObject = user.toObject();
    const userHasCryptoBackup = await hasCryptoBackup(user._id);
    const userWithRelationship = {
      ...userObject,
      partnerId: hasActivePartner(user._id.toString(), resolvedPartnerId)
        ? resolvedPartnerId
        : undefined,
      relationshipStartDate,
      hasCryptoBackup: userHasCryptoBackup
    };
    
    res.json(userWithRelationship);
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Недействительный токен' });
    }
    
    res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
  }
});

// Запрос сброса пароля (письмо со ссылкой)
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Введите корректный email')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const email = normalizeEmail(req.body.email);
      const user = await User.findOne({ email });

      // Always respond the same way for local enumeration resistance.
      const genericOk = (resendAvailableInSeconds: number) =>
        res.json({
          message: PASSWORD_RESET_REQUEST_MESSAGE,
          resendAvailableInSeconds,
        });

      if (!user || user.authProvider !== 'local' || !user.password) {
        return genericOk(Math.ceil(getPasswordResetCooldownMs(1) / 1000));
      }

      const retryAfterSeconds = getPasswordResetRetryAfterSeconds(user);
      if (retryAfterSeconds > 0) {
        return res.status(429).json({
          error: RESEND_COOLDOWN_ERROR,
          code: RESEND_COOLDOWN_ERROR,
          resendAvailableInSeconds: retryAfterSeconds,
        });
      }

      const { token, tokenHash, expiresAt } = createPasswordResetToken();
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpires = expiresAt;

      try {
        await sendPasswordResetEmail(email, token, resolveRequestLocale(req, user.locale));
      } catch (emailError) {
        // Same generic response as "no account" — do not leak existence via send failures.
        console.error('Ошибка отправки письма сброса пароля:', emailError);
        user.passwordResetTokenHash = null;
        user.passwordResetExpires = null;
        return genericOk(Math.ceil(getPasswordResetCooldownMs(1) / 1000));
      }

      const sendCount = (user.passwordResetSendCount ?? 0) + 1;
      user.passwordResetSendCount = sendCount;
      user.passwordResetSentAt = new Date();
      await user.save();

      return genericOk(Math.ceil(getPasswordResetCooldownMs(sendCount) / 1000));
    } catch (error) {
      console.error('Ошибка при запросе сброса пароля:', error);
      res.status(500).json({ error: 'Ошибка при запросе сброса пароля' });
    }
  }
);

// Установка нового пароля по токену из письма
router.post(
  '/reset-password',
  [
    body('token').isString().isLength({ min: 20 }).withMessage('Недействительная ссылка сброса пароля'),
    body('password').isLength({ min: 8 }).withMessage('Пароль должен содержать минимум 8 символов'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const rawToken = String(req.body.token || '').trim();
      const { password } = req.body;
      const tokenHash = hashPasswordResetToken(rawToken);

      const user = await User.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpires: { $gt: new Date() },
      });

      if (!user || user.authProvider !== 'local') {
        return res.status(400).json({ error: 'Ссылка сброса пароля недействительна или устарела' });
      }

      if (user.isBlocked) {
        return res.status(403).json({
          error: ACCOUNT_BLOCKED_ERROR,
          blockReason: getLocalizedBlockReason(user),
          blockedReasons: buildBlockReasons(user.blockedReasons),
        });
      }

      user.password = password;
      user.passwordResetTokenHash = null;
      user.passwordResetExpires = null;
      user.passwordResetSentAt = null;
      user.passwordResetSendCount = 0;
      await user.save();

      // Unverified accounts still need email confirmation before login.
      if (!user.emailVerified) {
        return res.json({
          message: 'Пароль успешно изменён',
          needsEmailVerification: true,
          email: user.email,
        });
      }

      const auth = await issueAuthSuccess(user);
      res.json({
        message: 'Пароль успешно изменён',
        ...auth,
      });
    } catch (error) {
      console.error('Ошибка при сбросе пароля:', error);
      res.status(500).json({ error: 'Ошибка при сбросе пароля' });
    }
  }
);

// Изменение пароля
router.post('/change-password', authMiddleware, async (req: any, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId as string;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Не указаны обязательные поля' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Для аккаунта Google смена пароля недоступна' });
    }
    
    const isPasswordValid = await user.comparePassword(oldPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Ошибка при изменении пароля:', error);
    res.status(500).json({ error: 'Ошибка при изменении пароля' });
  }
});

export default router;
