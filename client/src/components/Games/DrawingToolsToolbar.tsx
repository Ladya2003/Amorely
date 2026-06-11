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
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import PaletteIcon from '@mui/icons-material/Palette';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { HexColorPicker } from 'react-colorful';

export type DrawingTool = 'pen' | 'eraser' | 'fill';

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
  /** Чат догадок справа (50%), на одной строке с блоком «Цвет» */
  sideContent?: ReactNode;
  /** Очистить весь холст (только для игры «Отгадай рисунок») */
  onClearAll?: () => void;
  clearAllDisabled?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  undoDisabled?: boolean;
  redoDisabled?: boolean;
  /** Заливка замкнутых областей (только для игры «Отгадай рисунок») */
  showFillTool?: boolean;
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
  onUndo,
  onRedo,
  undoDisabled = false,
  redoDisabled = false,
  showFillTool = false,
}) => {
  const { t } = useTranslation();
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);

  const handleColorPick = (color: string) => {
    onPenColorChange(color);
    if (tool === 'eraser') {
      return;
    }
    onToolChange(tool === 'fill' ? 'fill' : 'pen');
  };

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
            onClick={() => handleColorPick(color)}
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
            onChange={handleColorPick}
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
        {showFillTool && (
          <ToggleButton value="fill">
            <FormatColorFillIcon sx={{ mr: 0.5, fontSize: 18 }} />
            {t('drawingTools.fill')}
          </ToggleButton>
        )}
      </ToggleButtonGroup>
      {(onUndo || onRedo || onClearAll) && (
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {onUndo && (
            <Button
              variant="outlined"
              size="small"
              onClick={onUndo}
              disabled={undoDisabled}
              aria-label={t('drawingTools.undo')}
              sx={{ minWidth: 0, py: 0.875, px: 1.25 }}
            >
              <UndoIcon sx={{ fontSize: 18 }} />
            </Button>
          )}
          {onRedo && (
            <Button
              variant="outlined"
              size="small"
              onClick={onRedo}
              disabled={redoDisabled}
              aria-label={t('drawingTools.redo')}
              sx={{ minWidth: 0, py: 0.875, px: 1.25 }}
            >
              <RedoIcon sx={{ fontSize: 18 }} />
            </Button>
          )}
          {onClearAll && (
            <Button
              variant="outlined"
              size="small"
              onClick={onClearAll}
              disabled={clearAllDisabled}
              sx={{ py: 0.875, px: 1.5 }}
            >
              <DeleteSweepIcon sx={{ mr: 0.5, fontSize: 18 }} />
              {t('drawingTools.clearAll')}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );

  const sizeBlock = (
    <Box sx={{ opacity: tool === 'fill' ? 0.5 : 1 }}>
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
        disabled={tool === 'fill'}
        sx={{ color: accentColor }}
      />
    </Box>
  );

  if (sideContent) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        {toolBlock}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>{colorBlock}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>{sideContent}</Box>
        </Box>
        {sizeBlock}
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
