import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography,
  IconButton
} from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

interface AddContentDialogProps {
  open: boolean;
  onClose: () => void;
  date: Date | null;
  onSave: (files: File[]) => void;
}

const AddContentDialog: React.FC<AddContentDialogProps> = ({ open, onClose, date, onSave }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

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
    onSave(files);
    // Очищаем состояние
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    onClose();
  };

  const handleClose = () => {
    // Очищаем состояние при закрытии
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Добавить контент на {date ? format(date, 'd MMMM yyyy', { locale: ru }) : ''}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
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
              Выбрать фото или видео
            </Button>
          </label>
          <Typography variant="body2" color="text.secondary">
            Поддерживаются изображения (JPG, PNG, GIF) и видео (MP4, MOV)
          </Typography>
        </Box>

        {previews.length > 0 && (
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