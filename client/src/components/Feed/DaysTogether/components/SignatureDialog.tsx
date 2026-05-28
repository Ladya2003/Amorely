// Диалог для создания подписи

import React, { useRef, useState, useEffect } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import ResponsiveDialog from '../../../UI/ResponsiveDialog';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import SignatureCanvas from 'react-signature-canvas';
import DrawingToolsToolbar, { type DrawingTool } from '../../../Games/DrawingToolsToolbar';
import { ColorTheme } from './ColorPicker';

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
  colorTheme
}) => {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 200 });
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [penColor, setPenColor] = useState('#111111');
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  // Обновляем размер холста при изменении размера контейнера
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && dialogOpen) {
        // Используем clientWidth (ширина без border, но с padding)
        // Вычитаем border вручную если нужно
        const rect = containerRef.current.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(containerRef.current);
        const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
        const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
        
        // Реальная ширина контейнера с вычетом border
        const width = Math.floor(rect.width - borderLeft - borderRight);
        
        if (width > 0) {
          setCanvasSize({ width, height: 200 });
          setIsCanvasReady(false);
          // Даем время на ререндер canvas с новым размером
          setTimeout(() => setIsCanvasReady(true), 50);
        }
      }
    };

    if (dialogOpen) {
      // Используем requestAnimationFrame для гарантии что DOM обновился
      requestAnimationFrame(() => {
        setTimeout(() => {
          updateCanvasSize();
        }, 100);
      });
      
      window.addEventListener('resize', updateCanvasSize);
    }
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [dialogOpen]);

  // Загружаем существующую подпись при открытии
  useEffect(() => {
    if (dialogOpen && isCanvasReady && signature && signatureRef.current) {
      // Небольшая задержка чтобы canvas успел инициализироваться
      const timer = setTimeout(() => {
        if (signatureRef.current) {
          try {
            // Загружаем изображение и центрируем/масштабируем его на canvas
            const img = new Image();
            img.onload = () => {
              if (signatureRef.current) {
                const canvas = signatureRef.current.getCanvas();
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  // Очищаем canvas перед загрузкой
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  
                  // Проверяем, нужно ли масштабировать изображение
                  let drawWidth = img.width;
                  let drawHeight = img.height;
                  let x = 0;
                  let y = 0;
                  
                  // Если изображение больше canvas, масштабируем с сохранением пропорций
                  if (img.width > canvas.width || img.height > canvas.height) {
                    const scale = Math.min(
                      canvas.width / img.width,
                      canvas.height / img.height
                    );
                    drawWidth = img.width * scale;
                    drawHeight = img.height * scale;
                  }
                  
                  // Центрируем изображение на canvas
                  x = (canvas.width - drawWidth) / 2;
                  y = (canvas.height - drawHeight) / 2;
                  
                  // Рисуем изображение
                  ctx.drawImage(img, x, y, drawWidth, drawHeight);
                }
              }
            };
            img.src = signature;
          } catch (error) {
            console.error('Error loading signature:', error);
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, isCanvasReady, signature]);

  // Обновляем настройки canvas при изменении инструмента или размера кисти
  useEffect(() => {
    if (signatureRef.current && isCanvasReady) {
      // Обновляем размер кисти
      const signatureInstance = signatureRef.current as any;
      if (signatureInstance) {
        if (tool === 'eraser') {
          signatureInstance.minWidth = brushSize * 2;
          signatureInstance.maxWidth = brushSize * 3;
        } else {
          signatureInstance.minWidth = brushSize * 0.8;
          signatureInstance.maxWidth = brushSize * 1.2;
        }
      }
    }
  }, [tool, brushSize, isCanvasReady]);

  const handleOpen = () => {
    setDialogOpen(true);
    setIsCanvasReady(false);
    // Сбрасываем инструменты при открытии
    setTool('pen');
    setBrushSize(3);
    setPenColor('#111111');
  };

  const handleClose = () => {
    setDialogOpen(false);
    setIsCanvasReady(false);
  };

  const handleSave = () => {
    if (signatureRef.current) {
      const canvas = signatureRef.current.getCanvas();
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        onSave(signatureRef.current.toDataURL());
        handleClose();
        return;
      }

      // Получаем данные изображения
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;

      // Находим границы нарисованного контента
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Если canvas пустой
      if (minX > maxX || minY > maxY) {
        // Пустая подпись при сохранении = удалить подпись пользователя
        onSave('');
        handleClose();
        return;
      }

      // Добавляем небольшой отступ
      const padding = 10;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(width - 1, maxX + padding);
      maxY = Math.min(height - 1, maxY + padding);

      // Создаем новый canvas с обрезанным изображением
      const croppedWidth = maxX - minX + 1;
      const croppedHeight = maxY - minY + 1;
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = croppedWidth;
      croppedCanvas.height = croppedHeight;
      const croppedCtx = croppedCanvas.getContext('2d');

      if (croppedCtx) {
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
        
        const dataUrl = croppedCanvas.toDataURL('image/png');
        onSave(dataUrl);
      }
      
      handleClose();
    }
  };

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleRemove = () => {
    if (onRemoveSignature) {
      onRemoveSignature();
    }
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
      />

      <Box
        ref={containerRef}
        sx={{
          border: '2px solid',
          borderColor: colorTheme.preview,
          borderRadius: 1,
          bgcolor: '#f5f5f5',
          height: 200,
          width: '100%',
          mb: 2,
          overflow: 'hidden'
        }}
      >
        <SignatureCanvas
          ref={(ref) => {
            signatureRef.current = ref;
            if (ref && !isCanvasReady) {
              setIsCanvasReady(true);
            }
          }}
          canvasProps={{
            width: canvasSize.width,
            height: canvasSize.height,
            className: 'signature-canvas',
            style: { touchAction: 'none' }
          }}
          backgroundColor="rgba(245, 245, 245, 0)"
          penColor={penColor}
          minWidth={brushSize * 0.8}
          maxWidth={brushSize * 1.2}
          dotSize={brushSize}
          throttle={0}
          velocityFilterWeight={0.7}
          onBegin={() => {
            // Устанавливаем режим рисования в зависимости от инструмента
            if (signatureRef.current) {
              const canvas = signatureRef.current.getCanvas();
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
              }
            }
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button 
          onClick={handleClear} 
          variant="outlined"
          sx={{
            borderColor: colorTheme.preview,
            color: colorTheme.preview,
            '&:hover': {
              borderColor: colorTheme.preview,
              bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.1')}`
            }
          }}
        >
          Очистить
        </Button>
        <Button 
          onClick={handleClose}
          sx={{
            color: colorTheme.preview,
            '&:hover': {
              bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.05')}`
            }
          }}
        >
          Отмена
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          sx={{
            bgcolor: colorTheme.preview,
            '&:hover': {
              bgcolor: `${colorTheme.colors[2].replace(/rgba\((.+)\)/, 'rgb($1)').replace(/, 0\.\d+/, '')}`
            }
          }}
        >
          Сохранить
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton
          color="primary"
          onClick={handleOpen}
          sx={{
            bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.1')}`,
            color: colorTheme.preview,
            '&:hover': { 
              bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.2')}`,
              color: colorTheme.preview
            }
          }}
        >
          <CreateIcon />
        </IconButton>
        
        {signature && onRemoveSignature && (
          <IconButton
            color="error"
            onClick={handleRemove}
            sx={{
              bgcolor: 'rgba(244, 67, 54, 0.1)',
              '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
            }}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      <ResponsiveDialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Добавить подпись</DialogTitle>
        {dialogContent}
      </ResponsiveDialog>
    </>
  );
};

export default SignatureDialog;

