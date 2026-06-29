// Диалог для создания подписи / рисунка

import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import ResponsiveDialog from '../../../UI/ResponsiveDialog';
import { getModalFooterActionsSx } from '../../../../theme/appTheme';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import DrawingToolsToolbar, { type DrawingTool } from '../../../Games/DrawingToolsToolbar';
import DrawCanvas, { type DrawCanvasHandle } from '../../../Games/DrawCanvas';
import type { DrawStroke } from '../../../../services/gamesService';
import { ColorTheme } from './ColorPicker';
import { getDaysTogetherActionButtonSx, DAYS_TOGETHER_INNER_RADIUS } from '../daysTogetherStyles';

const SIGNATURE_IMAGE_CORNER_RADIUS = DAYS_TOGETHER_INNER_RADIUS;
/** Отображение в карточке ~100px; 512px достаточно даже для Retina. */
const MAX_SIGNATURE_EXPORT_PX = 512;

interface CropCanvasOptions {
  cornerRadius?: number;
}

const isCanvasContentPixel = (r: number, g: number, b: number, a: number) => {
  if (a === 0) {
    return false;
  }
  return !(r >= 250 && g >= 250 && b >= 250);
};

const applyRoundedCornersToCanvas = (
  source: HTMLCanvasElement,
  cornerRadius: number
): HTMLCanvasElement => {
  const { width, height } = source;
  const radius = Math.min(cornerRadius, width / 2, height / 2);
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  const ctx = output.getContext('2d');
  if (!ctx) {
    return source;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.clip();
  ctx.drawImage(source, 0, 0);
  return output;
};

const scaleCanvasToMaxSize = (
  source: HTMLCanvasElement,
  maxSize: number
): HTMLCanvasElement => {
  const { width, height } = source;
  const longestSide = Math.max(width, height);
  if (longestSide <= maxSize) {
    return source;
  }

  const scale = maxSize / longestSide;
  const output = document.createElement('canvas');
  output.width = Math.max(1, Math.round(width * scale));
  output.height = Math.max(1, Math.round(height * scale));
  const ctx = output.getContext('2d');
  if (!ctx) {
    return source;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, output.width, output.height);
  return output;
};

const cropCanvasToDataUrl = (
  canvas: HTMLCanvasElement,
  options: CropCanvasOptions = {}
): string => {
  const { cornerRadius = 0 } = options;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas.toDataURL('image/png');
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      if (isCanvasContentPixel(r, g, b, a)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    return '';
  }

  const padding = Math.round(10 * (window.devicePixelRatio || 1));
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = croppedWidth;
  croppedCanvas.height = croppedHeight;
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    return canvas.toDataURL('image/png');
  }

  croppedCtx.drawImage(
    canvas,
    minX,
    minY,
    croppedWidth,
    croppedHeight,
    0,
    0,
    croppedWidth,
    croppedHeight
  );

  const scaledCanvas = scaleCanvasToMaxSize(croppedCanvas, MAX_SIGNATURE_EXPORT_PX);
  const outputCanvas = cornerRadius > 0
    ? applyRoundedCornersToCanvas(scaledCanvas, cornerRadius)
    : scaledCanvas;

  return outputCanvas.toDataURL('image/png');
};

interface SignatureDialogProps {
  onSave: (signatureDataUrl: string) => void;
  signature?: string;
  onRemoveSignature?: () => void;
  colorTheme: ColorTheme;
}

