import React, { useState, useEffect } from 'react';
import { Box, Container, Fab, Badge, CircularProgress, Typography, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import FeedHeader from '../components/Feed/FeedHeader';
import ContentSlider, { ContentItem } from '../components/Feed/ContentSlider';
import DaysTogether from '../components/Feed/DaysTogether';
import ContentManagementDialog from '../components/Feed/ContentManagement';
import ContentViewer from '../components/Feed/ContentViewer';
import { useCrypto } from '../contexts/CryptoContext';
import { decryptContentFieldsList } from '../crypto/contentCryptoService';
import { usePartnerId } from '../hooks/usePartnerId';

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
  const { user } = useAuth();
  const { localDeviceKeys } = useCrypto();
  const partnerId = usePartnerId();
  
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
  const [relationshipSignatures, setRelationshipSignatures] = useState<{ user?: string; partner?: string }>({});
  const [relationshipOwnerId, setRelationshipOwnerId] = useState<string | null>(null); // ID владельца отношений
  
  // Состояние для диалогов
  const [addContentDialogOpen, setAddContentDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  const isPartnerAdded = !!daysCount && !!relationshipStartDate;
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchUserData();
    fetchContent();
    fetchUserContent();
  }, [localDeviceKeys, user?._id]);
  
  // Функция для загрузки данных об отношениях
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/feed/relationship`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setRelationshipStartDate(response.data.startDate);
        setDaysCount(response.data.daysCount);
        setRelationshipPhoto(response.data.photo);
        setRelationshipSignature(response.data.signature);
        setRelationshipSignatures(response.data.signatures || {});
        setRelationshipOwnerId(response.data.ownerId); // Сохраняем ID владельца отношений
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
      
      let items = response.data;
      if (localDeviceKeys) {
        items = items.map((item: any) => ({
          ...item,
          encrypted: item.encrypted,
          mediaEnvelope: item.mediaEnvelope
        }));
      }
      setUserContent(items);
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
  
  // Функция для обновления после изменения порядка
  const handleContentReordered = async () => {
    // Обновляем список контента в модалке
    await fetchUserContent();
    // Обновляем контент в ленте
    await fetchContent();
    // Сбрасываем на первое фото, чтобы показать изменения
    setCurrentIndex(0);
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
      
      let formattedContent: ContentItem[] = partnerResponse.data.map((item: any) => ({
        id: item.id || item._id,
        url: item.url,
        resourceType: item.resourceType,
        createdAt: item.createdAt,
        title: item.title,
        description: item.description,
        encrypted: item.encrypted,
        mediaEnvelope: item.mediaEnvelope,
        encryptedTitle: item.encryptedTitle,
        encryptedDescription: item.encryptedDescription,
        metadataSenderId: item.metadataSenderId,
        metadataRecipientId: item.metadataRecipientId,
        targetId: item.targetId,
        userId: item.userId,
        eventId: item.eventId,
        isBirthdayEvent: item.isBirthdayEvent,
        isAnniversaryEvent: item.isAnniversaryEvent
      }));

      if (localDeviceKeys) {
        const decrypted = await decryptContentFieldsList(
          localDeviceKeys,
          formattedContent,
          user?._id,
          partnerId || undefined
        );
        formattedContent = decrypted.map((item) => ({
          id: item.id,
          url: item.url,
          resourceType: item.resourceType,
          createdAt: item.createdAt,
          title: item.title,
          description: item.description,
          encrypted: item.encrypted,
          mediaEnvelope: item.mediaEnvelope,
          eventId: item.eventId,
          isBirthdayEvent: item.isBirthdayEvent,
          isAnniversaryEvent: item.isAnniversaryEvent
        }));
      }

      setPartnerContent(formattedContent);
      
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

  const handleEventClick = (eventId: string) => {
    // Переходим к календарю и открываем событие
    window.location.href = `/calendar?event=${eventId}`;
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
        if (!localDeviceKeys) {
          throw new Error('Нет ключей для шифрования контента');
        }

        const { encryptAndUploadFiles } = await import('../crypto/encryptedUploadService');
        const uploaded = await encryptAndUploadFiles(files);

        await axios.post(
          `${API_URL}/api/feed/content-encrypted`,
          {
            target,
            frequency,
            items: uploaded.map((item) => ({
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
      const token = localStorage.getItem('token');
      
      formData.append('photo', file);
      
      const response = await axios.post(`${API_URL}/api/feed/relationship/photo`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Обновляем фото сразу после загрузки
      setRelationshipPhoto(response.data.photo);
    } catch (error) {
      console.error('Ошибка при добавлении фото:', error);
    }
  };
  
  const handleAddSignature = async (signatureDataUrl: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/api/feed/relationship/signature`, {
        signature: signatureDataUrl
      }, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      
      // Обновляем подписи сразу после сохранения
      if (response.data.signatures) {
        setRelationshipSignatures(response.data.signatures);
      }
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
        onEventClick={handleEventClick}
        navigateTo={!isPartnerAdded ? '/settings' : undefined}
        placeholder={!isPartnerAdded ? 'Нет доступного контента\n\n📅 Добавьте события в Календаре с фото и видео' : 'Нет доступного контента\n\n📅 Добавьте события в Календаре с фото и видео'}
        onEmptyClick={() => window.location.href = '/calendar'}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4, gap: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          Контент дня
        </Typography>
        <Tooltip
          title="Подборка обновляется в 02:00 и 17:00 (Europe/Minsk)"
          placement="top"
          arrow
          enterTouchDelay={0}
          leaveTouchDelay={3000}
        >
          <IconButton size="small" sx={{ color: 'text.secondary', p: 0.3 }} aria-label="Информация об обновлении контента">
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <DaysTogether
        daysCount={daysCount}
        relationshipStartDate={relationshipStartDate}
        onAddPhoto={handleAddPhoto}
        onAddSignature={handleAddSignature}
        photo={relationshipPhoto}
        signature={relationshipSignature}
        signatures={relationshipSignatures}
        currentUserId={user?._id}
        relationshipOwnerId={relationshipOwnerId}
      />
      
      {/* Временно закомментировано - контент теперь добавляется через Календарь */}
      {/* <Fab 
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
      </Fab> */}
      
      <ContentManagementDialog 
        open={addContentDialogOpen}
        onClose={() => setAddContentDialogOpen(false)}
        onSave={handleAddContent}
        hasPartner={!!daysCount}
        existingContent={userContent}
        onDeleteContent={handleDeleteContent}
        onContentReordered={handleContentReordered}
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