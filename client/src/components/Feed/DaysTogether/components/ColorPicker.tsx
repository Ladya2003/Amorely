// Компонент выбора цветовой темы для градиента

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Box,
  Button,
  IconButton,
  Popover,
  Typography,
  Tooltip,
  useTheme,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import { HexColorPicker } from 'react-colorful';
import {
  getColorPickerBackButtonSx,
  getColorPickerCustomSwatchSx,
  getColorPickerGridSx,
  getColorPickerHexCaptionSx,
  getColorPickerHexWrapSx,
  getColorPickerPopoverPaperSx,
  getColorPickerThemeSwatchSx,
  getColorPickerTitleSx,
  getDaysTogetherActionButtonSx,
} from '../daysTogetherStyles';

export interface ColorTheme {
  id: string;
  name: string;
  colors: [string, string, string]; // 3 цвета для градиента
  preview: string; // Цвет превью
}

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '');
  const safeHex = normalized.length === 3
    ? normalized.split('').map((ch) => ch + ch).join('')
    : normalized;

  const int = Number.parseInt(safeHex, 16);
  return [
    (int >> 16) & 255,
    (int >> 8) & 255,
    int & 255
  ];
};

const getThemeName = (themeId: string, t: TFunction, fallback: string): string => {
  const key = themeId.startsWith('custom:') ? 'custom' : themeId;
  return t(`feed.colorPicker.themes.${key}`, { defaultValue: fallback });
};

const buildCustomTheme = (hex: string, t?: TFunction): ColorTheme => {
  const [r, g, b] = hexToRgb(hex);
  const fallbackName = '🎨 Свой цвет';
  return {
    id: `custom:${hex}`,
    name: t ? getThemeName(`custom:${hex}`, t, fallbackName) : fallbackName,
    colors: [
      `rgba(${r}, ${g}, ${b}, 0.7)`,
      `rgba(${r}, ${g}, ${b}, 0.5)`,
      `rgba(${r}, ${g}, ${b}, 0.6)`
    ],
    preview: hex
  };
};

export const getThemeById = (themeId: string, t?: TFunction): ColorTheme => {
  if (themeId?.startsWith('custom:')) {
    const hex = themeId.split(':')[1] || '#ff4b8d';
    return buildCustomTheme(hex, t);
  }
  const theme = colorThemes.find((item) => item.id === themeId) || colorThemes[0];
  if (!t) {
    return theme;
  }
  return {
    ...theme,
    name: getThemeName(theme.id, t, theme.name),
  };
};

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
    colors: ['rgba(0, 0, 0, 0.25)', 'rgba(32, 32, 32, 0.2)', 'rgba(16, 16, 16, 0.22)'],
    preview: '#000000'
  },
  {
    id: 'black-silver',
    name: '🌫️ Черное серебро',
    colors: ['rgba(16, 16, 16, 0.25)', 'rgba(64, 64, 64, 0.2)', 'rgba(40, 40, 40, 0.22)'],
    preview: '#101010'
  },
  {
    id: 'black-blue',
    name: '🌃 Черно-синий',
    colors: ['rgba(0, 0, 0, 0.25)', 'rgba(0, 32, 64, 0.2)', 'rgba(8, 16, 32, 0.22)'],
    preview: '#001020'
  },
  {
    id: 'black-purple',
    name: '🌌 Космическая тьма',
    colors: ['rgba(16, 0, 32, 0.25)', 'rgba(48, 0, 96, 0.2)', 'rgba(32, 0, 64, 0.22)'],
    preview: '#100020'
  }
];

