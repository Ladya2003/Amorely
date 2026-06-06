import React, { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  IconButton,
  Popover,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import BrushIcon from '@mui/icons-material/Brush';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PaletteIcon from '@mui/icons-material/Palette';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { HexColorPicker } from 'react-colorful';

export type DrawingTool = 'pen' | 'eraser';

export const DEFAULT_PEN_COLORS = [
  '#111111',
  '#FF4B8D',
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#0ea5e9',
  '#8B4513',
];

export interface DrawingToolsToolbarProps {
  tool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  penColor: string;
  onPenColorChange: (color: string) => void;
  accentColor?: string;
  minBrush?: number;
  maxBrush?: number;
  /** Чат догадок справа (50%), на одной линии с колонкой «Инструмент» + «Цвет» */
  sideContent?: ReactNode;
  /** Очистить весь холст (только для игры «Отгадай рисунок») */
  onClearAll?: () => void;
  clearAllDisabled?: boolean;
}

const DrawingToolsToolbar: React.FC<DrawingToolsToolbarProps> = ({
  tool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  penColor,
  onPenColorChange,
  accentColor = 'primary.main',
  minBrush = 1,
  maxBrush = 10,
  sideContent,
  onClearAll,
  clearAllDisabled = false,
}) => {
  const { t } = useTranslation();
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);

  const colorBlock = (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ color: accentColor }}>
        {t('drawingTools.color')}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {DEFAULT_PEN_COLORS.map((color) => (
          <Box
            key={color}
            component="button"
            type="button"
            aria-label={t('drawingTools.colorAria', { color })}
            onClick={() => {
              onPenColorChange(color);
              onToolChange('pen');
            }}
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: color,
              border: '2px solid',
              borderColor: penColor === color ? 'primary.main' : 'divider',
              cursor: 'pointer',
              p: 0,
            }}
          />
        ))}
        <IconButton
          size="small"
          onClick={(event) => setColorAnchor(event.currentTarget)}
          aria-label={t('drawingTools.customColor')}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <PaletteIcon fontSize="small" />
        </IconButton>
      </Box>
      <Popover
        open={Boolean(colorAnchor)}
        anchorEl={colorAnchor}
        onClose={() => setColorAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 1.5 }}>
          <HexColorPicker
            color={penColor}
            onChange={(hex) => {
              onPenColorChange(hex);
              onToolChange('pen');
            }}
          />
        </Box>
      </Popover>
    </Box>
  );

  const toolBlock = (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ color: accentColor }}>
        {t('drawingTools.tool')}
      </Typography>
      <ToggleButtonGroup
        value={tool}
        exclusive
        onChange={(_, value) => value && onToolChange(value)}
        size="small"
      >
        <ToggleButton value="pen">
          <BrushIcon sx={{ mr: 0.5, fontSize: 18 }} />
          {t('drawingTools.brush')}
        </ToggleButton>
        <ToggleButton value="eraser">
          <AutoFixHighIcon sx={{ mr: 0.5, fontSize: 18 }} />
          {t('drawingTools.eraser')}
        </ToggleButton>
      </ToggleButtonGroup>
      {onClearAll && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<DeleteSweepIcon sx={{ fontSize: 18 }} />}
          onClick={onClearAll}
          disabled={clearAllDisabled}
          sx={{ mt: 1 }}
        >
          {t('drawingTools.clearAll')}
        </Button>
      )}
    </Box>
  );

  const sizeBlock = (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ color: accentColor }}>
        {t('drawingTools.size', { size: brushSize })}
      </Typography>
      <Slider
        value={brushSize}
        onChange={(_, value) => onBrushSizeChange(value as number)}
        min={minBrush}
        max={maxBrush}
        step={0.5}
        valueLabelDisplay="auto"
        sx={{ color: accentColor }}
      />
    </Box>
  );

  if (sideContent) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'stretch', mb: 2 }}>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {toolBlock}
          {colorBlock}
          {sizeBlock}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignSelf: 'flex-start' }}>
          {sideContent}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
      {toolBlock}
      {colorBlock}
      {sizeBlock}
    </Box>
  );
};

export default DrawingToolsToolbar;
