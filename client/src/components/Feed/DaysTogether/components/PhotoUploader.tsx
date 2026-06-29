// Компонент загрузки и обрезки фото с валидацией

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { alpha } from '@mui/material/styles';
import {
  IconButton,
  Box,
  useTheme,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageCropDialog from '../../../UI/ImageCropDialog';
import CustomSnackbar from '../../../UI/CustomSnackbar';
import { validateFileSize, validateFileType } from '../utils/helpers';
import { ColorTheme } from './ColorPicker';
import { getDaysTogetherActionButtonSx } from '../daysTogetherStyles';

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
  const { t } = useTranslation();
  const theme = useTheme();
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalFileRef = useRef<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const sizeValidation = validateFileSize(file, t, 100);
    if (!sizeValidation.valid) {
      setError(sizeValidation.error || t('feed.validation.generic'));
      return;
    }

    const typeValidation = validateFileType(file, t);
    if (!typeValidation.valid) {
      setError(typeValidation.error || t('feed.validation.generic'));
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
            sx={getDaysTogetherActionButtonSx(theme, colorTheme)}
          >
            <AddPhotoAlternateIcon />
          </IconButton>
        </label>
        
        {photo && onRemovePhoto && (
          <IconButton
            onClick={handleRemovePhoto}
            sx={{
              ...getDaysTogetherActionButtonSx(theme, colorTheme),
              color: 'error.main',
              bgcolor: (muiTheme) => alpha(muiTheme.palette.error.main, muiTheme.palette.mode === 'light' ? 0.1 : 0.18),
              '&:hover': {
                bgcolor: (muiTheme) => alpha(muiTheme.palette.error.main, muiTheme.palette.mode === 'light' ? 0.18 : 0.28),
              },
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
