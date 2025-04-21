import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Calendar from '../components/Calendar/Calendar';
import ContentViewer from '../components/Calendar/ContentViewer';
import AddContentDialog from '../components/Calendar/AddContentDialog';
import axios from 'axios';
import { API_URL } from '../config';

interface ContentItem {
  _id: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  createdAt: string;
}

const CalendarPage: React.FC = () => {
  const [content, setContent] = useState<Array<{
    date: string;
    mediaUrl: string;
    type: 'image' | 'video';
  }>>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<{
    mediaUrl: string;
    type: 'image' | 'video';
  } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/content`);
      
      // Преобразуем данные в нужный формат
      const formattedContent = response.data.map((item: ContentItem) => ({
        date: item.createdAt,
        mediaUrl: item.url,
        type: item.resourceType
      }));
      
      setContent(formattedContent);
    } catch (error) {
      console.error('Ошибка при загрузке контента:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentClick = (content: {
    mediaUrl: string;
    type: 'image' | 'video';
  }) => {
    setSelectedContent(content);
    setViewerOpen(true);
  };

  const handleAddContent = (date: Date) => {
    setSelectedDate(date);
    setAddDialogOpen(true);
  };

  const handleSaveContent = async (files: File[]) => {
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('media', file);
      });

      // Добавляем дату, если она выбрана
      if (selectedDate) {
        formData.append('date', selectedDate.toISOString());
      }

      await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Обновляем список контента
      await fetchContent();
    } catch (error) {
      console.error('Ошибка при загрузке файлов:', error);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Calendar 
        content={content}
        onAddContent={handleAddContent}
      />
      
      <ContentViewer 
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        content={selectedContent}
      />
      
      <AddContentDialog 
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        date={selectedDate}
        onSave={handleSaveContent}
      />
    </Box>
  );
};

export default CalendarPage; 