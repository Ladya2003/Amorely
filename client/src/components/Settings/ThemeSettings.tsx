import React from 'react';
import {
  Box,
  Typography,
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
import {
  getSettingsHintSx,
  getSettingsPrimaryColorSwatchSx,
  getSettingsSectionDividerSx,
  getSettingsSectionTitleSx,
  getSettingsSubsectionTitleSx,
} from './settingsPageStyles';

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
    <Box>
      <Typography component="h2" sx={getSettingsSectionTitleSx()}>
        {t('settings.themeTitle')}
      </Typography>
      <Box component="hr" sx={getSettingsSectionDividerSx(theme)} />

      <FormControl fullWidth sx={{ mb: 1 }}>
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
        <Typography sx={getSettingsHintSx()}>{t('settings.languageHint')}</Typography>
      </FormControl>

      <Box component="hr" sx={getSettingsSectionDividerSx(theme)} />

      <FormControl component="fieldset">
        <FormLabel component="legend" sx={getSettingsSubsectionTitleSx()}>
          {t('settings.themeLegend')}
        </FormLabel>
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

      <Box component="hr" sx={getSettingsSectionDividerSx(theme)} />

      <FormControl component="fieldset">
        <FormLabel component="legend" sx={getSettingsSubsectionTitleSx()}>
          {t('settings.primaryColor')}
        </FormLabel>
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
                    ...getSettingsPrimaryColorSwatchSx(theme, isSelected),
                    bgcolor: option.preview,
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
        <Typography sx={getSettingsHintSx()}>
          {(() => {
            const selected = primaryColorOptions.find((o) => o.id === currentPrimaryColor);
            return selected
              ? t(`settings.colors.${selected.id}`, { defaultValue: selected.name })
              : null;
          })()}
        </Typography>
      </FormControl>

      <Typography sx={{ ...getSettingsHintSx(), mt: 2 }}>{t('settings.themeHint')}</Typography>
    </Box>
  );
};

export default ThemeSettings;
