import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Divider,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

interface AddContentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (files: File[], target: 'self' | 'partner', frequency: { count: number, hours: number }, applyNow: boolean) => void;
  hasPartner: boolean;
}

const AddContentDialog: React.FC<AddContentDialogProps> = ({ open, onClose, onSave, hasPartner }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [target, setTarget] = useState<'partner'>('partner');
  const [contentCount, setContentCount] = useState<number>(3);
  const [hoursInterval, setHoursInterval] = useState<number>(24);
  const [applyNow, setApplyNow] = useState<boolean>(true);
  const [showFrequencyChange, setShowFrequencyChange] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles([...files, ...newFiles]);
      
      // Создаем URL превью для каждого файла
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]); // Освобождаем URL
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSave = () => {
    onSave(files, target, { count: contentCount, hours: hoursInterval }, applyNow);
    handleClose();
  };

  const handleClose = () => {
    // Очищаем состояние при закрытии
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    setTarget('partner');
    setContentCount(3);
    setHoursInterval(24);
    setApplyNow(true);
    setShowFrequencyChange(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Добавить контент
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Для кого добавляем контент?</FormLabel>
            <RadioGroup
              row
              value={target}
              onChange={(e) => setTarget(e.target.value as 'partner')}
            >
              <FormControlLabel value="self" control={<Radio />} label="Для себя" />
              {hasPartner && (
                <FormControlLabel value="partner" control={<Radio />} label="Для партнера" />
              )}
            </RadioGroup>
          </FormControl>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Загрузить фото или видео
          </Typography>
          <input
            accept="image/*,video/*"
            style={{ display: 'none' }}
            id="upload-media"
            multiple
            type="file"
            onChange={handleFileChange}
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
                    onClick={() => handleRemoveFile(index)}
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
                  setContentCount(Number(e.target.value));
                  if (files.length > 0) {
                    setShowFrequencyChange(true);
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
                  setHoursInterval(Number(e.target.value));
                  if (files.length > 0) {
                    setShowFrequencyChange(true);
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
          
          <Typography variant="body2" color="text.secondary">
            Будет показываться по {contentCount} фото/видео каждые {hoursInterval} часов
          </Typography>
        </Box>

        {showFrequencyChange && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Вы изменили частоту отображения контента. Когда применить изменения?
            </Alert>
            <FormControl component="fieldset">
              <RadioGroup
                value={applyNow ? 'now' : 'later'}
                onChange={(e) => setApplyNow(e.target.value === 'now')}
              >
                <FormControlLabel 
                  value="now" 
                  control={<Radio />} 
                  label="Применить сразу после сохранения" 
                />
                <FormControlLabel 
                  value="later" 
                  control={<Radio />} 
                  label="Применить после истечения предыдущего интервала" 
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Отмена</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={files.length === 0}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddContentDialog; 