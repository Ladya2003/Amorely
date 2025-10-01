import React, { useState, useEffect } from 'react';
import { Box, Container, Fab, Badge, CircularProgress, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { API_URL } from '../config';
import FeedHeader from '../components/Feed/FeedHeader';
import ContentSlider, { ContentItem } from '../components/Feed/ContentSlider';
import DaysTogether from '../components/Feed/DaysTogether';
import AddContentDialog from '../components/Feed/AddContentDialog';
import ContentViewer from '../components/Feed/ContentViewer';

// Интерфейс для контента из диалога управления
interface UserContentItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
  uploadedAt: Date;
  uploadedBy?: any;
  publicId?: string;
  frequency?: { count: number; hours: number }; // Добавляем информацию о частоте
}

const FeedPage: React.FC = () => {
  // Состояние для табов
  const [tabValue, setTabValue] = useState(0);
  
  // Состояние для контента
  const [partnerContent, setPartnerContent] = useState<ContentItem[]>([]);
  const [selfContent, setSelfContent] = useState<ContentItem[]>([]);
  const [userContent, setUserContent] = useState<UserContentItem[]>([]); // Контент для управления
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Состояние для отношений
  const [daysCount, setDaysCount] = useState<number | null>(null);
  const [relationshipStartDate, setRelationshipStartDate] = useState<string | null>(null);
  const [relationshipPhoto, setRelationshipPhoto] = useState<string | undefined>();
  const [relationshipSignature, setRelationshipSignature] = useState<string | undefined>();
  
  // Состояние для диалогов
  const [addContentDialogOpen, setAddContentDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  const isPartnerAdded = !!daysCount && !!relationshipStartDate;
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    // Загружаем данные с сервера
    fetchUserData();
    fetchContent();
    fetchUserContent(); // Загружаем контент для управления
  }, []);
  
  // Функция для загрузки данных об отношениях
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const userId = 'current-user'; // В реальном приложении получать из контекста аутентификации
      const response = await axios.get(`${API_URL}/api/feed/relationship?userId=${userId}`);
      
      if (response.data) {
        setRelationshipStartDate(response.data.startDate);
        setDaysCount(response.data.daysCount);
        setRelationshipPhoto(response.data.photo);
        setRelationshipSignature(response.data.signature);
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных об отношениях:', error);
    }
  };
  
  // Функция для загрузки контента для управления
  const fetchUserContent = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/feed/user-content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserContent(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке контента пользователя:', error);
    }
  };
  
  // Функция для удаления контента
  const handleDeleteContent = async (contentId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.delete(`${API_URL}/api/feed/content/${contentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Обновляем список контента после удаления
      setUserContent(prev => prev.filter(item => item.id !== contentId));
      
      // Также обновляем основной контент ленты
      fetchContent();
    } catch (error) {
      console.error('Ошибка при удалении контента:', error);
    }
  };
  
  // Функция для загрузки контента
  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      // Загружаем контент от партнера
      const partnerResponse = await axios.get(`${API_URL}/api/feed/content?target=partner`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPartnerContent(partnerResponse.data);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке контента:', error);
      setIsLoading(false);
    }
  };
  
  // Обработчики событий
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentIndex(0);
  };
  
  const handleAddContentClick = () => {
    setAddContentDialogOpen(true);
  };
  
  const handleContentClick = (content: ContentItem) => {
    setSelectedContent(content);
    setViewerOpen(true);
  };
  
  const handleAddContent = async (
    files: File[], 
    target: 'self' | 'partner', 
    frequency: { count: number, hours: number }, 
    applyNow: boolean,
    resetRotation?: boolean
  ) => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      // Если есть файлы, загружаем их
      if (files.length > 0) {
        const formData = new FormData();
        
        files.forEach(file => formData.append('media', file));
        formData.append('target', target);
        formData.append('frequency', JSON.stringify(frequency));
        formData.append('applyNow', String(applyNow));
        
        await axios.post(`${API_URL}/api/feed/content`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Если файлов нет, но изменились настройки, обновляем только частоту
        await axios.put(`${API_URL}/api/feed/content/frequency`, {
          frequency,
          applyNow,
          resetRotation: resetRotation || false
        }, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Обновляем контент после загрузки/обновления
      fetchContent();
      fetchUserContent();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при добавлении контента:', error);
      setIsLoading(false);
      throw error; // Пробрасываем ошибку для обработки в AddContentDialog
    }
  };
  
  const handleAddPhoto = async (file: File) => {
    try {
      const formData = new FormData();
      const userId = 'current-user'; // В реальном приложении получать из контекста аутентификации
      
      formData.append('photo', file);
      formData.append('userId', userId);
      
      const response = await axios.post(`${API_URL}/api/feed/relationship/photo`, formData);
      setRelationshipPhoto(response.data.photo);
    } catch (error) {
      console.error('Ошибка при добавлении фото:', error);
    }
  };
  
  const handleAddSignature = async (signatureDataUrl: string) => {
    try {
      const userId = 'current-user'; // В реальном приложении получать из контекста аутентификации
      
      const response = await axios.post(`${API_URL}/api/feed/relationship/signature`, {
        userId,
        signature: signatureDataUrl
      });
      
      setRelationshipSignature(response.data.signature);
    } catch (error) {
      console.error('Ошибка при добавлении подписи:', error);
    }
  };
  
  // Получаем текущий контент в зависимости от выбранного таба
  const currentContent = tabValue === 0 ? partnerContent : selfContent;
  
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <FeedHeader 
        daysCount={daysCount} 
        tabValue={tabValue} 
        onTabChange={handleTabChange} 
      />
      
      <ContentSlider 
        content={partnerContent} 
        isLoading={isLoading}
        onContentClick={handleContentClick}
        navigateTo={!isPartnerAdded ? '/settings' : undefined}
        placeholder={!isPartnerAdded ? 'Добавьте партнера в настройках' : 'Нет доступного контента\n\n📝 Нажмите здесь, чтобы управлять контентом'}
        onEmptyClick={isPartnerAdded ? handleAddContentClick : undefined}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Badge 
          badgeContent={partnerContent.length} 
          color="primary"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.8rem',
              height: '1.5rem',
              minWidth: '1.5rem',
              padding: '0 6px'
            }
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Контент от партнера
          </Typography>
        </Badge>
      </Box>
      
      <DaysTogether 
        daysCount={daysCount}
        relationshipStartDate={relationshipStartDate}
        onAddPhoto={handleAddPhoto}
        onAddSignature={handleAddSignature}
        photo={relationshipPhoto}
        signature={relationshipSignature}
      />
      
      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={handleAddContentClick}
        sx={{ 
          position: 'fixed', 
          bottom: 72, 
          right: 16 
        }}
      >
        <EditIcon />
      </Fab>
      
      <AddContentDialog 
        open={addContentDialogOpen}
        onClose={() => setAddContentDialogOpen(false)}
        onSave={handleAddContent}
        hasPartner={!!daysCount}
        existingContent={userContent}
        onDeleteContent={handleDeleteContent}
      />
      
      <ContentViewer 
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        content={selectedContent}
      />
    </Container>
  );
};

export default FeedPage; 