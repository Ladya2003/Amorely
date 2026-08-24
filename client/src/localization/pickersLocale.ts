import { AppLocale, resolveAppLocale } from './locale';

type PickersLocalesModule = typeof import('@mui/x-date-pickers/locales');
type PickersLocalePack = PickersLocalesModule['ruRU'];
type PickersLocaleText = NonNullable<
  PickersLocalePack['components']['MuiLocalizationProvider']['defaultProps']['localeText']
>;

const pickersLocaleCache: Partial<Record<AppLocale, PickersLocaleText>> = {};

let pickersLocalesPromise: Promise<PickersLocalesModule> | null = null;

const loadPickersLocales = () => {
  if (!pickersLocalesPromise) {
    pickersLocalesPromise = import('@mui/x-date-pickers/locales');
  }
  return pickersLocalesPromise;
};

const getPickersLocalePack = (
  locales: PickersLocalesModule,
  locale: AppLocale
): PickersLocalePack => {
  switch (locale) {
    case 'ru':
      return locales.ruRU;
    case 'en':
      return locales.enUS;
    case 'es':
      return locales.esES;
    case 'de':
      return locales.deDE;
    case 'fr':
      return locales.frFR;
    case 'pt':
      return locales.ptBR;
    case 'uk':
      return locales.ukUA;
    case 'by':
      return locales.beBY;
    default: {
      const _never: never = locale;
      return _never;
    }
  }
};

export const ensurePickersLocaleText = async (
  locale?: string | null
): Promise<PickersLocaleText | undefined> => {
  const appLocale = resolveAppLocale(locale ?? undefined);
  const cached = pickersLocaleCache[appLocale];
  if (cached) {
    return cached;
  }

  const locales = await loadPickersLocales();
  const loaded = getPickersLocalePack(locales, appLocale).components.MuiLocalizationProvider
    .defaultProps.localeText;
  pickersLocaleCache[appLocale] = loaded;
  return loaded;
};

export const getPickersLocaleText = (locale?: string | null) => {
  const appLocale = resolveAppLocale(locale ?? undefined);
  return pickersLocaleCache[appLocale];
};
