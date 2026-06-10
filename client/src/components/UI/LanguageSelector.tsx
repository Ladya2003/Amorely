import React from 'react';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { AppLocale, BILINGUAL_LANGUAGE_LABEL, LOCALE_LABELS, SUPPORTED_LOCALES, resolveAppLocale } from '../../localization/locale';
import { persistAppLocale } from '../../localization/localeSync';

interface LanguageSelectorProps {
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  bilingualLabel?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  size = 'small',
  fullWidth = false,
  bilingualLabel = false,
}) => {
  const { t, i18n } = useTranslation();
  const { user, token, updateUser } = useAuth();
  const currentLocale = resolveAppLocale(i18n.language);
  const label = bilingualLabel ? BILINGUAL_LANGUAGE_LABEL : t('settings.language');

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
    <FormControl
      size={size}
      fullWidth={fullWidth}
      sx={{ minWidth: fullWidth ? undefined : bilingualLabel ? 168 : 140 }}
    >
      <InputLabel id="language-selector-label">{label}</InputLabel>
      <Select
        labelId="language-selector-label"
        id="language-selector"
        value={currentLocale}
        label={label}
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