const SignatureDialog: React.FC<SignatureDialogProps> = ({
  onSave,
  signature,
  onRemoveSignature,
  colorTheme,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const canvasRef = useRef<DrawCanvasHandle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [redoStrokes, setRedoStrokes] = useState<DrawStroke[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [penColor, setPenColor] = useState('#111111');

  const hasContent = strokes.length > 0 || Boolean(backgroundImage);

  const handleOpen = () => {
    setDialogOpen(true);
    setTool('pen');
    setBrushSize(3);
    setPenColor('#111111');
    setStrokes([]);
    setRedoStrokes([]);
    setBackgroundImage(signature || null);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setClearAllDialogOpen(false);
  };

  const handleStroke = (stroke: DrawStroke) => {
    setStrokes((prev) => [...prev, stroke]);
    setRedoStrokes([]);
  };

  const handleUndo = () => {
    setStrokes((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const removed = prev[prev.length - 1];
      setRedoStrokes((redo) => [...redo, removed]);
      return prev.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStrokes((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const restored = prev[prev.length - 1];
      setStrokes((current) => [...current, restored]);
      return prev.slice(0, -1);
    });
  };

  const handleClearAll = () => {
    setStrokes([]);
    setRedoStrokes([]);
    setBackgroundImage(null);
    setClearAllDialogOpen(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) {
      handleClose();
      return;
    }

    const dataUrl = cropCanvasToDataUrl(canvas, {
      cornerRadius: SIGNATURE_IMAGE_CORNER_RADIUS,
    });
    onSave(dataUrl);
    handleClose();
  };

  const handleRemove = () => {
    onRemoveSignature?.();
  };

  const preventDrawerSwipeClose = (event: React.TouchEvent) => {
    (event.nativeEvent as TouchEvent & { defaultMuiPrevented?: boolean }).defaultMuiPrevented = true;
  };

  const dialogContent = (
    <Box sx={{ p: 3 }}>
      <DrawingToolsToolbar
        tool={tool}
        onToolChange={setTool}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        penColor={penColor}
        onPenColorChange={setPenColor}
        accentColor={colorTheme.preview}
        showFillTool
        onUndo={handleUndo}
        onRedo={handleRedo}
        undoDisabled={strokes.length === 0}
        redoDisabled={redoStrokes.length === 0}
        onClearAll={() => setClearAllDialogOpen(true)}
        clearAllDisabled={!hasContent}
      />

      <Box
        onTouchStart={preventDrawerSwipeClose}
        sx={{
          border: '2px solid',
          borderColor: colorTheme.preview,
          borderRadius: `${DAYS_TOGETHER_INNER_RADIUS}px`,
          mb: 2,
          overflow: 'hidden',
          touchAction: 'none',
          bgcolor: '#f5f5f5',
        }}
      >
        <DrawCanvas
          ref={canvasRef}
          strokes={strokes}
          canDraw
          tool={tool}
          strokeColor={penColor}
          strokeWidth={brushSize}
          onStroke={handleStroke}
          backgroundImageUrl={backgroundImage}
          minHeight={200}
          borderRadius={0}
          showBorder={false}
        />
      </Box>

      <Box
        sx={(muiTheme) => ({
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          ...getModalFooterActionsSx(muiTheme),
        })}
      >
        <Button
          onClick={handleClose}
          sx={{
            color: colorTheme.preview,
            '&:hover': {
              bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.05')}`,
            },
          }}
        >
          {t('feed.signatureDialog.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            bgcolor: colorTheme.preview,
            '&:hover': {
              bgcolor: `${colorTheme.colors[2].replace(/rgba\((.+)\)/, 'rgb($1)').replace(/, 0\.\d+/, '')}`,
            },
          }}
        >
          {t('feed.signatureDialog.save')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton
          onClick={handleOpen}
          aria-label={t('feed.signatureDialog.openHint')}
          sx={getDaysTogetherActionButtonSx(theme, colorTheme)}
        >
          <CreateIcon />
        </IconButton>

        {signature && onRemoveSignature && (
          <IconButton
            color="error"
            onClick={handleRemove}
            sx={{
              bgcolor: 'rgba(244, 67, 54, 0.1)',
              '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' },
            }}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      <ResponsiveDialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{t('feed.signatureDialog.title')}</DialogTitle>
        {dialogContent}
      </ResponsiveDialog>

      <ResponsiveDialog
        open={clearAllDialogOpen}
        onClose={() => setClearAllDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('drawingTools.clearAllConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('drawingTools.clearAllConfirmBody')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClearAllDialogOpen(false)}>
            {t('calendar.common.cancel')}
          </Button>
          <Button variant="contained" color="error" onClick={handleClearAll}>
            {t('drawingTools.clearAll')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </>
  );
};

export default SignatureDialog;
