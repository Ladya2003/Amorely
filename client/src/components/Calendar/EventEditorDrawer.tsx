import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
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
  Checkbox,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { getModalFooterActionsSx } from '../../theme/appTheme';
import {
  getCalendarDrawerContentSx,
  getCalendarDrawerFooterSx,
  getCalendarDrawerHeaderIconButtonSx,
  getCalendarDrawerHeaderSx,
  getCalendarDrawerHeaderTitleSx,
  getCalendarDrawerHeaderWrapSx,
  getCalendarDrawerPaperSx,
  getEventEditorFlagBoxSx,
  getEventEditorUploadCardSx,
  getEventMediaDeleteButtonSx,
  getEventMediaNavButtonSx,
  getEventEditorMediaGridSx,
  getEventEditorMediaPreviewSx,
} from './calendarDrawerStyles';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CustomSnackbar from '../UI/CustomSnackbar';
import { deleteUploadedEncryptedFiles } from '../../crypto/encryptedUploadService';
import { isSaveAborted } from '../../utils/saveAbort';
import { formatErrorForUser } from '../../utils/videoCompressionDebug';
import type { PrepareMediaProgress } from '../../utils/parallelMediaPrepare';
import { assertFilesReadable } from '../../utils/validateReadableFiles';
import AppDatePicker from '../UI/AppDatePicker';
import { useEventDraft } from './hooks/useEventDraft';
import { useAuth } from '../../contexts/AuthContext';
import { validateAndFilterMediaFiles } from '../../utils/validateMediaFile';
import {
  DATE_INPUT_FORMAT,
  formatCalendarDate,
  getVideoLimitsHint
} from '../../localization/calendarHelpers';
import { isVideoFile } from '../../utils/videoMetadata';
import ContentViewer from './ContentViewer';
import DecryptedMedia from '../common/DecryptedMedia';
import EncryptedIndicator from '../common/EncryptedIndicator';
import { playChatSendSound, unlockChatAudio } from '../../utils/chatSounds';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  buildMediaSequence,
  createNewMediaItem,
  EventEditorMediaItem,
  EventMediaItem,
  getNewFilesFromMediaItems,
  moveMediaItem,
  sortEventMediaItems,
  revokeNewMediaPreviews,
  type EventMediaSequenceSlot,
} from './eventEditorMedia';

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
      onPrepareStart?: (progress: PrepareMediaProgress) => void;
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
      mediaSequence?: EventMediaSequenceSlot[];
      isBirthdayEvent?: boolean;
      isAnniversaryEvent?: boolean;
    },
    saveOptions?: {
      signal?: AbortSignal;
      onFileUploaded?: (publicId: string) => void;
      onPrepareStart?: (progress: PrepareMediaProgress) => void;
    }
  ) => Promise<void>;
}

type SaveSnapshot = {
  selectedDate: Date | null;
  title: string;
  description: string;
  mediaItems: EventEditorMediaItem[];
  isBirthdayEvent: boolean;
  isAnniversaryEvent: boolean;
  removedMediaIds: string[];
};

const EVENT_DESCRIPTION_MAX_LENGTH = 5000;
const TITLE_MAX_LENGTH = 100;

const eventMediaPreviewMediaStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

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
  const { draft, updateDraft, flushDraft, clearDraft, hasDraft, isDraftLoaded } = useEventDraft();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaItems, setMediaItems] = useState<EventEditorMediaItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [compressProgress, setCompressProgress] = useState<PrepareMediaProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBirthdayEvent, setIsBirthdayEvent] = useState(false);
  const [isAnniversaryEvent, setIsAnniversaryEvent] = useState(false);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerContent, setViewerContent] = useState<{
    mediaUrl: string;
    resourceType: 'image' | 'video';
  } | null>(null);
  const [lockedToastOpen, setLockedToastOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [multiVideoWarningOpen, setMultiVideoWarningOpen] = useState(false);

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
    
    // Создаем даты для года события (не текущего года!)
    const eventYear = eventDate.getFullYear();
    const birthdayThisYear = new Date(eventYear, userBirthday.getMonth(), userBirthday.getDate());
    
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
      setMediaItems(
        sortEventMediaItems(
          (editEvent.media || []).filter((item) => item.url && item.url.trim().length > 0)
        ).map((item) => ({ key: item._id, kind: 'existing' as const, media: item }))
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
      setMediaItems((prev) => {
        revokeNewMediaPreviews(prev);
        return draftFiles.map((file) => createNewMediaItem(file));
      });
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
        files: getNewFilesFromMediaItems(mediaItems),
        previews: []
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedDate?.getTime(), title, description, mediaItems, open, isInitialized, isEditMode, isSaving, updateDraft]);

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

    const acceptedVideos = accepted.filter(isVideoFile);
    const existingNewVideos = getNewFilesFromMediaItems(mediaItems).filter(isVideoFile).length;
    let toAdd = accepted;
    let showMultiVideoWarning = false;

    if (acceptedVideos.length > 1) {
      const firstVideo = acceptedVideos[0];
      toAdd = accepted.filter((file) => !isVideoFile(file) || file === firstVideo);
      showMultiVideoWarning = true;
    } else if (acceptedVideos.length === 1 && existingNewVideos >= 1) {
      toAdd = accepted.filter((file) => !isVideoFile(file));
      showMultiVideoWarning = true;
    }

    if (showMultiVideoWarning) {
      setMultiVideoWarningOpen(true);
    }

    if (toAdd.length === 0) return;

    setMediaItems((prev) => [...prev, ...toAdd.map((file) => createNewMediaItem(file))]);
  };

  const handlePreviewClick = (item: Extract<EventEditorMediaItem, { kind: 'new' }>) => {
    setViewerContent({
      mediaUrl: item.preview,
      resourceType: item.file.type.startsWith('image/') ? 'image' : 'video'
    });
    setViewerOpen(true);
  };

  const handlePreviewExistingClick = (media: EventMediaItem) => {
    setViewerContent({
      mediaUrl: media.url,
      resourceType: media.resourceType
    });
    setViewerOpen(true);
  };

  const handleRemoveMediaItem = (index: number) => {
    if (isSaving) {
      showLockedToast();
      return;
    }

    setMediaItems((prev) => {
      const item = prev[index];
      if (!item) {
        return prev;
      }

      if (item.kind === 'existing') {
        setRemovedMediaIds((removed) => [...removed, item.media._id]);
      } else {
        URL.revokeObjectURL(item.preview);
      }

      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleMoveMediaItem = (index: number, direction: -1 | 1) => {
    if (isSaving) {
      showLockedToast();
      return;
    }

    setMediaItems((prev) => moveMediaItem(prev, index, direction));
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

    const newFiles = getNewFilesFromMediaItems(mediaItems);

    try {
      await assertFilesReadable(newFiles);
    } catch {
      setError(t('calendar.errors.unreadableMedia'));
      return;
    }

    saveSnapshotRef.current = {
      selectedDate,
      title,
      description,
      mediaItems: [...mediaItems],
      isBirthdayEvent,
      isAnniversaryEvent,
      removedMediaIds: [...removedMediaIds]
    };
    uploadedPublicIdsRef.current = [];

    const abortController = new AbortController();
    saveAbortRef.current = abortController;

    const saveOptions = {
      signal: abortController.signal,
      onFileUploaded: (publicId: string) => {
        uploadedPublicIdsRef.current = [...uploadedPublicIdsRef.current, publicId];
      },
      onPrepareStart: (progress: PrepareMediaProgress) => {
        if (progress.isVideo) {
          setCompressProgress(progress);
        }
      }
    };

    try {
      setIsSaving(true);
      setCompressProgress(null);
      setError(null);
      
      if (isEditMode && editEvent && onUpdate) {
        await onUpdate(
          editEvent.eventId,
          {
            date: selectedDate,
            title: title.trim(),
            description: description.trim(),
            files: newFiles,
            removeMediaIds: removedMediaIds,
            mediaSequence: buildMediaSequence(mediaItems),
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
            files: newFiles,
            isBirthdayEvent,
            isAnniversaryEvent
          },
          saveOptions
        );
        
        clearDraft();
      }

      unlockChatAudio();
      void playChatSendSound();
      
      revokeNewMediaPreviews(mediaItems);
      setTitle('');
      setDescription('');
      setMediaItems([]);
      setRemovedMediaIds([]);
      setSelectedDate(new Date());
      
      onClose();
    } catch (error) {
      if (isSaveAborted(error)) {
        return;
      }
      console.error('Ошибка при сохранении события:', error);
      const message =
        error instanceof Error && error.message === 'UNREADABLE_MEDIA'
          ? t('calendar.errors.unreadableMedia')
          : formatErrorForUser(error, t('calendar.errors.saveEventFailed'));
      setError(message);
    } finally {
      if (!abortController.signal.aborted) {
        setIsSaving(false);
        setCompressProgress(null);
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
      setMediaItems(snapshot.mediaItems);
      setIsBirthdayEvent(snapshot.isBirthdayEvent);
      setIsAnniversaryEvent(snapshot.isAnniversaryEvent);
      setRemovedMediaIds(snapshot.removedMediaIds);
    }

    setError(null);
    setIsSaving(false);
    setCompressProgress(null);
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
        files: getNewFilesFromMediaItems(mediaItems),
        previews: []
      });
    }
    onClose();
  };

  const handleClearFormClick = () => {
    if (isSaving) {
      showLockedToast();
      return;
    }
    setClearConfirmOpen(true);
  };

  const handleConfirmClearForm = () => {
    revokeNewMediaPreviews(mediaItems);
    setTitle('');
    setDescription('');
    setMediaItems([]);
    setSelectedDate(initialDate || new Date());
    if (isEditMode) {
      setRemovedMediaIds((prev) =>
        Array.from(new Set([
          ...prev,
          ...mediaItems
            .filter((item): item is Extract<EventEditorMediaItem, { kind: 'existing' }> => item.kind === 'existing')
            .map((item) => item.media._id),
        ]))
      );
      setIsBirthdayEvent(false);
      setIsAnniversaryEvent(false);
    } else {
      clearDraft();
    }
    setClearConfirmOpen(false);
  };

  const canSave = selectedDate && title.trim().length > 0;
  const hasFormContent = isEditMode
    ? !!(title || description || mediaItems.length > 0)
    : !!(title || description || mediaItems.length > 0);

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
        sx: getCalendarDrawerPaperSx(theme, isMobile),
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={getCalendarDrawerHeaderWrapSx()}>
          <Box sx={getCalendarDrawerHeaderSx(theme)}>
            <IconButton
              edge="start"
              onClick={() => {
                if (isSaving) {
                  showLockedToast();
                  return;
                }
                handleClose();
              }}
              aria-label="close"
              size="small"
              sx={getCalendarDrawerHeaderIconButtonSx(theme)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <Typography component="h2" sx={getCalendarDrawerHeaderTitleSx(theme)}>
              {isEditMode ? t('calendar.event.edit') : t('calendar.event.new')}
            </Typography>
            <EncryptedIndicator />
          </Box>
        </Box>

        <Box
          sx={getCalendarDrawerContentSx()}
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
          <AppDatePicker
            label={t('calendar.event.date')}
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            format={DATE_INPUT_FORMAT}
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
            <Box sx={getEventEditorFlagBoxSx(theme)}>
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
            <Box sx={getEventEditorFlagBoxSx(theme)}>
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
          <Box sx={getEventEditorUploadCardSx(theme)}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.25, fontWeight: 600 }}>
              {t('calendar.media.photosAndVideosEncrypted')}
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: 'block' }}>
              {t('calendar.media.supported')} {getVideoLimitsHint(t)}
            </Typography>
          </Box>

          {mediaItems.length > 0 && (
            <Box sx={getEventEditorMediaGridSx()}>
              {mediaItems.map((item, index) => (
                <Box
                  key={item.key}
                  onClick={() => {
                    if (item.kind === 'new') {
                      handlePreviewClick(item);
                    }
                  }}
                  sx={{
                    ...getEventEditorMediaPreviewSx(theme),
                    cursor: item.kind === 'new' ? 'pointer' : 'default',
                  }}
                >
                  {item.kind === 'existing' ? (
                    <DecryptedMedia
                      cacheKey={`event-edit-${editEvent?.eventId}-${item.media._id}`}
                      url={item.media.url}
                      resourceType={item.media.resourceType}
                      encrypted={item.media.encrypted}
                      mediaEnvelope={item.media.mediaEnvelope}
                      videoPreview={item.media.resourceType === 'video'}
                      onImageClick={(blobUrl) => {
                        handlePreviewExistingClick({
                          ...item.media,
                          url: blobUrl,
                        });
                      }}
                      imageStyle={eventMediaPreviewMediaStyle}
                      videoStyle={eventMediaPreviewMediaStyle}
                      loadingMinHeight={0}
                    />
                  ) : item.file.type.startsWith('image/') ? (
                    <img
                      src={item.preview}
                      alt={`Preview ${index + 1}`}
                      style={eventMediaPreviewMediaStyle}
                    />
                  ) : (
                    <video
                      src={item.preview}
                      style={eventMediaPreviewMediaStyle}
                    />
                  )}

                  {!isSaving && index > 0 && (
                    <IconButton
                      size="small"
                      aria-label={t('calendar.media.moveEarlier')}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleMoveMediaItem(index, -1);
                      }}
                      sx={{
                        ...getEventMediaNavButtonSx(theme),
                        left: 4,
                      }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                  )}

                  {!isSaving && index < mediaItems.length - 1 && (
                    <IconButton
                      size="small"
                      aria-label={t('calendar.media.moveLater')}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleMoveMediaItem(index, 1);
                      }}
                      sx={{
                        ...getEventMediaNavButtonSx(theme),
                        right: 4,
                      }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  )}

                  {!isSaving && (
                    <IconButton
                      size="small"
                      sx={getEventMediaDeleteButtonSx(theme)}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveMediaItem(index);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}

                  {item.kind === 'new' && (
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
                      {formatCalendarDate(new Date(item.file.lastModified), i18n.language)}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={getCalendarDrawerFooterSx(theme)}>
          {(hasFormContent || isSaving) ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {hasFormContent && (
                  <Button
                    fullWidth
                    variant="text"
                    size="small"
                    onClick={handleClearFormClick}
                    disabled={isSaving}
                    startIcon={<DeleteIcon />}
                  >
                    {t('calendar.event.clearDraft')}
                  </Button>
                )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {isSaving && (
                  <Button
                    fullWidth
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
            </Box>
          ) : null}
          
          <Box sx={(theme) => ({ display: 'flex', gap: 2, ...getModalFooterActionsSx(theme) })}>
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
                ? compressProgress && compressProgress.total > 1
                  ? t('calendar.event.compressingVideos', {
                      current: compressProgress.index,
                      total: compressProgress.total
                    })
                  : getNewFilesFromMediaItems(mediaItems).some(isVideoFile)
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
      <ResponsiveDialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
      >
        <DialogTitle>{t('calendar.event.clearConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('calendar.event.clearConfirmMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearConfirmOpen(false)}>
            {t('calendar.common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmClearForm}
            color="error"
            variant="contained"
          >
            {t('calendar.event.clearForm')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={multiVideoWarningOpen}
        onClose={() => setMultiVideoWarningOpen(false)}
      >
        <DialogTitle>{t('calendar.event.multiVideoWarningTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('calendar.event.multiVideoWarningMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMultiVideoWarningOpen(false)} variant="contained">
            {t('calendar.event.multiVideoWarningOk')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </>
  );
};

export default EventEditorDrawer;

