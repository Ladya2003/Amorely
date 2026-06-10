import React from 'react';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { AppLocale, LOCALE_LABELS, SUPPORTED_LOCALES, resolveAppLocale } from '../../localization/locale';
import { persistAppLocale } from '../../localization/localeSync';

interface LanguageSelectorProps {
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ size = 'small', fullWidth = false }) => {
  const { t, i18n } = useTranslation();
  const { user, token, updateUser } = useAuth();
  const currentLocale = resolveAppLocale(i18n.language);

  const handleChange = (event: SelectChangeEvent) => {
    const newLocale = event.target.value as AppLocale;

    void persistAppLocale(newLocale, {
      userId: user?._id,
      token: token ?? undefined,
    }).then((savedLocale) => {
      if (user) {
        updateUser({ ...user, locale: savedLocale });
      }
    });
  };

  return (
    <FormControl size={size} fullWidth={fullWidth} sx={{ minWidth: fullWidth ? undefined : 140 }}>
      <InputLabel id="language-selector-label">{t('settings.language')}</InputLabel>
      <Select
        labelId="language-selector-label"
        id="language-selector"
        value={currentLocale}
        label={t('settings.language')}
        onChange={handleChange}
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <MenuItem key={locale} value={locale}>
            {LOCALE_LABELS[locale]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSelector;
