import React, { useState, useEffect } from 'react';
import {
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  TextField,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format } from 'date-fns';
import { useEventDraft } from './hooks/useEventDraft';

interface EventEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  onSave: (eventData: {
    date: Date;
    title: string;
    description: string;
    files: File[];
  }) => Promise<void>;
}

const EventEditorDrawer: React.FC<EventEditorDrawerProps> = ({
  open,
  onClose,
  initialDate,
  onSave
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { draft, updateDraft, clearDraft, hasDraft, isSaving: isAutosaving } = useEventDraft();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Инициализация при открытии drawer
  useEffect(() => {
    if (!open) {
      // При закрытии сбрасываем флаг инициализации
      if (isInitialized) {
        setIsInitialized(false);
      }
      return;
    }

    if (isInitialized) return; // Уже инициализировано

    // Проверяем наличие сохраненного черновика
    const savedDraft = hasDraft();
    if (savedDraft && draft.title) {
      // Восстанавливаем из черновика
      setSelectedDate(draft.date || initialDate || new Date());
      setTitle(draft.title);
      setDescription(draft.description);
    } else {
      // Используем initialDate или текущую дату
      setSelectedDate(initialDate || new Date());
      setTitle('');
      setDescription('');
    }
    
    setFiles([]);
    setPreviews([]);
    setIsInitialized(true);
  }, [open]); // Срабатывает только при изменении open

  // Автосохранение изменений
  useEffect(() => {
    if (!open || !isInitialized) return;

    const timer = setTimeout(() => {
      updateDraft({
        date: selectedDate,
        title,
        description,
        files,
        previews
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedDate?.getTime(), title, description, files.length, previews.length, open, isInitialized, updateDraft]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      
      // Создаем URL превью для каждого файла
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
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

  const handleSave = async () => {
    if (!selectedDate) {
      setError('Пожалуйста, выберите дату события');
      return;
    }

    if (!title.trim()) {
      setError('Пожалуйста, введите заголовок события');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      await onSave({
        date: selectedDate,
        title: title.trim(),
        description: description.trim(),
        files
      });

      // Очищаем черновик после успешного сохранения
      clearDraft();
      
      // Очищаем локальное состояние
      previews.forEach(url => URL.revokeObjectURL(url));
      setTitle('');
      setDescription('');
      setFiles([]);
      setPreviews([]);
      setSelectedDate(new Date());
      
      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении события:', error);
      setError('Не удалось сохранить событие. Попробуйте еще раз.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Не очищаем черновик при закрытии - он автоматически сохранен
    onClose();
  };

  const canSave = selectedDate && title.trim().length > 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : '500px',
          maxWidth: '100vw'
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Верхняя панель */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
              Новое событие
            </Typography>
            {isAutosaving && (
              <Chip 
                label="Сохранение..." 
                size="small" 
                color="default"
                icon={<CircularProgress size={12} />}
              />
            )}
          </Toolbar>
        </AppBar>

        {/* Основной контент */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Выбор даты */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <DatePicker
              label="Дата события"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { mb: 3 },
                  InputProps: {
                    startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: 'action.active' }} />
                  }
                }
              }}
            />
          </LocalizationProvider>

          {/* Заголовок */}
          <TextField
            fullWidth
            label="Заголовок события"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Первое свидание"
            sx={{ mb: 3 }}
            required
            inputProps={{ maxLength: 100 }}
            helperText={`${title.length}/100 символов`}
          />

          {/* Описание */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Описание (необязательно)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Расскажите о событии..."
            sx={{ mb: 3 }}
            inputProps={{ maxLength: 500 }}
            helperText={`${description.length}/500 символов`}
          />

          {/* Загрузка медиа */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Фото и видео
            </Typography>
            <input
              accept="image/*,video/*"
              style={{ display: 'none' }}
              id="event-media-upload"
              multiple
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="event-media-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                Добавить фото или видео
              </Button>
            </label>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Поддерживаются изображения (JPG, PNG, GIF) и видео (MP4, MOV)
            </Typography>
          </Box>

          {/* Превью загруженных файлов */}
          {previews.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              {previews.map((preview, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'relative',
                    width: 120,
                    height: 120,
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: 'divider'
                  }}
                >
                  {files[index].type.startsWith('image/') ? (
                    <img
                      src={preview}
                      alt={`Preview ${index}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <video
                      src={preview}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
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
                        color: 'white'
                      }
                    }}
                    onClick={() => handleRemoveFile(index)}
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
                      textAlign: 'center'
                    }}
                  >
                    {files[index].name.length > 15
                      ? files[index].name.substring(0, 15) + '...'
                      : files[index].name}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Нижняя панель с кнопками */}
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            p: 2,
            display: 'flex',
            gap: 2
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={handleClose}
            disabled={isSaving}
          >
            Отмена
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!canSave || isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default EventEditorDrawer;

