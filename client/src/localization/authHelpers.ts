import type { TFunction } from 'i18next';

const SERVER_ERROR_KEYS: Record<string, string> = {
  'Неверный email или пароль': 'auth.errors.invalidCredentials',
  'Пользователь с таким email уже существует': 'auth.errors.emailExists',
  'Ошибка при входе пользователя': 'auth.errors.serverLoginFailed',
  'Ошибка при регистрации пользователя': 'auth.errors.serverRegisterFailed',
  'Ошибка при входе': 'auth.errors.loginFailed',
  'Ошибка при регистрации': 'auth.errors.registerFailed',
};

export const translateAuthServerError = (message: string, t: TFunction): string => {
  const key = SERVER_ERROR_KEYS[message];
  return key ? t(key) : message;
};
