import React, { useEffect, useMemo } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { validateAndFilterMediaFiles } from '../../utils/validateMediaFile';
import { VIDEO_LIMITS_HINT } from '../../utils/mediaLimits';

export interface ExistingMediaItem {
  id: string;
  url: string;
  resourceType: 'image' | 'video';
  publicId?: string;
}

interface MediaFilePickerProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  inputId?: string;
  label?: string;
  existingMedia?: ExistingMediaItem[];
  onRemoveExisting?: (id: string) => void;
  onError?: (message: string) => void;
}

const formatFileDate = (file: File) =>
  format(new Date(file.lastModified), 'd MMMM yyyy', { locale: ru });

const MediaFilePicker: React.FC<MediaFilePickerProps> = ({
  files,
  onFilesChange,
  disabled = false,
  inputId = 'media-file-upload',
  label = 'Добавить фото или видео',
  existingMedia = [],
  onRemoveExisting,
  onError,
}) => {
  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }

    const { accepted, errors } = await validateAndFilterMediaFiles(Array.from(event.target.files));
    event.target.value = '';

    if (errors.length > 0) {
      onError?.(errors.join(' '));
    }

    if (accepted.length === 0) {
      return;
    }

    onFilesChange([...files, ...accepted]);
  };

  const handleRemoveFile = (index: number) => {
    const nextFiles = [...files];
    nextFiles.splice(index, 1);
    onFilesChange(nextFiles);
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Фото и видео
      </Typography>
      <input
        accept="image/*,video/*"
        style={{ display: 'none' }}
        id={inputId}
        multiple
        type="file"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <label htmlFor={inputId}>
        <Button
          variant="outlined"
          component="span"
          startIcon={<CloudUploadIcon />}
          fullWidth
          disabled={disabled}
        >
          {label}
        </Button>
      </label>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Поддерживаются изображения (JPG, PNG, GIF) и видео (MP4, MOV). {VIDEO_LIMITS_HINT}
      </Typography>

      {existingMedia.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          {existingMedia.map((media) => (
            <Box
              key={media.id}
              sx={{
                position: 'relative',
                width: 120,
                height: 120,
                borderRadius: 1,
                overflow: 'hidden',
                border: '2px solid',
                borderColor: 'divider',
              }}
            >
              {media.resourceType === 'image' ? (
                <Box
                  component="img"
                  src={media.url}
                  alt=""
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Box
                  component="video"
                  src={media.url}
                  muted
                  playsInline
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              {onRemoveExisting && (
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'error.light',
                      color: 'white',
                    },
                  }}
                  onClick={() => onRemoveExisting(media.id)}
                  disabled={disabled}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>
      )}

      {files.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          {files.map((file, index) => (
            <Box
              key={`${file.name}-${file.lastModified}-${file.size}-${index}`}
              sx={{
                position: 'relative',
                width: 120,
                height: 120,
                borderRadius: 1,
                overflow: 'hidden',
                border: '2px solid',
                borderColor: 'divider',
              }}
            >
              {file.type.startsWith('image/') ? (
                <Box
                  component="img"
                  src={previewUrls[index]}
                  alt={`Preview ${index}`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Box
                  component="video"
                  src={previewUrls[index]}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'error.light',
                    color: 'white',
                  },
                }}
                onClick={() => handleRemoveFile(index)}
                disabled={disabled}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  p: 0.5,
                  textAlign: 'center',
                }}
              >
                {formatFileDate(file)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MediaFilePicker;
