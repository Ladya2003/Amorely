import React from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getDateFnsLocale } from '../../localization/calendarHelpers';
import { getPickersLocaleText } from '../../localization/pickersLocale';

interface AppDateLocalizationProviderProps {
  children: React.ReactNode;
}

const AppDateLocalizationProvider: React.FC<AppDateLocalizationProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={getDateFnsLocale(i18n.language)}
      localeText={getPickersLocaleText(i18n.language)}
    >
      {children}
    </LocalizationProvider>
  );
};

export default AppDateLocalizationProvider;
