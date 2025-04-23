import React, { useState, useEffect } from 'react';
import { Box, Container, Fab, Badge, CircularProgress, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { API_URL } from '../config';
import FeedHeader from '../components/Feed/FeedHeader';
import ContentSlider, { ContentItem } from '../components/Feed/ContentSlider';
import DaysTogether from '../components/Feed/DaysTogether';
import AddContentDialog from '../components/Feed/AddContentDialog';
import ContentViewer from '../components/Feed/ContentViewer';

const FeedPage: React.FC = () => {
  // Состояние для табов
  const [tabValue, setTabValue] = useState(0);
  
  // Состояние для контента
  const [partnerContent, setPartnerContent] = useState<ContentItem[]>([]);
  const [selfContent, setSelfContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  // Функция для загрузки контента
  const fetchContent = async () => {
    try {
      const userId = 'current-user'; // В реальном приложении получать из контекста аутентификации
      
      // Загружаем контент от партнера
      const partnerResponse = await axios.get(`${API_URL}/api/feed/content?userId=${userId}&target=partner`);
      setPartnerContent(partnerResponse.data);
      
      // Загружаем собственный контент
      const selfResponse = await axios.get(`${API_URL}/api/feed/content?userId=${userId}&target=self`);
      setSelfContent(selfResponse.data);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке контента:', error);
      setIsLoading(false);
    }
  };
  
  // Обработчики событий
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
    applyNow: boolean
  ) => {
    try {
      setIsLoading(true);
      
      // Загрузка файлов на сервер
      const formData = new FormData();
      const userId = 'current-user'; // В реальном приложении получать из контекста аутентификации
      
      files.forEach(file => formData.append('media', file));
      formData.append('userId', userId);
      formData.append('target', target);
      formData.append('frequency', JSON.stringify(frequency));
      formData.append('applyNow', String(applyNow));
      
      const response = await axios.post(`${API_URL}/api/feed/content`, formData);
      
      // Обновляем соответствующий список контента
      if (target === 'self') {
        setSelfContent([...response.data.content, ...selfContent]);
      } else {
        setPartnerContent([...response.data.content, ...partnerContent]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при добавлении контента:', error);
      setIsLoading(false);
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
        content={currentContent} 
        isLoading={isLoading}
        onContentClick={handleContentClick}
        navigateTo={!isPartnerAdded ? '/settings' : undefined}
        placeholder={!isPartnerAdded ? 'Добавьте партнера в настройках' : 'Нет доступного контента'}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Badge 
          badgeContent={currentContent.length} 
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
            {tabValue === 0 ? 'Контент от партнера' : 'Ваш контент'}
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
          bottom: 16, 
          right: 16 
        }}
      >
        <AddIcon />
      </Fab>
      
      <AddContentDialog 
        open={addContentDialogOpen}
        onClose={() => setAddContentDialogOpen(false)}
        onSave={handleAddContent}
        hasPartner={!!daysCount}
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