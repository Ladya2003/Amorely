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
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import CheckIcon from '@mui/icons-material/Check';
import { ThemePreference, PrimaryColorPreference, primaryColorOptions } from '../../theme/appTheme';

interface ThemeSettingsProps {
  currentTheme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  currentPrimaryColor: PrimaryColorPreference;
  onPrimaryColorChange: (color: PrimaryColorPreference) => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  currentTheme,
  onThemeChange,
  currentPrimaryColor,
  onPrimaryColorChange,
}) => {
  const theme = useTheme();

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onThemeChange(event.target.value as ThemePreference);
  };

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'transparent' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 400 }}>
        Настройки темы
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <FormControl component="fieldset">
        <FormLabel component="legend">Выберите тему оформления</FormLabel>
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
                <Typography>Светлая</Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="dark"
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DarkModeIcon sx={{ mr: 1, color: theme.palette.mode === 'dark' ? 'info.main' : 'inherit' }} />
                <Typography>Темная</Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="system"
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SettingsBrightnessIcon sx={{ mr: 1 }} />
                <Typography>Системная</Typography>
              </Box>
            }
          />
        </RadioGroup>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      <FormControl component="fieldset">
        <FormLabel component="legend">Основной цвет</FormLabel>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
          {primaryColorOptions.map((option) => {
            const isSelected = currentPrimaryColor === option.id;
            return (
              <Tooltip key={option.id} title={option.name} arrow>
                <Box
                  onClick={() => onPrimaryColorChange(option.id)}
                  role="button"
                  aria-label={option.name}
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
          {primaryColorOptions.find((o) => o.id === currentPrimaryColor)?.name}
        </Typography>
      </FormControl>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Выбранные настройки будут применены ко всему приложению.
      </Typography>
    </Paper>
  );
};

export default ThemeSettings;
