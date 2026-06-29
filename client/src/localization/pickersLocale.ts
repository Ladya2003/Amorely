import {
  deDE,
  enUS,
  esES,
  frFR,
  ptBR,
  ruRU,
  ukUA,
} from '@mui/x-date-pickers/locales';
import { AppLocale, resolveAppLocale } from './locale';

const PICKERS_LOCALES: Record<AppLocale, (typeof ruRU)> = {
  ru: ruRU,
  en: enUS,
  es: esES,
  de: deDE,
  fr: frFR,
  pt: ptBR,
  uk: ukUA,
};

export const getPickersLocaleText = (locale?: string | null) => {
  const appLocale = resolveAppLocale(locale ?? undefined);
  return PICKERS_LOCALES[appLocale].components.MuiLocalizationProvider.defaultProps.localeText;
};