interface ColorPickerProps {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedTheme, onThemeChange }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [draftCustomColor, setDraftCustomColor] = useState(() =>
    selectedTheme.startsWith('custom:') ? (selectedTheme.split(':')[1] || '#ff4b8d') : '#ff4b8d'
  );
  const [hasCustomTouched, setHasCustomTouched] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setHasCustomTouched(false);
    setShowCustomPicker(false);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    if (hasCustomTouched) {
      const nextThemeId = `custom:${draftCustomColor}`;
      if (selectedTheme !== nextThemeId) {
        onThemeChange(nextThemeId);
      }
    }
    setShowCustomPicker(false);
    setAnchorEl(null);
  };

  const handleThemeSelect = (themeId: string) => {
    onThemeChange(themeId);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const currentTheme = getThemeById(selectedTheme, t);
  const isCustomSelected = selectedTheme.startsWith('custom:');
  const selectedCustomColor = draftCustomColor;

  useEffect(() => {
    if (selectedTheme.startsWith('custom:')) {
      const hex = selectedTheme.split(':')[1] || '#ff4b8d';
      setDraftCustomColor(hex);
    }
  }, [selectedTheme]);

  useEffect(() => {
    if (!hasCustomTouched) return;

    const timeoutId = window.setTimeout(() => {
      const nextThemeId = `custom:${draftCustomColor}`;
      if (selectedTheme !== nextThemeId) {
        onThemeChange(nextThemeId);
      }
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [draftCustomColor, hasCustomTouched, selectedTheme, onThemeChange]);

  return (
    <>
      <Tooltip title={t('feed.colorPicker.changeTheme')} arrow>
        <IconButton
          onClick={handleClick}
          sx={getDaysTogetherActionButtonSx(theme, currentTheme)}
        >
          <PaletteIcon />
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
        slotProps={{
          paper: {
            sx: getColorPickerPopoverPaperSx(theme),
          },
        }}
      >
        <Box sx={{ p: 2, width: 320, maxWidth: 'calc(100vw - 32px)' }}>
          <Typography variant="subtitle2" sx={getColorPickerTitleSx()}>
            {t('feed.colorPicker.selectTheme')}
          </Typography>

          {!showCustomPicker ? (
            <Box sx={getColorPickerGridSx()}>
              <Tooltip title={t('feed.colorPicker.pickColor')} arrow>
                <Box
                  component="button"
                  type="button"
                  aria-label={t('feed.colorPicker.pickColor')}
                  aria-pressed={isCustomSelected}
                  onClick={() => {
                    onThemeChange(`custom:${draftCustomColor}`);
                    setShowCustomPicker(true);
                  }}
                  sx={{
                    ...getColorPickerCustomSwatchSx(theme, isCustomSelected),
                    background: selectedCustomColor,
                    p: 0,
                  }}
                >
                  <PaletteIcon
                    sx={{
                      color: '#fff',
                      fontSize: 20,
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))',
                    }}
                  />
                </Box>
              </Tooltip>

              {colorThemes.map((colorTheme) => {
                const isSelected = selectedTheme === colorTheme.id;
                const themeLabel = getThemeName(colorTheme.id, t, colorTheme.name);

                return (
                  <Tooltip key={colorTheme.id} title={themeLabel} arrow>
                    <Box
                      component="button"
                      type="button"
                      aria-label={themeLabel}
                      aria-pressed={isSelected}
                      onClick={() => handleThemeSelect(colorTheme.id)}
                      sx={{
                        ...getColorPickerThemeSwatchSx(theme, isSelected),
                        background: `linear-gradient(135deg, ${colorTheme.colors.join(', ')})`,
                        p: 0,
                      }}
                    >
                      {isSelected && (
                        <CheckIcon
                          sx={{
                            color: '#fff',
                            fontSize: 20,
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                          }}
                        />
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          ) : (
            <Box sx={{ mt: 1.25 }}>
              <Button
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={() => setShowCustomPicker(false)}
                sx={getColorPickerBackButtonSx(theme)}
              >
                {t('feed.colorPicker.back')}
              </Button>
              <Box sx={getColorPickerHexWrapSx(theme)}>
                <HexColorPicker
                  color={draftCustomColor}
                  onChange={(hex) => {
                    setDraftCustomColor(hex);
                    if (!hasCustomTouched) {
                      setHasCustomTouched(true);
                    }
                  }}
                />
              </Box>
              <Typography variant="caption" sx={getColorPickerHexCaptionSx()}>
                {t('feed.colorPicker.currentColor', { color: draftCustomColor.toUpperCase() })}
              </Typography>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default ColorPicker;
