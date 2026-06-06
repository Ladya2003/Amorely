import type { TFunction } from 'i18next';

export type NewsCategory = 'update' | 'event' | 'announcement';

export const getNewsCategoryLabel = (t: TFunction, category: string): string => {
  const key = `news.categories.${category}`;
  const translated = t(key, { defaultValue: '' });
  if (translated && translated !== key) {
    return translated;
  }
  return category;
};
