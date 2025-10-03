// Компонент загрузки и обрезки фото с валидацией

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Alert,
  Snackbar
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { validateFileSize, validateFileType } from '../utils/helpers';
import { ColorTheme } from './ColorPicker';

interface PhotoUploaderProps {
  onPhotoUpload: (file: File) => void;
  photo?: string;
  onRemovePhoto?: () => void;
  colorTheme: ColorTheme;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ 
  onPhotoUpload, 
  photo, 
  onRemovePhoto, 
  colorTheme 
}) => {
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalFileRef = useRef<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Валидация размера (100 МБ)
    const sizeValidation = validateFileSize(file, 100);
    if (!sizeValidation.valid) {
      setError(sizeValidation.error || 'Ошибка валидации');
      return;
    }

    // Валидация типа
    const typeValidation = validateFileType(file);
    if (!typeValidation.valid) {
      setError(typeValidation.error || 'Ошибка валидации');
      return;
    }

    // Сохраняем оригинальный файл
    originalFileRef.current = file;

    // Создаем preview для crop
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropDialogOpen(true);
      // Crop будет установлен после загрузки изображения через onImageLoad
      setCrop(undefined);
      setCompletedCrop(undefined);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !originalFileRef.current) return;

    // Если completedCrop не установлен, но есть crop, используем crop
    const cropToUse = completedCrop || (crop && {
      x: Math.round((crop.x / 100) * imgRef.current.naturalWidth),
      y: Math.round((crop.y / 100) * imgRef.current.naturalHeight),
      width: Math.round((crop.width / 100) * imgRef.current.naturalWidth),
      height: Math.round((crop.height / 100) * imgRef.current.naturalHeight),
      unit: 'px' as const
    });

    if (!cropToUse) {
      // Если crop вообще не установлен, используем оригинальное изображение
      onPhotoUpload(originalFileRef.current);
      handleCropDialogClose();
      return;
    }

    try {
      const croppedFile = await getCroppedImg(
        imgRef.current,
        cropToUse,
        originalFileRef.current.name
      );
      
      onPhotoUpload(croppedFile);
      handleCropDialogClose();
    } catch (error) {
      console.error('Error cropping image:', error);
      setError('Ошибка при обрезке изображения');
    }
  };

  const handleCropDialogClose = () => {
    setCropDialogOpen(false);
    setImageSrc(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    if (onRemovePhoto) {
      onRemovePhoto();
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Устанавливаем crop по умолчанию после того как изображение загрузилось
    const defaultCrop = {
      unit: '%' as const,
      width: 80,
      height: 80,
      x: 10,
      y: 10
    };
    setCrop(defaultCrop);
    
    // Конвертируем в пиксели для completedCrop
    const pixelCrop = {
      x: Math.round((defaultCrop.x / 100) * img.naturalWidth),
      y: Math.round((defaultCrop.y / 100) * img.naturalHeight),
      width: Math.round((defaultCrop.width / 100) * img.naturalWidth),
      height: Math.round((defaultCrop.height / 100) * img.naturalHeight),
      unit: 'px' as const
    };
    setCompletedCrop(pixelCrop);
  };

  const handleUploadWithoutCrop = () => {
    if (originalFileRef.current) {
      onPhotoUpload(originalFileRef.current);
      handleCropDialogClose();
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        id="upload-photo"
        type="file"
        onChange={handleFileSelect}
      />
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <label htmlFor="upload-photo">
          <IconButton
            component="span"
            color="primary"
            sx={{
              bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.1')}`,
              color: colorTheme.preview,
              '&:hover': { 
                bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.2')}`,
                color: colorTheme.preview
              }
            }}
          >
            <AddPhotoAlternateIcon />
          </IconButton>
        </label>
        
        {photo && onRemovePhoto && (
          <IconButton
            color="error"
            onClick={handleRemovePhoto}
            sx={{
              bgcolor: 'rgba(244, 67, 54, 0.1)',
              '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
            }}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      {/* Диалог обрезки */}
      <Dialog open={cropDialogOpen} onClose={handleCropDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Обрезать фото</DialogTitle>
        <DialogContent>
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={handleImageLoad}
                style={{ maxWidth: '100%', maxHeight: '60vh' }}
              />
            </ReactCrop>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleUploadWithoutCrop}
            sx={{
              color: colorTheme.preview,
              '&:hover': {
                bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.05')}`
              }
            }}
          >
            Без обрезки
          </Button>
          <Button 
            onClick={handleCropDialogClose}
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
            onClick={handleCropComplete} 
            variant="contained"
            sx={{
              bgcolor: colorTheme.preview,
              '&:hover': {
                bgcolor: `${colorTheme.colors[2].replace(/rgba\((.+)\)/, 'rgb($1)').replace(/, 0\.\d+/, '')}`
              }
            }}
          >
            Применить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомления об ошибках */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

// Функция для создания обрезанного изображения
async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string
): Promise<File> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        resolve(file);
      },
      'image/jpeg',
      0.95
    );
  });
}

export default PhotoUploader;

