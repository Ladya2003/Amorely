import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { Locale } from 'date-fns';
import { ensureDateFnsLocale, getDateFnsLocale } from '../../localization/calendarHelpers';
import { ensurePickersLocaleText, getPickersLocaleText } from '../../localization/pickersLocale';

interface AppDateLocalizationProviderProps {
  children: React.ReactNode;
}

const AppDateLocalizationProvider: React.FC<AppDateLocalizationProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [adapterLocale, setAdapterLocale] = useState<Locale>(() => getDateFnsLocale(i18n.language));
  const [localeText, setLocaleText] = useState(() => getPickersLocaleText(i18n.language));

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      ensureDateFnsLocale(i18n.language),
      ensurePickersLocaleText(i18n.language),
    ]).then(([nextAdapterLocale, nextLocaleText]) => {
      if (cancelled) {
        return;
      }
      setAdapterLocale(nextAdapterLocale);
      setLocaleText(nextLocaleText);
    });

    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={adapterLocale}
      localeText={localeText}
    >
      {children}
    </LocalizationProvider>
  );
};

export default AppDateLocalizationProvider;
