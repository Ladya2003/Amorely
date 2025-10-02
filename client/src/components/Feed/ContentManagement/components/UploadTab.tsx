// Вкладка загрузки нового контента

import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface UploadTabProps {
  files: File[];
  previews: string[];
  contentCount: number;
  hoursInterval: number;
  hasFrequencyChanges: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onContentCountChange: (count: number) => void;
  onHoursIntervalChange: (hours: number) => void;
  onShowFrequencyChange: (show: boolean) => void;
}

const UploadTab: React.FC<UploadTabProps> = ({
  files,
  previews,
  contentCount,
  hoursInterval,
  hasFrequencyChanges,
  onFileChange,
  onRemoveFile,
  onContentCountChange,
  onHoursIntervalChange,
  onShowFrequencyChange
}) => {
  return (
    <>
      <Box sx={{ mb: 3, mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Загрузить фото или видео
        </Typography>
        <input
          accept="image/*,video/*"
          style={{ display: 'none' }}
          id="upload-media"
          multiple
          type="file"
          onChange={onFileChange}
        />
        <label htmlFor="upload-media">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 2 }}
          >
            Выбрать файлы
          </Button>
        </label>
        <Typography variant="body2" color="text.secondary">
          Поддерживаются изображения (JPG, PNG, GIF) и видео (MP4, MOV)
        </Typography>
      </Box>

      {previews.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Выбранные файлы ({previews.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {previews.map((preview, index) => (
              <Box
                key={index}
                sx={{
                  position: 'relative',
                  width: 100,
                  height: 100
                }}
              >
                {files[index].type.startsWith('image/') ? (
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                  />
                ) : (
                  <video
                    src={preview}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                  />
                )}
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'error.light',
                      color: 'white'
                    }
                  }}
                  onClick={() => onRemoveFile(index)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Настройки отображения
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Количество контента</InputLabel>
            <Select
              value={contentCount}
              onChange={(e) => {
                onContentCountChange(Number(e.target.value));
                if (files.length > 0) {
                  onShowFrequencyChange(true);
                }
              }}
              label="Количество контента"
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <MenuItem key={num} value={num}>{num}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Интервал (часы)</InputLabel>
            <Select
              value={hoursInterval}
              onChange={(e) => {
                onHoursIntervalChange(Number(e.target.value));
                if (files.length > 0) {
                  onShowFrequencyChange(true);
                }
              }}
              label="Интервал (часы)"
            >
              {[4, 8, 12, 24, 48, 72].map((hours) => (
                <MenuItem key={hours} value={hours}>{hours}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mt: 1 }}>
          {files.length > 0
            ? `Будет показываться по ${contentCount} фото/видео каждые ${hoursInterval} часов`
            : `Настройки будут применены ко всему существующему контенту: по ${contentCount} фото/видео каждые ${hoursInterval} часов`
          }
        </Alert>
      </Box>
    </>
  );
};

export default UploadTab;

