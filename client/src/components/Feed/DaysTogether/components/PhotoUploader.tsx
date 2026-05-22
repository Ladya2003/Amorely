// Компонент загрузки и обрезки фото с валидацией

import React, { useState, useRef } from 'react';
import {
  IconButton,
  Box,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageCropDialog from '../../../UI/ImageCropDialog';
import CustomSnackbar from '../../../UI/CustomSnackbar';
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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalFileRef = useRef<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const sizeValidation = validateFileSize(file, 100);
    if (!sizeValidation.valid) {
      setError(sizeValidation.error || 'Ошибка валидации');
      return;
    }

    const typeValidation = validateFileType(file);
    if (!typeValidation.valid) {
      setError(typeValidation.error || 'Ошибка валидации');
      return;
    }

    originalFileRef.current = file;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropDialogClose = () => {
    setCropDialogOpen(false);
    setImageSrc(null);
    originalFileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    if (onRemovePhoto) {
      onRemovePhoto();
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

      <ImageCropDialog
        open={cropDialogOpen}
        imageSrc={imageSrc}
        originalFile={originalFileRef.current}
        onClose={handleCropDialogClose}
        onConfirm={onPhotoUpload}
      />

      <CustomSnackbar
        open={!!error}
        message={error}
        severity="error"
        autoHideDuration={6000}
        onClose={() => setError(null)}
      />
    </>
  );
};

export default PhotoUploader;
