import React, { useState, useEffect } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress } from '@mui/material';
import Calendar from '../components/Calendar/Calendar';
import EventDetailDrawer from '../components/Calendar/EventDetailDrawer';
import EventEditorDrawer from '../components/Calendar/EventEditorDrawer';
import EventListDialog from '../components/Calendar/EventListDialog';
import axios from 'axios';
import { API_URL } from '../config';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { useCrypto } from '../contexts/CryptoContext';
import { useEncryptionRecipientId, usePartnerId } from '../hooks/usePartnerId';
import { useAuth } from '../contexts/AuthContext';
import {
  decryptContentFieldsList,
  encryptTextForPartner
} from '../crypto/contentCryptoService';
import { encryptAndUploadFiles } from '../crypto/encryptedUploadService';
import type { ContentMediaEnvelope } from '../crypto/contentCryptoService';
import { loadLocalKeys, type LocalDeviceKeys } from '../crypto/cryptoService';

interface MediaFile {
  _id: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  fileSize?: number;
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
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
  userId?: string;
  eventDate?: string;
  createdAt: string;
  media: MediaFile[];
  createdBy?: User;
  lastEditedBy?: User;
  lastEditedAt?: string;
  isBirthdayEvent?: boolean;
  isAnniversaryEvent?: boolean;
}

const CalendarPage: React.FC = () => {
  const [searchParams] = useSearchParams();
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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [eventListOpen, setEventListOpen] = useState(false);
  const [eventsForDate, setEventsForDate] = useState<ContentItem[]>([]);
  const [selectedDateForList, setSelectedDateForList] = useState<Date | null>(null);

  useEffect(() => {
    fetchContent();
  }, [localDeviceKeys, user?._id]);

  // Обработка URL параметра для открытия конкретного события
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (eventId && allEvents.length > 0) {
      const event = allEvents.find(e => e.eventId === eventId || e._id === eventId);
      if (event) {
        setSelectedEvent(event);
        setEventDetailOpen(true);
      }
    }
  }, [searchParams, allEvents]);

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
        events = await decryptContentFieldsList(
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
      isAnniversaryEvent: event.isAnniversaryEvent || false
    });
    setEventDetailOpen(false); // Закрываем детальный просмотр
    setAddDialogOpen(true); // Открываем редактор
  };

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Не авторизован');
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
      alert('Не удалось удалить событие');
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
      throw new Error('Пользователь не авторизован');
    }
    const loaded = await loadLocalKeys(user._id);
    if (!loaded) {
      throw new Error('Разблокируйте ключи шифрования на странице /crypto/unlock');
    }
    return loaded;
  };

  const handleSaveEvent = async (eventData: {
    date: Date;
    title: string;
    description: string;
    files: File[];
    isBirthdayEvent?: boolean;
    isAnniversaryEvent?: boolean;
  }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Не авторизован');
      }

      const keys = await resolveKeysForEncrypt();
      if (!encryptionRecipientId) {
        throw new Error('Не удалось определить получателя шифрования');
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
        eventData.files.length > 0 ? await encryptAndUploadFiles(eventData.files) : [];

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
            mediaEnvelope: item.mediaEnvelope
          }))
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await fetchContent();
    } catch (error) {
      console.error('Ошибка при сохранении события:', error);
      throw error;
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: {
    date: Date;
    title: string;
    description: string;
    isBirthdayEvent?: boolean;
    isAnniversaryEvent?: boolean;
  }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Не авторизован');
      }

      const keys = await resolveKeysForEncrypt();
      if (!encryptionRecipientId) {
        throw new Error('Не удалось определить получателя шифрования');
      }

      const encryptedTitle = await encryptTextForPartner(
        keys,
        encryptionRecipientId,
        eventData.title
      );
      const encryptedDescription = eventData.description
        ? await encryptTextForPartner(keys, encryptionRecipientId, eventData.description)
        : undefined;

      await axios.put(
        `${API_URL}/api/calendar/events/${eventId}`,
        {
          eventDate: eventData.date.toISOString(),
          encryptedTitle,
          encryptedDescription,
          encryptionRecipientId,
          isBirthdayEvent: eventData.isBirthdayEvent,
          isAnniversaryEvent: eventData.isAnniversaryEvent
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Обновляем список контента
      await fetchContent();
    } catch (error) {
      console.error('Ошибка при обновлении события:', error);
      throw error;
    }
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 72px)', // Фиксированная высота (вычитаем нижнюю навигацию)
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden' // Блокируем скролл страницы
    }}>
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
        onClose={() => setEventDetailOpen(false)}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteClick}
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
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle>Удалить событие?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить это событие? Все связанные фото и видео будут удалены без возможности восстановления.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={isDeleting}>
            Отмена
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : null}
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarPage; 