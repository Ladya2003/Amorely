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
};

export const translateAuthServerError = (message: string, t: TFunction): string => {
  const key = SERVER_ERROR_KEYS[message];
  return key ? t(key) : message;
};
