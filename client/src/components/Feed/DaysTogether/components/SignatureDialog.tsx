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
  open: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  signature?: string;
  onRemoveSignature?: () => void;
  colorTheme: ColorTheme;
}

const SignatureDialog: React.FC<SignatureDialogProps> = ({
  open,
  onClose,
  onSave,
  signature,
  onRemoveSignature,
  colorTheme
}) => {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 200 });
  const [brushSize, setBrushSize] = useState(2);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Обновляем размер холста при изменении размера контейнера
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setCanvasSize({ width, height: 200 });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [dialogOpen]);

  // Загружаем существующую подпись при открытии
  useEffect(() => {
    if (dialogOpen && signature && signatureRef.current) {
      // Небольшая задержка чтобы canvas успел инициализироваться
      const timer = setTimeout(() => {
        if (signatureRef.current && !signatureRef.current.isEmpty()) {
          signatureRef.current.clear();
        }
        if (signatureRef.current) {
          signatureRef.current.fromDataURL(signature);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, signature, canvasSize]); // Добавляем canvasSize в зависимости

  // Обновляем настройки canvas при изменении инструмента
  useEffect(() => {
    if (signatureRef.current) {
      const canvas = signatureRef.current.getCanvas();
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        if (tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      
      // Обновляем размер кисти через внутренние свойства
      const signatureInstance = signatureRef.current as any;
      if (signatureInstance) {
        signatureInstance.minWidth = brushSize * 0.5;
        signatureInstance.maxWidth = brushSize * 1.5;
      }
    }
  }, [tool, brushSize, dialogOpen]);

  const handleOpen = () => {
    setDialogOpen(true);
    // Сбрасываем инструменты при открытии
    setTool('pen');
    setBrushSize(2);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  const handleSave = () => {
    if (signatureRef.current) {
      const dataUrl = signatureRef.current.toDataURL();
      onSave(dataUrl);
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
          ref={(ref) => { signatureRef.current = ref; }}
          canvasProps={{
            width: canvasSize.width,
            height: canvasSize.height,
            className: 'signature-canvas'
          }}
          backgroundColor="rgba(245, 245, 245, 0)"
          penColor={tool === 'eraser' ? 'rgba(0,0,0,0)' : 'black'}
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
        <Button onClick={handleClose}>
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

