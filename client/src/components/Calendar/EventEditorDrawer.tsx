import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  TextField,
  Button,
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
import StopCircleIcon from '@mui/icons-material/StopCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CustomSnackbar from '../UI/CustomSnackbar';
import { deleteUploadedEncryptedFiles } from '../../crypto/encryptedUploadService';
import { isSaveAborted } from '../../utils/saveAbort';
import { isVideoCompressionError } from '../../utils/compressVideo';
import { assertFilesReadable } from '../../utils/validateReadableFiles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useEventDraft } from './hooks/useEventDraft';
import { useAuth } from '../../contexts/AuthContext';
import { validateAndFilterMediaFiles } from '../../utils/validateMediaFile';
import {
  formatCalendarDate,
  getDateFnsLocale,
  getVideoLimitsHint
} from '../../localization/calendarHelpers';
import { isVideoFile } from '../../utils/videoMetadata';
import ContentViewer from './ContentViewer';
import DecryptedMedia from '../common/DecryptedMedia';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';

interface EventMediaItem {
  _id: string;
  url: string;
  resourceType: 'image' | 'video';
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
}

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
    media?: EventMediaItem[];
  } | null;
  onSave: (
    eventData: {
      date: Date;
      title: string;
      description: string;
      files: File[];
      isBirthdayEvent?: boolean;
      isAnniversaryEvent?: boolean;
    },
    saveOptions?: {
      signal?: AbortSignal;
      onFileUploaded?: (publicId: string) => void;
    }
  ) => Promise<void>;
  onUpdate?: (
    eventId: string,
    eventData: {
      date: Date;
      title: string;
      description: string;
      files: File[];
      removeMediaIds: string[];
      isBirthdayEvent?: boolean;
      isAnniversaryEvent?: boolean;
    },
    saveOptions?: {
      signal?: AbortSignal;
      onFileUploaded?: (publicId: string) => void;
    }
  ) => Promise<void>;
}

type SaveSnapshot = {
  selectedDate: Date | null;
  title: string;
  description: string;
  files: File[];
  previews: string[];
  isBirthdayEvent: boolean;
  isAnniversaryEvent: boolean;
  existingMedia: EventMediaItem[];
  removedMediaIds: string[];
};

const EVENT_DESCRIPTION_MAX_LENGTH = 5000;
const TITLE_MAX_LENGTH = 100;

