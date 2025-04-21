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
  useTheme
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

interface ThemeSettingsProps {
  currentTheme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ currentTheme, onThemeChange }) => {
  const theme = useTheme();
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onThemeChange(event.target.value as 'light' | 'dark' | 'system');
  };
  
  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Настройки темы
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <FormControl component="fieldset">
        <FormLabel component="legend">Выберите тему оформления</FormLabel>
        <RadioGroup
          aria-label="theme"
          name="theme-radio-buttons-group"
          value={currentTheme}
          onChange={handleChange}
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
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Выбранная тема будет применена ко всему приложению.
      </Typography>
    </Paper>
  );
};

export default ThemeSettings; 