// Компонент выбора цветовой темы для градиента

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Tooltip
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';

export interface ColorTheme {
  id: string;
  name: string;
  colors: [string, string, string]; // 3 цвета для градиента
  preview: string; // Цвет превью
}

export const colorThemes: ColorTheme[] = [
  {
    id: 'pink',
    name: '💕 Розовая любовь',
    colors: ['rgba(255, 75, 141, 0.7)', 'rgba(255, 182, 193, 0.5)', 'rgba(255, 105, 180, 0.6)'],
    preview: '#ff4b8d'
  },
  {
    id: 'purple',
    name: '💜 Фиолетовая страсть',
    colors: ['rgba(138, 43, 226, 0.7)', 'rgba(186, 85, 211, 0.5)', 'rgba(147, 112, 219, 0.6)'],
    preview: '#8a2be2'
  },
  {
    id: 'blue',
    name: '💙 Голубое небо',
    colors: ['rgba(30, 144, 255, 0.7)', 'rgba(135, 206, 250, 0.5)', 'rgba(70, 130, 180, 0.6)'],
    preview: '#1e90ff'
  },
  {
    id: 'red',
    name: '❤️ Красная страсть',
    colors: ['rgba(220, 20, 60, 0.7)', 'rgba(255, 99, 71, 0.5)', 'rgba(255, 69, 0, 0.6)'],
    preview: '#dc143c'
  },
  {
    id: 'orange',
    name: '🧡 Оранжевое тепло',
    colors: ['rgba(255, 140, 0, 0.7)', 'rgba(255, 165, 0, 0.5)', 'rgba(255, 127, 80, 0.6)'],
    preview: '#ff8c00'
  },
  {
    id: 'green',
    name: '💚 Зеленая нежность',
    colors: ['rgba(60, 179, 113, 0.7)', 'rgba(144, 238, 144, 0.5)', 'rgba(102, 205, 170, 0.6)'],
    preview: '#3cb371'
  },
  {
    id: 'teal',
    name: '💎 Бирюзовая мечта',
    colors: ['rgba(0, 206, 209, 0.7)', 'rgba(64, 224, 208, 0.5)', 'rgba(72, 209, 204, 0.6)'],
    preview: '#00ced1'
  },
  {
    id: 'gold',
    name: '✨ Золотое сияние',
    colors: ['rgba(255, 215, 0, 0.7)', 'rgba(255, 223, 0, 0.5)', 'rgba(255, 200, 124, 0.6)'],
    preview: '#ffd700'
  },
  {
    id: 'sunset',
    name: '🌅 Закат',
    colors: ['rgba(255, 94, 77, 0.7)', 'rgba(255, 154, 158, 0.5)', 'rgba(250, 208, 196, 0.6)'],
    preview: '#ff5e4d'
  },
  {
    id: 'lavender',
    name: '💐 Лаванда',
    colors: ['rgba(230, 190, 255, 0.7)', 'rgba(200, 162, 200, 0.5)', 'rgba(216, 191, 216, 0.6)'],
    preview: '#e6beff'
  },
  {
    id: 'dark-purple',
    name: '🌑 Темная страсть',
    colors: ['rgba(75, 0, 130, 0.8)', 'rgba(138, 43, 226, 0.6)', 'rgba(106, 13, 173, 0.7)'],
    preview: '#4b0082'
  },
  {
    id: 'dark-blue',
    name: '🌌 Полночь',
    colors: ['rgba(25, 25, 112, 0.8)', 'rgba(65, 105, 225, 0.6)', 'rgba(0, 0, 139, 0.7)'],
    preview: '#191970'
  },
  {
    id: 'dark-red',
    name: '🍷 Темная роза',
    colors: ['rgba(139, 0, 0, 0.8)', 'rgba(178, 34, 34, 0.6)', 'rgba(220, 20, 60, 0.7)'],
    preview: '#8b0000'
  },
  {
    id: 'dark-green',
    name: '🌲 Темный лес',
    colors: ['rgba(0, 100, 0, 0.8)', 'rgba(34, 139, 34, 0.6)', 'rgba(46, 125, 50, 0.7)'],
    preview: '#006400'
  },
  {
    id: 'navy',
    name: '⚓ Морская глубина',
    colors: ['rgba(0, 51, 102, 0.8)', 'rgba(30, 144, 255, 0.6)', 'rgba(0, 82, 165, 0.7)'],
    preview: '#003366'
  },
  {
    id: 'black-elegant',
    name: '🖤 Элегантная чернота',
    colors: ['rgba(0, 0, 0, 0.4)', 'rgba(64, 64, 64, 0.3)', 'rgba(32, 32, 32, 0.35)'],
    preview: '#000000'
  },
  {
    id: 'black-silver',
    name: '🌫️ Черное серебро',
    colors: ['rgba(32, 32, 32, 0.4)', 'rgba(128, 128, 128, 0.3)', 'rgba(64, 64, 64, 0.35)'],
    preview: '#202020'
  },
  {
    id: 'black-blue',
    name: '🌃 Черно-синий',
    colors: ['rgba(0, 0, 0, 0.4)', 'rgba(0, 32, 64, 0.3)', 'rgba(16, 16, 48, 0.35)'],
    preview: '#001020'
  },
  {
    id: 'black-purple',
    name: '🌌 Космическая тьма',
    colors: ['rgba(16, 0, 32, 0.4)', 'rgba(64, 0, 128, 0.3)', 'rgba(32, 0, 64, 0.35)'],
    preview: '#100020'
  }
];

interface ColorPickerProps {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedTheme, onThemeChange }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeSelect = (themeId: string) => {
    onThemeChange(themeId);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const currentTheme = colorThemes.find(t => t.id === selectedTheme) || colorThemes[0];

  return (
    <>
      <Tooltip title="Изменить цветовую тему" arrow>
        <IconButton
          onClick={handleClick}
          sx={{
            bgcolor: 'transparent',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              transform: 'scale(1.1)',
              border: '2px solid rgba(255, 255, 255, 0.5)',
            },
            transition: 'all 0.2s'
          }}
        >
          <PaletteIcon sx={{ color: currentTheme.preview }} />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 320 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Выберите цветовую тему:
          </Typography>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 1,
              mt: 1,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {colorThemes.map((theme) => (
              <Tooltip key={theme.id} title={theme.name} arrow>
                <Box
                  onClick={() => handleThemeSelect(theme.id)}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.colors.join(', ')})`,
                    cursor: 'pointer',
                    border: selectedTheme === theme.id ? '3px solid' : '2px solid transparent',
                    borderColor: selectedTheme === theme.id ? 'primary.main' : 'transparent',
                    transition: 'all 0.2s',
                    boxShadow: selectedTheme === theme.id ? 3 : 1,
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: 3
                    }
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default ColorPicker;