const EventEditorDrawer: React.FC<EventEditorDrawerProps> = ({
  open,
  onClose,
  initialDate,
  editEvent,
  onSave,
  onUpdate
}) => {
  const { t, i18n } = useTranslation();
  const isEditMode = !!editEvent;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const eventFlagBoxSx = (filledBackground = false) => ({
    mb: 3,
    p: 2,
    borderRadius: 1,
    border: '1px solid',
    ...(theme.palette.mode === 'dark'
      ? {
          borderColor: 'rgba(144, 202, 249, 0.25)',
          bgcolor: 'rgba(144, 202, 249, 0.08)',
        }
      : {
          borderColor: theme.palette.info.main,
          bgcolor: filledBackground ? theme.palette.info.light : 'transparent',
        }),
  });
  
  const { draft, updateDraft, flushDraft, clearDraft, hasDraft, isDraftLoaded } = useEventDraft();
  
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
  const [existingMedia, setExistingMedia] = useState<EventMediaItem[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerContent, setViewerContent] = useState<{
    mediaUrl: string;
    resourceType: 'image' | 'video';
  } | null>(null);
  const [lockedToastOpen, setLockedToastOpen] = useState(false);

  const saveAbortRef = useRef<AbortController | null>(null);
  const saveSnapshotRef = useRef<SaveSnapshot | null>(null);
  const uploadedPublicIdsRef = useRef<string[]>([]);

  const showLockedToast = useCallback(() => {
    if (isSaving) {
      setLockedToastOpen(true);
    }
  }, [isSaving]);

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

    if (isInitialized || !isDraftLoaded) return;

    if (isEditMode && editEvent) {
      // Режим редактирования - загружаем данные события
      setSelectedDate(new Date(editEvent.eventDate));
      setTitle(editEvent.title);
      setDescription(editEvent.description || '');
      setFiles([]);
      setPreviews([]);
      setExistingMedia(
        (editEvent.media || []).filter((item) => item.url && item.url.trim().length > 0)
      );
      setRemovedMediaIds([]);
      setIsBirthdayEvent(editEvent.isBirthdayEvent || false);
      setIsAnniversaryEvent(editEvent.isAnniversaryEvent || false);
    } else {
      // Режим создания — дата с клика по календарю важнее черновика
      setSelectedDate(initialDate || draft.date || new Date());
      setTitle(hasDraft ? draft.title || '' : '');
      setDescription(hasDraft ? draft.description || '' : '');
      const draftFiles = hasDraft ? draft.files : [];
      setFiles(draftFiles);
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return draftFiles.map((file) => URL.createObjectURL(file));
      });
      setExistingMedia([]);
      setRemovedMediaIds([]);
    }

    setIsInitialized(true);
  }, [
    open,
    initialDate?.getTime(),
    editEvent?.eventId,
    isEditMode,
    hasDraft,
    isDraftLoaded,
    draft.date,
    draft.title,
    draft.description,
    draft.files
  ]);

  // Автосохранение изменений (только если не в режиме редактирования и не идёт сохранение)
  useEffect(() => {
    if (!open || !isInitialized || isEditMode || isSaving) return;

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
  }, [selectedDate?.getTime(), title, description, files.length, previews.length, open, isInitialized, isEditMode, isSaving, updateDraft]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isSaving) {
      showLockedToast();
      return;
    }
    if (!event.target.files) return;

    const { accepted, errors } = await validateAndFilterMediaFiles(Array.from(event.target.files));
    event.target.value = '';

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    if (accepted.length === 0) return;

    setFiles((prev) => [...prev, ...accepted]);
    setPreviews((prev) => [...prev, ...accepted.map((file) => URL.createObjectURL(file))]);
  };

  const handlePreviewClick = (index: number) => {
    setViewerContent({
      mediaUrl: previews[index],
      resourceType: files[index].type.startsWith('image/') ? 'image' : 'video'
    });
    setViewerOpen(true);
  };

  const handleRemoveFile = (index: number) => {
    if (isSaving) {
      showLockedToast();
      return;
    }
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]); // Освобождаем URL
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleRemoveExistingMedia = (mediaId: string) => {
    if (isSaving) {
      showLockedToast();
      return;
    }
    setExistingMedia((prev) => prev.filter((item) => item._id !== mediaId));
    setRemovedMediaIds((prev) => [...prev, mediaId]);
  };

  const handleSave = async () => {
    if (isSaving) return;

    if (!selectedDate) {
      setError(t('calendar.errors.selectDate'));
      return;
    }

    if (!title.trim()) {
      setError(t('calendar.errors.enterTitle'));
      return;
    }

    try {
      await assertFilesReadable(files);
    } catch {
      setError(t('calendar.errors.unreadableMedia'));
      return;
    }

    saveSnapshotRef.current = {
      selectedDate,
      title,
      description,
      files: [...files],
      previews: [...previews],
      isBirthdayEvent,
      isAnniversaryEvent,
      existingMedia: [...existingMedia],
      removedMediaIds: [...removedMediaIds]
    };
    uploadedPublicIdsRef.current = [];

    const abortController = new AbortController();
    saveAbortRef.current = abortController;

    const saveOptions = {
      signal: abortController.signal,
      onFileUploaded: (publicId: string) => {
        uploadedPublicIdsRef.current = [...uploadedPublicIdsRef.current, publicId];
      }
    };

    try {
      setIsSaving(true);
      setError(null);
      
      if (isEditMode && editEvent && onUpdate) {
        await onUpdate(
          editEvent.eventId,
          {
            date: selectedDate,
            title: title.trim(),
            description: description.trim(),
            files,
            removeMediaIds: removedMediaIds,
            isBirthdayEvent,
            isAnniversaryEvent
          },
          saveOptions
        );
      } else {
        await onSave(
          {
            date: selectedDate,
            title: title.trim(),
            description: description.trim(),
            files,
            isBirthdayEvent,
            isAnniversaryEvent
          },
          saveOptions
        );
        
        clearDraft();
      }
      
      previews.forEach(url => URL.revokeObjectURL(url));
      setTitle('');
      setDescription('');
      setFiles([]);
      setPreviews([]);
      setExistingMedia([]);
      setRemovedMediaIds([]);
      setSelectedDate(new Date());
      
      onClose();
    } catch (error) {
      if (isSaveAborted(error)) {
        return;
      }
      console.error('Ошибка при сохранении события:', error);
      if (isVideoCompressionError(error)) {
        console.error('Детали сжатия видео:', error.details);
      }
      const message =
        error instanceof Error && error.message === 'UNREADABLE_MEDIA'
          ? t('calendar.errors.unreadableMedia')
          : error instanceof Error
            ? error.message
            : t('calendar.errors.saveEventFailed');
      setError(message);
    } finally {
      if (!abortController.signal.aborted) {
        setIsSaving(false);
        saveAbortRef.current = null;
        saveSnapshotRef.current = null;
        uploadedPublicIdsRef.current = [];
      }
    }
  };

  const handleCancelSave = async () => {
    if (!isSaving) return;

    saveAbortRef.current?.abort();

    const uploadedIds = [...uploadedPublicIdsRef.current];
    await deleteUploadedEncryptedFiles(uploadedIds);

    const snapshot = saveSnapshotRef.current;
    if (snapshot) {
      setSelectedDate(snapshot.selectedDate);
      setTitle(snapshot.title);
      setDescription(snapshot.description);
      setFiles(snapshot.files);
      setPreviews(snapshot.previews);
      setIsBirthdayEvent(snapshot.isBirthdayEvent);
      setIsAnniversaryEvent(snapshot.isAnniversaryEvent);
      setExistingMedia(snapshot.existingMedia);
      setRemovedMediaIds(snapshot.removedMediaIds);
    }

    setError(null);
    setIsSaving(false);
    saveAbortRef.current = null;
    saveSnapshotRef.current = null;
    uploadedPublicIdsRef.current = [];
  };

  const handleClose = () => {
    setViewerOpen(false);
    if (!isEditMode && isInitialized) {
      void flushDraft({
        date: selectedDate,
        title,
        description,
        files,
        previews: []
      });
    }
    onClose();
  };

  const handleClearForm = () => {
    if (isSaving) {
      showLockedToast();
      return;
    }
    previews.forEach((url) => URL.revokeObjectURL(url));
    setTitle('');
    setDescription('');
    setFiles([]);
    setPreviews([]);
    setSelectedDate(initialDate || new Date());
    clearDraft();
  };

  const canSave = selectedDate && title.trim().length > 0;

  return (
    <>
    <Drawer
      anchor="right"
      open={open}
      onClose={(_event, reason) => {
        if (isSaving) {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            showLockedToast();
          }
          return;
        }
        handleClose();
      }}
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
              onClick={() => {
                if (isSaving) {
                  showLockedToast();
                  return;
                }
                handleClose();
              }}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
              {isEditMode ? t('calendar.event.edit') : t('calendar.event.new')}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Основной контент */}
        <Box
          sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}
          onClickCapture={(event) => {
            if (!isSaving) return;
            const target = event.target as HTMLElement;
            if (target.closest('button, a, [role="button"]')) return;
            showLockedToast();
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Выбор даты */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={getDateFnsLocale(i18n.language)}>
            <DatePicker
              label={t('calendar.event.date')}
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              disabled={isSaving}
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
            label={t('calendar.event.title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('calendar.event.titlePlaceholder')}
            sx={{ mb: 3 }}
            required
            disabled={isSaving}
            inputProps={{ maxLength: TITLE_MAX_LENGTH }}
            helperText={t('calendar.event.charCount', { current: title.length, max: TITLE_MAX_LENGTH })}
          />

          {/* Описание */}
          <TextField
            fullWidth
            multiline
            minRows={4}
            maxRows={8}
            label={t('calendar.event.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('calendar.event.descriptionPlaceholder')}
            sx={{ mb: 3 }}
            disabled={isSaving}
            inputProps={{ maxLength: EVENT_DESCRIPTION_MAX_LENGTH }}
            helperText={t('calendar.event.charCount', { current: description.length, max: EVENT_DESCRIPTION_MAX_LENGTH })}
          />

          {/* Чекбокс дня рождения */}
          {isDateNearBirthday(selectedDate) && (
            <Box sx={eventFlagBoxSx()}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isBirthdayEvent}
                    onChange={(e) => setIsBirthdayEvent(e.target.checked)}
                    color="primary"
                    disabled={isSaving}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {t('calendar.event.birthdayFlag')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {t('calendar.event.birthdayHint')}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          )}

          {/* Чекбокс годовщины */}
          {isDateNearAnniversary(selectedDate) && (
            <Box sx={eventFlagBoxSx(true)}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAnniversaryEvent}
                    onChange={(e) => setIsAnniversaryEvent(e.target.checked)}
                    color="primary"
                    disabled={isSaving}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {t('calendar.event.anniversaryFlag')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {t('calendar.event.anniversaryHint')}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          )}

          {/* Загрузка медиа */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {t('calendar.media.photosAndVideos')}
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
                disabled={isSaving}
              >
                {t('calendar.media.addPhotosOrVideos')}
              </Button>
            </label>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('calendar.media.supported')} {getVideoLimitsHint(t)}
            </Typography>
          </Box>

          {isEditMode && existingMedia.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              {existingMedia.map((media) => (
                <Box
                  key={media._id}
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
                  <DecryptedMedia
                    cacheKey={`event-edit-${editEvent?.eventId}-${media._id}`}
                    url={media.url}
                    resourceType={media.resourceType}
                    encrypted={media.encrypted}
                    mediaEnvelope={media.mediaEnvelope}
                    videoPreview={media.resourceType === 'video'}
                    onImageClick={(blobUrl) => {
                      setViewerContent({
                        mediaUrl: blobUrl,
                        resourceType: media.resourceType
                      });
                      setViewerOpen(true);
                    }}
                    imageStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loadingMinHeight={120}
                  />
                  {!isSaving && (
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
                      onClick={() => handleRemoveExistingMedia(media._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Превью новых файлов */}
          {previews.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              {previews.map((preview, index) => (
                <Box
                  key={index}
                  onClick={() => handlePreviewClick(index)}
                  sx={{
                    position: 'relative',
                    width: 120,
                    height: 120,
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: 'divider',
                    cursor: 'pointer'
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
                  {!isSaving && (
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
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
                    {formatCalendarDate(new Date(files[index].lastModified), i18n.language)}
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
          {(!isEditMode && (title || description || files.length > 0)) || isSaving ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isEditMode && (title || description || files.length > 0) && (
                <Button
                  sx={{ flex: 1 }}
                  variant="text"
                  size="small"
                  onClick={handleClearForm}
                  disabled={isSaving}
                  startIcon={<DeleteIcon />}
                >
                  {t('calendar.event.clearDraft')}
                </Button>
              )}
              {isSaving && (
                <Button
                  sx={{ flex: !isEditMode && (title || description || files.length > 0) ? undefined : 1 }}
                  variant="outlined"
                  size="small"
                  color="warning"
                  onClick={handleCancelSave}
                  startIcon={<StopCircleIcon />}
                >
                  {t('calendar.event.cancelSave')}
                </Button>
              )}
            </Box>
          ) : null}
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClose}
              disabled={isSaving}
            >
              {t('calendar.common.cancel')}
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={!canSave || isSaving}
              startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {isSaving
                ? files.some(isVideoFile)
                  ? t('calendar.event.compressingVideo')
                  : t('calendar.common.saving')
                : t('calendar.common.save')}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
      <ContentViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        content={viewerContent}
        stackAboveParentModal
      />
      <CustomSnackbar
        open={lockedToastOpen}
        message={t('calendar.event.savingLockedWarning')}
        severity="warning"
        onClose={() => setLockedToastOpen(false)}
      />
    </>
  );
};

export default EventEditorDrawer;

