// Компонент выбора цветовой темы для градиента

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  IconButton,
  Popover,
  Typography,
  Tooltip,
  useTheme,
} from '@mui/material';
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
import { ArrowBackIcon, CheckIcon, PaletteIcon } from '../../../UI/icons';
import { colorThemes, getThemeById } from './colorThemes';

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
          <Typography variant="subtitle2" sx={getColorPickerTitleSx(theme)}>
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
                const themeLabel = getThemeById(colorTheme.id, t).name;

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
              <Typography variant="caption" sx={getColorPickerHexCaptionSx(theme)}>
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
