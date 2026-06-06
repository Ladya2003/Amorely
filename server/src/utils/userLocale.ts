import User from '../models/user';
import { AppLocale, resolveLocale } from '../i18n/locales';

export const getUserLocale = async (userId: string): Promise<AppLocale> => {
  const user = await User.findById(userId).select('locale');
  return resolveLocale(user?.locale);
};
