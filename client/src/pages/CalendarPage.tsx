import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Calendar from '../components/Calendar/Calendar';
import EventDetailDrawer from '../components/Calendar/EventDetailDrawer';
import EventEditorDrawer from '../components/Calendar/EventEditorDrawer';
import axios from 'axios';
import { API_URL } from '../config';

interface MediaFile {
  _id: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  fileSize?: number;
}

interface ContentItem {
  _id: string;
  eventId: string;
  title?: string;
  description?: string;
  eventDate?: string;
  createdAt: string;
  media: MediaFile[];
}

const CalendarPage: React.FC = () => {
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

  useEffect(() => {
    fetchContent();
  }, []);

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
      
      // Сохраняем полные данные
      setAllEvents(response.data);
      
      // Преобразуем данные в нужный формат для календаря
      const formattedContent = response.data.map((item: ContentItem) => ({
        date: item.eventDate || item.createdAt,
        mediaUrl: item.media[0]?.url || '', // Используем первое медиа для превью
        type: item.media[0]?.resourceType || 'image',
        title: item.title,
        description: item.description,
        _id: item.eventId || item._id,
        eventDate: item.eventDate,
        createdAt: item.createdAt
      }));
      
      setContent(formattedContent);
    } catch (error) {
      console.error('Ошибка при загрузке контента:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentClick = (eventId: string) => {
    // Находим полное событие по eventId
    const event = allEvents.find(e => e.eventId === eventId || e._id === eventId);
    if (event) {
      setSelectedEvent(event);
      setEventDetailOpen(true);
    }
  };

  const handleAddContent = (date: Date) => {
    setSelectedDate(date);
    setAddDialogOpen(true);
  };

  const handleSaveEvent = async (eventData: {
    date: Date;
    title: string;
    description: string;
    files: File[];
  }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Не авторизован');
      }

      const formData = new FormData();
      
      // Добавляем файлы
      eventData.files.forEach(file => {
        formData.append('media', file);
      });

      // Добавляем данные события
      formData.append('eventDate', eventData.date.toISOString());
      formData.append('title', eventData.title);
      formData.append('description', eventData.description);

      await axios.post(`${API_URL}/api/calendar/events`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      // Обновляем список контента
      await fetchContent();
    } catch (error) {
      console.error('Ошибка при сохранении события:', error);
      throw error;
    }
  };

  return (
    <Box sx={{ 
      minHeight: 'calc(100vh - 72px)', // Вычитаем высоту нижней навигации
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <Calendar 
        content={content}
        onAddContent={handleAddContent}
        onContentClick={handleContentClick}
      />
      
      <EventDetailDrawer
        open={eventDetailOpen}
        onClose={() => setEventDetailOpen(false)}
        event={selectedEvent}
      />
      
      <EventEditorDrawer
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        initialDate={selectedDate}
        onSave={handleSaveEvent}
      />
    </Box>
  );
};

export default CalendarPage; 