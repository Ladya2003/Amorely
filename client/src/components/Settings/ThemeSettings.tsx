import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  useTheme,
  Tooltip,
  MenuItem,
  Select,
  InputLabel,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import CheckIcon from '@mui/icons-material/Check';
import { ThemePreference, PrimaryColorPreference, primaryColorOptions } from '../../theme/appTheme';
import { AppLocale, LOCALE_LABELS, SUPPORTED_LOCALES } from '../../localization/locale';

interface ThemeSettingsProps {
  currentTheme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  currentPrimaryColor: PrimaryColorPreference;
  onPrimaryColorChange: (color: PrimaryColorPreference) => void;
  currentLocale: AppLocale;
  onLocaleChange: (locale: AppLocale) => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  currentTheme,
  onThemeChange,
  currentPrimaryColor,
  onPrimaryColorChange,
  currentLocale,
  onLocaleChange,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onThemeChange(event.target.value as ThemePreference);
  };

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'transparent' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 400 }}>
        {t('settings.themeTitle')}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="locale-select-label">{t('settings.language')}</InputLabel>
        <Select
          labelId="locale-select-label"
          value={currentLocale}
          label={t('settings.language')}
          onChange={(event) => onLocaleChange(event.target.value as AppLocale)}
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <MenuItem key={locale} value={locale}>
              {LOCALE_LABELS[locale]}
            </MenuItem>
          ))}
        </Select>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('settings.languageHint')}
        </Typography>
      </FormControl>

      <Divider sx={{ mb: 3 }} />

      <FormControl component="fieldset">
        <FormLabel component="legend">{t('settings.themeLegend')}</FormLabel>
        <RadioGroup
          aria-label="theme"
          name="theme-radio-buttons-group"
          value={currentTheme}
          onChange={handleThemeChange}
        >
          <FormControlLabel
            value="light"
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LightModeIcon sx={{ mr: 1, color: theme.palette.mode === 'dark' ? 'inherit' : 'warning.main' }} />
                <Typography>{t('settings.themeLight')}</Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="dark"
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DarkModeIcon sx={{ mr: 1, color: theme.palette.mode === 'dark' ? 'info.main' : 'inherit' }} />
                <Typography>{t('settings.themeDark')}</Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="system"
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SettingsBrightnessIcon sx={{ mr: 1 }} />
                <Typography>{t('settings.themeSystem')}</Typography>
              </Box>
            }
          />
        </RadioGroup>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      <FormControl component="fieldset">
        <FormLabel component="legend">{t('settings.primaryColor')}</FormLabel>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
          {primaryColorOptions.map((option) => {
            const isSelected = currentPrimaryColor === option.id;
            const colorLabel = t(`settings.colors.${option.id}`, { defaultValue: option.name });
            return (
              <Tooltip key={option.id} title={colorLabel} arrow>
                <Box
                  onClick={() => onPrimaryColorChange(option.id)}
                  role="button"
                  aria-label={colorLabel}
                  aria-pressed={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onPrimaryColorChange(option.id);
                    }
                  }}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: option.preview,
                    cursor: 'pointer',
                    border: isSelected ? '3px solid' : '2px solid transparent',
                    borderColor: isSelected ? 'text.primary' : 'transparent',
                    boxShadow: isSelected ? 3 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    outline: 'none',
                    '&:hover': {
                      transform: 'scale(1.08)',
                      boxShadow: 3,
                    },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                    },
                  }}
                >
                  {isSelected && (
                    <CheckIcon sx={{ color: '#fff', fontSize: 22, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {(() => {
            const selected = primaryColorOptions.find((o) => o.id === currentPrimaryColor);
            return selected
              ? t(`settings.colors.${selected.id}`, { defaultValue: selected.name })
              : null;
          })()}
        </Typography>
      </FormControl>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('settings.themeHint')}
      </Typography>
    </Paper>
  );
};

export default ThemeSettings;
