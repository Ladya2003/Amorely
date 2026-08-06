import type { TFunction } from 'i18next';

const SERVER_ERROR_KEYS: Record<string, string> = {
  'Неверный email или пароль': 'auth.errors.invalidCredentials',
  'Пользователь с таким email уже существует': 'auth.errors.emailExists',
  'Пользователь с таким логином уже существует': 'auth.errors.usernameExists',
  'Ошибка при входе пользователя': 'auth.errors.serverLoginFailed',
  'Ошибка при регистрации пользователя': 'auth.errors.serverRegisterFailed',
  'Ошибка при входе': 'auth.errors.loginFailed',
  'Ошибка при регистрации': 'auth.errors.registerFailed',
  'Ссылка подтверждения недействительна или устарела': 'auth.verify.invalidToken',
  'Не удалось отправить письмо подтверждения': 'auth.verify.resendFailed',
  'Подождите перед повторной отправкой письма': 'auth.verify.resendCooldown',
  RESEND_COOLDOWN: 'auth.verify.resendCooldown',
  'Ошибка подтверждения email': 'auth.verify.failed',
  'Не удалось выполнить вход через Google': 'auth.errors.googleFailed',
  'Ошибка регистрации через Google': 'auth.errors.googleFailed',
  'Сессия регистрации Google истекла. Попробуйте снова.': 'auth.google.sessionExpired',
  'Google Sign-In не настроен на сервере': 'auth.google.notConfigured',
  'Аккаунт с этим email уже зарегистрирован. Войдите паролем.': 'auth.errors.usePasswordLogin',
  USE_PASSWORD_LOGIN: 'auth.errors.usePasswordLogin',
  EMAIL_NOT_VERIFIED: 'auth.verify.notVerified',
  'Если аккаунт с этим email существует, мы отправили письмо для сброса пароля':
    'auth.forgotPassword.sentSuccess',
  'Не удалось отправить письмо для сброса пароля': 'auth.forgotPassword.requestFailed',
  'Ошибка при запросе сброса пароля': 'auth.forgotPassword.requestFailed',
  'Ссылка сброса пароля недействительна или устарела': 'auth.forgotPassword.invalidToken',
  'Ошибка при сбросе пароля': 'auth.forgotPassword.resetFailed',
  'Пароль должен содержать минимум 8 символов': 'auth.forgotPassword.passwordTooShort',
  'Введите корректный email': 'auth.errors.invalidEmail',
  'Недействительная ссылка сброса пароля': 'auth.forgotPassword.invalidToken',
};

export const translateAuthServerError = (message: string, t: TFunction): string => {
  const key = SERVER_ERROR_KEYS[message];
  return key ? t(key) : message;
};

/** Read `error` or first express-validator `errors[].msg` from an API error body. */
export const getAuthApiErrorMessage = (data: unknown, fallback: string): string => {
  if (!data || typeof data !== 'object') {
    return fallback;
  }
  const body = data as { error?: unknown; errors?: unknown };
  if (typeof body.error === 'string' && body.error.trim()) {
    return body.error;
  }
  if (Array.isArray(body.errors)) {
    for (const item of body.errors) {
      if (item && typeof item === 'object' && typeof (item as { msg?: unknown }).msg === 'string') {
        const msg = (item as { msg: string }).msg.trim();
        if (msg) {
          return msg;
        }
      }
    }
  }
  return fallback;
};
