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

// Временные данные для демонстрации
const MOCK_PARTNER_CONTENT: ContentItem[] = [
  {
    id: '1',
    url: 'https://source.unsplash.com/random/800x600/?couple',
    type: 'image',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    url: 'https://source.unsplash.com/random/800x600/?love',
    type: 'image',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    url: 'https://source.unsplash.com/random/800x600/?romance',
    type: 'image',
    createdAt: new Date().toISOString()
  }
];

const MOCK_SELF_CONTENT: ContentItem[] = [
  {
    id: '4',
    url: 'https://source.unsplash.com/random/800x600/?travel',
    type: 'image',
    createdAt: new Date().toISOString()
  },
  {
    id: '5',
    url: 'https://source.unsplash.com/random/800x600/?nature',
    type: 'image',
    createdAt: new Date().toISOString()
  }
];

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
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    // В реальном приложении здесь будет запрос к API
    // fetchUserData();
    // fetchContent();
    
    // Используем моковые данные для демонстрации
    setTimeout(() => {
      setPartnerContent(MOCK_PARTNER_CONTENT);
      setSelfContent(MOCK_SELF_CONTENT);
      
      // Пример данных об отношениях
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // 3 месяца назад
      setRelationshipStartDate(startDate.toISOString());
      
      const diffTime = Math.abs(new Date().getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysCount(diffDays);
      
      setIsLoading(false);
    }, 1000);
  }, []);
  
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
      
      // В реальном приложении здесь будет загрузка файлов на сервер
      // const formData = new FormData();
      // files.forEach(file => formData.append('media', file));
      // formData.append('target', target);
      // formData.append('frequency', JSON.stringify(frequency));
      // formData.append('applyNow', String(applyNow));
      // const response = await axios.post(`${API_URL}/api/content`, formData);
      
      // Для демонстрации создаем локальные URL
      const newContent: ContentItem[] = files.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'video',
        createdAt: new Date().toISOString()
      }));
      
      // Обновляем соответствующий список контента
      if (target === 'self') {
        setSelfContent([...newContent, ...selfContent]);
      } else {
        setPartnerContent([...newContent, ...partnerContent]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при добавлении контента:', error);
      setIsLoading(false);
    }
  };
  
  const handleAddPhoto = async (file: File) => {
    try {
      // В реальном приложении здесь будет загрузка фото на сервер
      // const formData = new FormData();
      // formData.append('photo', file);
      // const response = await axios.post(`${API_URL}/api/relationship/photo`, formData);
      
      // Для демонстрации создаем локальный URL
      const photoUrl = URL.createObjectURL(file);
      setRelationshipPhoto(photoUrl);
    } catch (error) {
      console.error('Ошибка при добавлении фото:', error);
    }
  };
  
  const handleAddSignature = async (signatureDataUrl: string) => {
    try {
      // В реальном приложении здесь будет отправка подписи на сервер
      // const response = await axios.post(`${API_URL}/api/relationship/signature`, { signature: signatureDataUrl });
      
      // Для демонстрации просто сохраняем в состоянии
      setRelationshipSignature(signatureDataUrl);
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