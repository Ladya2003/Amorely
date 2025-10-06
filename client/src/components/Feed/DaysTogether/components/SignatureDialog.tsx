// Диалог для создания подписи

import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
  Slider,
  Typography,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import BrushIcon from '@mui/icons-material/Brush';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SignatureCanvas from 'react-signature-canvas';
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
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      {/* Панель инструментов */}
      <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Выбор инструмента */}
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ color: colorTheme.preview }}>
            Инструмент:
          </Typography>
          <ToggleButtonGroup
            value={tool}
            exclusive
            onChange={(_, newTool) => newTool && setTool(newTool)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: colorTheme.preview,
                borderColor: colorTheme.preview,
                '&.Mui-selected': {
                  bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.2')}`,
                  color: colorTheme.preview,
                  '&:hover': {
                    bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.3')}`,
                  }
                }
              }
            }}
          >
            <ToggleButton value="pen">
              <BrushIcon sx={{ mr: 0.5 }} />
              Кисть
            </ToggleButton>
            <ToggleButton value="eraser">
              <AutoFixHighIcon sx={{ mr: 0.5 }} />
              Ластик
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Размер кисти */}
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ color: colorTheme.preview }}>
            Размер: {brushSize}px
          </Typography>
          <Slider
            value={brushSize}
            onChange={(_, newValue) => setBrushSize(newValue as number)}
            min={1}
            max={10}
            step={0.5}
            valueLabelDisplay="auto"
            sx={{
              color: colorTheme.preview,
              '& .MuiSlider-thumb': {
                bgcolor: colorTheme.preview,
              },
              '& .MuiSlider-track': {
                bgcolor: colorTheme.preview,
              },
              '& .MuiSlider-rail': {
                bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.3')}`,
              }
            }}
          />
        </Box>
      </Box>

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
          penColor="black"
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

      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={dialogOpen}
          onClose={handleClose}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '80vh'
            }
          }}
        >
          <Box sx={{ 
            width: '100%', 
            pt: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              width: 40, 
              height: 4, 
              bgcolor: 'grey.300', 
              borderRadius: 2, 
              mx: 'auto', 
              mb: 2 
            }} />
            <DialogTitle sx={{ pb: 0 }}>Добавить подпись</DialogTitle>
            {dialogContent}
          </Box>
        </Drawer>
      ) : (
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>Добавить подпись</DialogTitle>
          {dialogContent}
        </Dialog>
      )}
    </>
  );
};

export default SignatureDialog;

