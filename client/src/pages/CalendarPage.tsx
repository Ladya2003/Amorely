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
import { usePartnerId } from '../hooks/usePartnerId';
import { useAuth } from '../contexts/AuthContext';
import {
  decryptCalendarEventsWithMedia,
  encryptDualTextForContent
} from '../crypto/contentCryptoService';
import { encryptAndUploadCalendarContentFiles } from '../crypto/encryptedUploadService';
import { migrateCalendarEventsPartnerCopies } from '../crypto/calendarEventPartnerMigration';
import { isVideoCompressionError } from '../utils/compressVideo';
import type { PrepareMediaProgress } from '../utils/parallelMediaPrepare';
import type { ContentMediaEnvelope } from '../crypto/contentCryptoService';
import { loadLocalKeys, prefetchPeerPublicKey, type LocalDeviceKeys } from '../crypto/cryptoService';
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
  encryptedMediaEnvelopePartner?: { ciphertext: string; iv: string };
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
  encryptedTitlePartner?: { ciphertext: string; iv: string };
  encryptedDescriptionPartner?: { ciphertext: string; iv: string };
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

const isViewableCalendarEvent = (
  event: ContentItem,
  _selfUserId?: string,
  _activePartnerId?: string
): boolean => {
  if (event.title?.trim()) {
    return true;
  }

  const mediaItems = event.media || [];
  const hasMedia = mediaItems.some((item) => item.url?.trim());
  if (!hasMedia) {
    return false;
  }

  return mediaItems.some(
    (item) =>
      !item.encrypted || Boolean(item.mediaEnvelope?.mediaKey && item.mediaEnvelope?.iv)
  );
};

const partnerMigrationSessionKey = (selfUserId: string, partnerUserId: string) =>
  `calendar-partner-migration:${selfUserId}:${partnerUserId}`;

const CalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { localDeviceKeys, ensureLocalKeys } = useCrypto();
  const { user } = useAuth();
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
  const [plansRefreshKey, setPlansRefreshKey] = useState(0);
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
  }, [localDeviceKeys, user?._id, partnerId]);

  const getCalendarEncryptionTargets = async () => {
    if (!user?._id) {
      return null;
    }

    const selfId = user._id;
    let activePartnerId = partnerId && partnerId !== selfId ? partnerId : undefined;

    if (!activePartnerId) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const meResponse = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const fromMe = meResponse.data?.partnerId;
          if (fromMe && String(fromMe) !== selfId) {
            activePartnerId = String(fromMe);
          }
        } catch {
          // continue
        }

        if (!activePartnerId) {
          try {
            const relationshipResponse = await axios.get(`${API_URL}/api/relationships`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const fromRelationship = relationshipResponse.data?.partner?._id;
            if (fromRelationship && String(fromRelationship) !== selfId) {
              activePartnerId = String(fromRelationship);
            }
          } catch {
            // no partner
          }
        }
      }
    }

    return {
      selfId,
      activePartnerId,
      targetId: activePartnerId || selfId
    };
  };

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
      const encryptionTargets = await getCalendarEncryptionTargets();
      const activePartnerId = encryptionTargets?.activePartnerId;

      if (localDeviceKeys && user?._id) {
        const peerIds = new Set<string>([user._id]);
        if (activePartnerId) {
          peerIds.add(activePartnerId);
        }
        await Promise.all(Array.from(peerIds).map((peerId) => prefetchPeerPublicKey(peerId)));
      }

      if (localDeviceKeys && user?._id && activePartnerId) {
        const migrationKey = partnerMigrationSessionKey(user._id, activePartnerId);
        const migrationDone = sessionStorage.getItem(migrationKey) === '1';

        if (!migrationDone) {
          const migrated = await migrateCalendarEventsPartnerCopies(
            events,
            localDeviceKeys,
            user._id,
            activePartnerId
          );

          sessionStorage.setItem(migrationKey, '1');

          if (migrated) {
            const refreshResponse = await axios.get(`${API_URL}/api/calendar/events`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            events = refreshResponse.data;
          }
        }
      }

      if (localDeviceKeys) {
        events = await decryptCalendarEventsWithMedia(
          localDeviceKeys,
          events,
          user?._id,
          activePartnerId
        );

        events = events.filter((event) =>
          isViewableCalendarEvent(event, user?._id, activePartnerId || undefined)
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

  const handleDeleteAll = async (type: 'events' | 'plans') => {
    try {
      if (type === 'events') {
        await axios.delete(`${API_URL}/api/calendar/events/all`);
        await fetchContent();
        setEventDetailOpen(false);
        setEventListOpen(false);
        setSelectedEvent(null);
      } else {
        await axios.delete(`${API_URL}/api/calendar/plans/all`);
        setPlansRefreshKey((key) => key + 1);
      }
    } catch (error) {
      console.error('Ошибка при массовом удалении:', error);
      alert(t('calendar.deleteAll.failed'));
      throw error;
    }
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
      const encryptionTargets = await getCalendarEncryptionTargets();
      if (!encryptionTargets) {
        throw new Error(t('calendar.errors.encryptionRecipient'));
      }

      const { selfId, activePartnerId, targetId } = encryptionTargets;
      const titleDual = await encryptDualTextForContent(
        keys,
        selfId,
        activePartnerId,
        eventData.title
      );
      const descriptionDual = eventData.description
        ? await encryptDualTextForContent(keys, selfId, activePartnerId, eventData.description)
        : undefined;

      const uploaded =
        eventData.files.length > 0
          ? await encryptAndUploadCalendarContentFiles(
              eventData.files,
              keys,
              selfId,
              activePartnerId,
              saveOptions
            )
          : [];

      await axios.post(
        `${API_URL}/api/calendar/events-encrypted`,
        {
          eventDate: eventData.date.toISOString(),
          encryptedTitle: titleDual.self,
          encryptedTitlePartner: titleDual.partner,
          encryptedDescription: descriptionDual?.self,
          encryptedDescriptionPartner: descriptionDual?.partner,
          encryptionRecipientId: targetId,
          isBirthdayEvent: eventData.isBirthdayEvent,
          isAnniversaryEvent: eventData.isAnniversaryEvent,
          media: uploaded.map((item) => ({
            url: item.url,
            publicId: item.publicId,
            fileSize: item.fileSize,
            mediaEnvelope: item.mediaEnvelope,
            encryptedMediaEnvelope: item.encryptedMediaEnvelope,
            encryptedMediaEnvelopePartner: item.encryptedMediaEnvelopePartner
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
      const encryptionTargets = await getCalendarEncryptionTargets();
      if (!encryptionTargets) {
        throw new Error(t('calendar.errors.encryptionRecipient'));
      }

      const { selfId, activePartnerId, targetId } = encryptionTargets;
      const titleDual = await encryptDualTextForContent(
        keys,
        selfId,
        activePartnerId,
        eventData.title
      );
      const descriptionDual = eventData.description
        ? await encryptDualTextForContent(keys, selfId, activePartnerId, eventData.description)
        : undefined;

      const uploaded =
        eventData.files.length > 0
          ? await encryptAndUploadCalendarContentFiles(
              eventData.files,
              keys,
              selfId,
              activePartnerId,
              saveOptions
            )
          : [];

      await axios.put(
        `${API_URL}/api/calendar/events/${eventId}`,
        {
          eventDate: eventData.date.toISOString(),
          encryptedTitle: titleDual.self,
          encryptedTitlePartner: titleDual.partner,
          encryptedDescription: descriptionDual?.self,
          encryptedDescriptionPartner: descriptionDual?.partner,
          encryptionRecipientId: targetId,
          isBirthdayEvent: eventData.isBirthdayEvent,
          isAnniversaryEvent: eventData.isAnniversaryEvent,
          newMedia: uploaded.map((item) => ({
            url: item.url,
            publicId: item.publicId,
            fileSize: item.fileSize,
            mediaEnvelope: item.mediaEnvelope,
            encryptedMediaEnvelope: item.encryptedMediaEnvelope,
            encryptedMediaEnvelopePartner: item.encryptedMediaEnvelopePartner
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
        onDeleteAll={handleDeleteAll}
        plansRefreshKey={plansRefreshKey}
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