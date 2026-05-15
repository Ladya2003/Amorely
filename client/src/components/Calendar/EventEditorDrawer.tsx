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
  Alert,
  FormControlLabel,
  Checkbox
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
import { useAuth } from '../../contexts/AuthContext';

interface EventEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  editEvent?: {
    eventId: string;
    title: string;
    description?: string;
    eventDate: string;
    isBirthdayEvent?: boolean;
    isAnniversaryEvent?: boolean;
  } | null;
  onSave: (eventData: {
    date: Date;
    title: string;
    description: string;
    files: File[];
    isBirthdayEvent?: boolean;
    isAnniversaryEvent?: boolean;
  }) => Promise<void>;
  onUpdate?: (eventId: string, eventData: {
    date: Date;
    title: string;
    description: string;
    isBirthdayEvent?: boolean;
    isAnniversaryEvent?: boolean;
  }) => Promise<void>;
}

const EventEditorDrawer: React.FC<EventEditorDrawerProps> = ({
  open,
  onClose,
  initialDate,
  editEvent,
  onSave,
  onUpdate
}) => {
  const isEditMode = !!editEvent;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const { draft, updateDraft, clearDraft, hasDraft, isSaving: isAutosaving } = useEventDraft();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBirthdayEvent, setIsBirthdayEvent] = useState(false);
  const [isAnniversaryEvent, setIsAnniversaryEvent] = useState(false);

  // Функция для проверки, находится ли дата в диапазоне дня рождения
  const isDateNearBirthday = (date: Date | null): boolean => {
    if (!date || !user?.birthday) return false;
    
    const userBirthday = new Date(user.birthday);
    const eventDate = new Date(date);
    
    // Создаем даты для текущего года
    const currentYear = new Date().getFullYear();
    const birthdayThisYear = new Date(currentYear, userBirthday.getMonth(), userBirthday.getDate());
    
    // Проверяем диапазон ±2 недели
    const twoWeeksAgo = new Date(birthdayThisYear);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const twoWeeksLater = new Date(birthdayThisYear);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    
    return eventDate >= twoWeeksAgo && eventDate <= twoWeeksLater;
  };

  // Функция для проверки, находится ли дата в диапазоне годовщины
  const isDateNearAnniversary = (date: Date | null): boolean => {
    if (!date || !user?.relationshipStartDate) return false;
    
    const relationshipStart = new Date(user.relationshipStartDate);
    const eventDate = new Date(date);
    
    // Создаем даты для года события (не текущего года!)
    const eventYear = eventDate.getFullYear();
    const anniversaryThisYear = new Date(eventYear, relationshipStart.getMonth(), relationshipStart.getDate());
    
    // Проверяем диапазон ±2 недели
    const twoWeeksAgo = new Date(anniversaryThisYear);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const twoWeeksLater = new Date(anniversaryThisYear);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    
    
    return eventDate >= twoWeeksAgo && eventDate <= twoWeeksLater;
  };

  // Обновляем состояние чекбокса дня рождения при изменении даты
  // Только если не в режиме редактирования (чтобы не перезаписывать сохраненное значение)
  useEffect(() => {
    if (!isEditMode) {
      setIsBirthdayEvent(isDateNearBirthday(selectedDate));
      setIsAnniversaryEvent(isDateNearAnniversary(selectedDate));
    }
  }, [selectedDate, user?.birthday, user?.relationshipStartDate, isEditMode]);

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

    if (isEditMode && editEvent) {
      // Режим редактирования - загружаем данные события
      setSelectedDate(new Date(editEvent.eventDate));
      setTitle(editEvent.title);
      setDescription(editEvent.description || '');
      setFiles([]);
      setPreviews([]);
      setIsBirthdayEvent(editEvent.isBirthdayEvent || false);
      setIsAnniversaryEvent(editEvent.isAnniversaryEvent || false);
    } else {
      // Режим создания - проверяем есть ли черновик
      if (hasDraft && draft.date) {
        // Восстанавливаем данные из черновика
        setSelectedDate(draft.date);
        setTitle(draft.title || '');
        setDescription(draft.description || '');
        setFiles([]); // Файлы не восстанавливаем
        setPreviews([]);
      } else {
        // Начинаем с чистого листа
        setSelectedDate(initialDate || new Date());
        setTitle('');
        setDescription('');
        setFiles([]);
        setPreviews([]);
      }
    }
    
    setIsInitialized(true);
  }, [open]); // Срабатывает только при изменении open

  // Автосохранение изменений (только если не в режиме редактирования)
  useEffect(() => {
    if (!open || !isInitialized || isEditMode) return;

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
  }, [selectedDate?.getTime(), title, description, files.length, previews.length, open, isInitialized, isEditMode, updateDraft]);

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
      
      if (isEditMode && editEvent && onUpdate) {
        // Режим редактирования
        await onUpdate(editEvent.eventId, {
          date: selectedDate,
          title: title.trim(),
          description: description.trim(),
          isBirthdayEvent,
          isAnniversaryEvent
        });
      } else {
        // Режим создания
        await onSave({
          date: selectedDate,
          title: title.trim(),
          description: description.trim(),
          files,
          isBirthdayEvent,
          isAnniversaryEvent
        });
        
        // Очищаем черновик после успешного создания
        clearDraft();
      }
      
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
      const message =
        error instanceof Error ? error.message : 'Не удалось сохранить событие. Попробуйте еще раз.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Не очищаем черновик при закрытии - данные сохранятся для повторного открытия
    onClose();
  };

  const handleClearForm = () => {
    // Очищаем форму и черновик
    setTitle('');
    setDescription('');
    setFiles([]);
    setPreviews([]);
    setSelectedDate(initialDate || new Date());
    clearDraft();
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
              {isEditMode ? 'Редактировать событие' : 'Новое событие'}
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

          {/* Чекбокс дня рождения */}
          {isDateNearBirthday(selectedDate) && (
            <Box sx={{ mb: 3, p: 2, borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isBirthdayEvent}
                    onChange={(e) => setIsBirthdayEvent(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      🎂 Отнести ко дню рождения
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Это событие будет показываться в ленте на день рождения
                    </Typography>
                  </Box>
                }
              />
            </Box>
          )}

          {/* Чекбокс годовщины */}
          {isDateNearAnniversary(selectedDate) && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAnniversaryEvent}
                    onChange={(e) => setIsAnniversaryEvent(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      💕 Отнести к годовщине
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Это событие будет показываться в ленте на годовщину отношений
                    </Typography>
                  </Box>
                }
              />
            </Box>
          )}

          {/* Загрузка медиа */}
          {!isEditMode && (
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
                Поддерживаются изображения (JPG, PNG, GIF) и видео (MP4, MOV). Фото необязательны.
              </Typography>
            </Box>
          )}
          
          {isEditMode && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
              Примечание: При редактировании нельзя изменить медиафайлы
            </Typography>
          )}

          {/* Превью загруженных файлов */}
          {!isEditMode && previews.length > 0 && (
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
            flexDirection: 'column',
            gap: 1
          }}
        >
          {/* Показываем кнопку очистки, если есть данные и не в режиме редактирования */}
          {!isEditMode && (title || description || files.length > 0) && (
            <Button
              fullWidth
              variant="text"
              size="small"
              onClick={handleClearForm}
              disabled={isSaving}
              startIcon={<DeleteIcon />}
            >
              Очистить данные
            </Button>
          )}
          
          <Box sx={{ display: 'flex', gap: 2 }}>
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
      </Box>
    </Drawer>
  );
};

export default EventEditorDrawer;

