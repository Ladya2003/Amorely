import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress } from '@mui/material';
import ResponsiveDialog from '../components/UI/ResponsiveDialog';
import Calendar from '../components/Calendar/Calendar';
import EventDetailDrawer from '../components/Calendar/EventDetailDrawer';
import EventEditorDrawer from '../components/Calendar/EventEditorDrawer';
import EventListDialog from '../components/Calendar/EventListDialog';
import ShareRecipientDialog, { ShareRecipientContact } from '../components/Chat/ShareRecipientDialog';
import axios from 'axios';
import { API_URL } from '../config';
import { format } from 'date-fns';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCrypto } from '../contexts/CryptoContext';
import { useEncryptionRecipientId, usePartnerId } from '../hooks/usePartnerId';
import { useAuth } from '../contexts/AuthContext';
import {
  decryptCalendarEventsWithMedia,
  encryptTextForPartner
} from '../crypto/contentCryptoService';
import { encryptAndUploadContentFiles } from '../crypto/encryptedUploadService';
import { isVideoCompressionError } from '../utils/compressVideo';
import type { PrepareMediaProgress } from '../utils/parallelMediaPrepare';
import type { ContentMediaEnvelope } from '../crypto/contentCryptoService';
import { loadLocalKeys, type LocalDeviceKeys } from '../crypto/cryptoService';
import { buildSharedEventRef, prepareEventForShare, type EventLikeForShare } from '../utils/buildSharedEventRef';

interface MediaFile {
  _id: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  fileSize?: number;
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
  encryptedMediaEnvelope?: { ciphertext: string; iv: string };
}

interface User {
  _id: string;
  username: string;
  avatar?: string;
}

interface ContentItem {
  _id: string;
  eventId: string;
  title?: string;
  description?: string;
  encrypted?: boolean;
  encryptedTitle?: { ciphertext: string; iv: string };
  encryptedDescription?: { ciphertext: string; iv: string };
  metadataSenderId?: string;
  metadataRecipientId?: string;
  userId?: string;
  eventDate?: string;
  createdAt: string;
  media: MediaFile[];
  createdBy?: User;
  lastEditedBy?: User;
  lastEditedAt?: string;
  isBirthdayEvent?: boolean;
  isAnniversaryEvent?: boolean;
  readOnly?: boolean;
}

const CalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { localDeviceKeys, ensureLocalKeys } = useCrypto();
  const { user } = useAuth();
  const encryptionRecipientId = useEncryptionRecipientId();
  const partnerId = usePartnerId();
  const [content, setContent] = useState<Array<{
    date: string;
    mediaUrl: string;
    type: 'image' | 'video';
    title?: string;
    description?: string;
    _id?: string;
    eventDate?: string;
    createdAt?: string;
  }>>([]);
  
  const [allEvents, setAllEvents] = useState<ContentItem[]>([]); // Храним полные данные
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ContentItem | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [eventDetailReadOnly, setEventDetailReadOnly] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [eventListOpen, setEventListOpen] = useState(false);
  const [eventsForDate, setEventsForDate] = useState<ContentItem[]>([]);
  const [selectedDateForList, setSelectedDateForList] = useState<Date | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [eventToShare, setEventToShare] = useState<EventLikeForShare | null>(null);
  const [shareContacts, setShareContacts] = useState<ShareRecipientContact[]>([]);
  const eventIdFromUrl = searchParams.get('event');
  const [eventFromUrlHandled, setEventFromUrlHandled] = useState(!eventIdFromUrl);
  const openingEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (eventIdFromUrl) {
      setEventFromUrlHandled(false);
      openingEventIdRef.current = null;
    } else {
      setEventFromUrlHandled(true);
      openingEventIdRef.current = null;
    }
  }, [eventIdFromUrl]);

  useEffect(() => {
    fetchContent();
  }, [localDeviceKeys, user?._id]);

  // Обработка URL параметра для открытия конкретного события
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (!eventId || isLoading) return;
    if (openingEventIdRef.current === eventId) return;

    const finishOpeningFromUrl = () => {
      openingEventIdRef.current = eventId;
      setEventFromUrlHandled(true);
    };

    const localEvent = allEvents.find((e) => e.eventId === eventId || e._id === eventId);
    if (localEvent) {
      setEventDetailReadOnly(false);
      setSelectedEvent(localEvent);
      setEventDetailOpen(true);
      finishOpeningFromUrl();
      return;
    }

    openingEventIdRef.current = eventId;

    void (async () => {
      try {
        await openSharedEventById(eventId);
      } catch (error) {
        console.error('Ошибка при открытии события:', error);
      } finally {
        setEventFromUrlHandled(true);
      }
    })();
  }, [searchParams, allEvents, isLoading]);

  const openSharedEventById = async (eventId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error(t('calendar.errors.notAuthorized'));
    }

    const response = await axios.get(`${API_URL}/api/calendar/events/${encodeURIComponent(eventId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let event: ContentItem = response.data;
    const isReadOnly = Boolean(event.readOnly);

    if (localDeviceKeys) {
      const [decrypted] = await decryptCalendarEventsWithMedia(
        localDeviceKeys,
        [event],
        user?._id,
        partnerId || undefined
      );
      event = decrypted;
    }

    setEventDetailReadOnly(isReadOnly);
    setSelectedEvent(event);
    setEventDetailOpen(true);
  };

  const showEventLoadingOverlay = Boolean(eventIdFromUrl) && !eventFromUrlHandled;

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/calendar/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      let events: ContentItem[] = response.data;

      if (localDeviceKeys) {
        events = await decryptCalendarEventsWithMedia(
          localDeviceKeys,
          events,
          user?._id,
          partnerId || undefined
        );
      }

      setAllEvents(events);

      const formattedContent = events.map((item: ContentItem) => {
        const hasMedia = item.media && item.media.length > 0 && item.media[0].url && item.media[0].url.trim().length > 0;
        
        const firstMedia = hasMedia ? item.media[0] : null;
        return {
          date: item.eventDate || item.createdAt,
          mediaUrl: hasMedia ? firstMedia!.url : 'placeholder',
          type: hasMedia ? firstMedia!.resourceType : 'image' as 'image' | 'video',
          encrypted: firstMedia?.encrypted,
          mediaEnvelope: firstMedia?.mediaEnvelope,
          mediaId: firstMedia?._id,
          title: item.title,
          description: item.description,
          _id: item.eventId || item._id,
          eventDate: item.eventDate,
          createdAt: item.createdAt,
          isBirthdayEvent: item.isBirthdayEvent,
          isAnniversaryEvent: item.isAnniversaryEvent
        };
      });
      
      setContent(formattedContent);
    } catch (error) {
      console.error('Ошибка при загрузке контента:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentClick = (eventId: string, directOpen: boolean = false) => {
    // Находим полное событие по eventId
    const event = allEvents.find(e => e.eventId === eventId || e._id === eventId);
    if (!event) return;

    // Если directOpen = true (клик из grid), открываем сразу событие
    if (directOpen) {
      setSelectedEvent(event);
      setEventDetailOpen(true);
      return;
    }

    // Проверяем, есть ли другие события на эту же дату (для calendar view)
    const eventDate = format(new Date(event.eventDate || event.createdAt), 'yyyy-MM-dd');
    const eventsOnSameDate = allEvents.filter(e => {
      const eDate = format(new Date(e.eventDate || e.createdAt), 'yyyy-MM-dd');
      return eDate === eventDate;
    });

    if (eventsOnSameDate.length > 1) {
      // Если больше одного события - показываем список
      setEventsForDate(eventsOnSameDate);
      setSelectedDateForList(new Date(event.eventDate || event.createdAt));
      setEventListOpen(true);
    } else {
      // Если одно событие - открываем сразу
      setSelectedEvent(event);
      setEventDetailOpen(true);
    }
  };

  const handleSelectEventFromList = (eventId: string) => {
    const event = allEvents.find(e => e.eventId === eventId || e._id === eventId);
    if (event) {
      setSelectedEvent(event);
      setEventDetailOpen(true);
    }
  };

  const handleAddContent = (date: Date) => {
    setSelectedDate(date);
    setEditEvent(null); // Сбрасываем режим редактирования
    // Не очищаем черновик - позволяем восстановить данные
    setAddDialogOpen(true);
  };

  const handleEditEvent = (event: ContentItem) => {
    setEditEvent({
      eventId: event.eventId || event._id,
      title: event.title || '',
      description: event.description || '',
      eventDate: event.eventDate || event.createdAt,
      isBirthdayEvent: event.isBirthdayEvent || false,
      isAnniversaryEvent: event.isAnniversaryEvent || false,
      media: (event.media || []).filter((item) => item.url && item.url.trim().length > 0)
    });
    setEventDetailOpen(false); // Закрываем детальный просмотр
    setAddDialogOpen(true); // Открываем редактор
  };

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteDialogOpen(true);
  };

  const fetchShareContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShareContacts(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке контактов для отправки:', error);
      setShareContacts([]);
    }
  };

  const handleShareEvent = (event: EventLikeForShare) => {
    setEventToShare(event);
    setShareModalOpen(true);
    void fetchShareContacts();
  };

  const handleSelectShareTarget = async (target: ShareRecipientContact) => {
    if (!eventToShare) return;

    let sharedEvent;
    if (localDeviceKeys) {
      sharedEvent = await prepareEventForShare(
        localDeviceKeys,
        eventToShare,
        user?._id,
        partnerId || undefined
      );
    } else {
      sharedEvent = buildSharedEventRef(eventToShare);
    }

    setShareModalOpen(false);
    setEventDetailOpen(false);
    setEventToShare(null);

    navigate('/chat', {
      state: {
        pendingSharedEvent: sharedEvent,
        targetUserId: target.id,
        targetUserName: target.name,
        targetUsername: target.username,
        targetUserEmail: target.email,
        targetUserAvatar: target.avatar
      }
    });
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error(t('calendar.errors.notAuthorized'));
      }

      await axios.delete(`${API_URL}/api/calendar/events/${eventToDelete}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Обновляем список событий
      await fetchContent();
      
      // Закрываем диалоги
      setDeleteDialogOpen(false);
      setEventDetailOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Ошибка при удалении события:', error);
      alert(t('calendar.delete.failed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  const resolveKeysForEncrypt = async (): Promise<LocalDeviceKeys> => {
    if (localDeviceKeys) return localDeviceKeys;
    await ensureLocalKeys();
    if (localDeviceKeys) return localDeviceKeys;
    if (!user?._id) {
      throw new Error(t('calendar.errors.notAuthorizedShort'));
    }
    const loaded = await loadLocalKeys(user._id);
    if (!loaded) {
      throw new Error(t('calendar.errors.unlockCrypto'));
    }
    return loaded;
  };

  const handleSaveEvent = async (
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
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('calendar.errors.notAuthorized'));
      }

      const keys = await resolveKeysForEncrypt();
      if (!encryptionRecipientId) {
        throw new Error(t('calendar.errors.encryptionRecipient'));
      }

      const encryptedTitle = await encryptTextForPartner(
        keys,
        encryptionRecipientId,
        eventData.title
      );
      const encryptedDescription = eventData.description
        ? await encryptTextForPartner(keys, encryptionRecipientId, eventData.description)
        : undefined;

      const uploaded =
        eventData.files.length > 0
          ? await encryptAndUploadContentFiles(
              eventData.files,
              keys,
              encryptionRecipientId,
              saveOptions
            )
          : [];

      await axios.post(
        `${API_URL}/api/calendar/events-encrypted`,
        {
          eventDate: eventData.date.toISOString(),
          encryptedTitle,
          encryptedDescription,
          encryptionRecipientId,
          isBirthdayEvent: eventData.isBirthdayEvent,
          isAnniversaryEvent: eventData.isAnniversaryEvent,
          media: uploaded.map((item) => ({
            url: item.url,
            publicId: item.publicId,
            fileSize: item.fileSize,
            mediaEnvelope: item.mediaEnvelope,
            encryptedMediaEnvelope: item.encryptedMediaEnvelope
          }))
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: saveOptions?.signal
        }
      );

      await fetchContent();
    } catch (error) {
      console.error('Ошибка при сохранении события:', error);
      if (isVideoCompressionError(error)) {
        console.error('Детали сжатия видео:', error.details);
      }
      throw error;
    }
  };

  const handleUpdateEvent = async (
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
      onPrepareStart?: (progress: PrepareMediaProgress) => void;
    }
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('calendar.errors.notAuthorized'));
      }

      const keys = await resolveKeysForEncrypt();
      if (!encryptionRecipientId) {
        throw new Error(t('calendar.errors.encryptionRecipient'));
      }

      const encryptedTitle = await encryptTextForPartner(
        keys,
        encryptionRecipientId,
        eventData.title
      );
      const encryptedDescription = eventData.description
        ? await encryptTextForPartner(keys, encryptionRecipientId, eventData.description)
        : undefined;

      const uploaded =
        eventData.files.length > 0
          ? await encryptAndUploadContentFiles(
              eventData.files,
              keys,
              encryptionRecipientId,
              saveOptions
            )
          : [];

      await axios.put(
        `${API_URL}/api/calendar/events/${eventId}`,
        {
          eventDate: eventData.date.toISOString(),
          encryptedTitle,
          encryptedDescription,
          encryptionRecipientId,
          isBirthdayEvent: eventData.isBirthdayEvent,
          isAnniversaryEvent: eventData.isAnniversaryEvent,
          newMedia: uploaded.map((item) => ({
            url: item.url,
            publicId: item.publicId,
            fileSize: item.fileSize,
            mediaEnvelope: item.mediaEnvelope,
            encryptedMediaEnvelope: item.encryptedMediaEnvelope
          })),
          removeMediaIds: eventData.removeMediaIds
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: saveOptions?.signal
        }
      );

      // Обновляем список контента
      await fetchContent();
    } catch (error) {
      console.error('Ошибка при обновлении события:', error);
      if (isVideoCompressionError(error)) {
        console.error('Детали сжатия видео:', error.details);
      }
      throw error;
    }
  };

  return (
    <Box sx={{ 
      height: '100%',
      minHeight: 0,
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {showEventLoadingOverlay && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            zIndex: (theme) => theme.zIndex.modal + 1
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}

      <Calendar 
        content={content}
        allEvents={allEvents}
        onAddContent={handleAddContent}
        onContentClick={handleContentClick}
      />
      
      <EventListDialog
        open={eventListOpen}
        onClose={() => setEventListOpen(false)}
        events={eventsForDate}
        date={selectedDateForList}
        onSelectEvent={handleSelectEventFromList}
      />

      <EventDetailDrawer
        open={eventDetailOpen}
        onClose={() => {
          setEventDetailOpen(false);
          setEventDetailReadOnly(false);
        }}
        event={selectedEvent}
        readOnly={eventDetailReadOnly}
        onEdit={eventDetailReadOnly ? undefined : handleEditEvent}
        onDelete={eventDetailReadOnly ? undefined : handleDeleteClick}
        onShare={eventDetailReadOnly ? undefined : handleShareEvent}
      />

      <ShareRecipientDialog
        open={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setEventToShare(null);
        }}
        onSelect={handleSelectShareTarget}
        title={t('chat.dialog.shareEvent')}
        contacts={shareContacts}
      />
      
      <EventEditorDrawer
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setEditEvent(null);
        }}
        initialDate={selectedDate}
        editEvent={editEvent}
        onSave={handleSaveEvent}
        onUpdate={handleUpdateEvent}
      />

      {/* Диалог подтверждения удаления */}
      <ResponsiveDialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle>{t('calendar.delete.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('calendar.delete.body')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={isDeleting}>
            {t('calendar.common.cancel')}
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : null}
          >
            {isDeleting ? t('calendar.delete.deleting') : t('calendar.common.delete')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </Box>
  );
};

export default CalendarPage; 