import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Box, Container, Fab, Badge, Typography, Tooltip, IconButton, useTheme } from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import FeedHeader from '../components/Feed/FeedHeader';
import LocaleBanner from '../components/Feed/LocaleBanner';
import InstallAppBanner from '../components/Feed/InstallAppBanner';
import ContentSlider, { ContentItem } from '../components/Feed/ContentSlider';
import DaysTogether from '../components/Feed/DaysTogether';
import AdminRequestSection from '../components/Feed/AdminRequest';
import PetSection from '../components/Pets/PetSection';
import DailyQuestionsSection from '../components/Feed/DailyQuestions/DailyQuestionsSection';
import DatingIdeasSection from '../components/Feed/DatingIdeas/DatingIdeasSection';
import ContentManagementDialog from '../components/Feed/ContentManagement';
import ContentViewer from '../components/Feed/ContentViewer';
import { useCrypto } from '../contexts/CryptoContext';
import { useFeedHome } from '../contexts/FeedHomeContext';
import { decryptContentItemsWithMedia } from '../crypto/contentCryptoService';
import type { LocalDeviceKeys } from '../crypto/cryptoService';
import { usePartnerId, useEncryptionRecipientId } from '../hooks/usePartnerId';
import { PARTNER_CHANGED_EVENT } from '../hooks/useRelationship';
import { getFeedContentUpdateTooltipSlotProps } from '../components/Feed/feedBannerStyles';
import { EditIcon, InfoOutlinedIcon } from '../components/UI/icons';

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

const mapFeedContentItem = (item: any): ContentItem => ({
  id: item.id || item._id,
  url: item.url,
  resourceType: item.resourceType,
  createdAt: item.createdAt,
  title: item.title,
  description: item.description,
  encrypted: item.encrypted,
  mediaEnvelope: item.mediaEnvelope,
  eventId: item.eventId,
  isBirthdayEvent: item.isBirthdayEvent,
  isAnniversaryEvent: item.isAnniversaryEvent,
  isDatingIdeaEvent: item.isDatingIdeaEvent,
  datingIdeaEmoji: item.datingIdeaEmoji,
  datingIdeaTitle: item.datingIdeaTitle,
  datingIdeaDescription: item.datingIdeaDescription,
});

const formatFeedContentItems = async (
  items: any[],
  localDeviceKeys: LocalDeviceKeys | null,
  userId?: string,
  partnerId?: string | null
): Promise<ContentItem[]> => {
  let formattedContent = items.map((item) => ({
    ...mapFeedContentItem(item),
    encryptedMediaEnvelope: item.encryptedMediaEnvelope,
    encryptedMediaEnvelopePartner: item.encryptedMediaEnvelopePartner,
    encryptedTitle: item.encryptedTitle,
    encryptedDescription: item.encryptedDescription,
    encryptedTitlePartner: item.encryptedTitlePartner,
    encryptedDescriptionPartner: item.encryptedDescriptionPartner,
    metadataSenderId: item.metadataSenderId,
    metadataRecipientId: item.metadataRecipientId,
    targetId: item.targetId,
    userId: item.userId,
    createdBy: item.createdBy,
  }));

  if (!localDeviceKeys) {
    return formattedContent.map(mapFeedContentItem);
  }

  const decrypted = await decryptContentItemsWithMedia(
    localDeviceKeys,
    formattedContent,
    userId,
    partnerId || undefined
  );
  return decrypted.map(mapFeedContentItem);
};

const FeedPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { localDeviceKeys, isCryptoBootstrapComplete } = useCrypto();
  const { data: feedHome, loading: isFeedHomeLoading, refresh: refreshFeedHome } = useFeedHome();
  const partnerId = usePartnerId();
  const encryptionRecipientId = useEncryptionRecipientId();
  
  // Состояние для табов
  const [tabValue, setTabValue] = useState(0);
  
  // Состояние для контента
  const [partnerContent, setPartnerContent] = useState<ContentItem[]>([]);
  const [selfContent, setSelfContent] = useState<ContentItem[]>([]);
  const [userContent, setUserContent] = useState<UserContentItem[]>([]); // Контент для управления
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Состояние для отношений
  const [daysCount, setDaysCount] = useState<number | null>(null);
  const [relationshipStartDate, setRelationshipStartDate] = useState<string | null>(null);
  const [relationshipPhoto, setRelationshipPhoto] = useState<string | undefined>();
  const [relationshipSignature, setRelationshipSignature] = useState<string | undefined>();
  const [relationshipSignatures, setRelationshipSignatures] = useState<{ user?: string; partner?: string }>({});
  const [relationshipOwnerId, setRelationshipOwnerId] = useState<string | null>(null); // ID владельца отношений
  const [isRelationshipLoading, setIsRelationshipLoading] = useState(true);
  
  // Состояние для диалогов
  const [addContentDialogOpen, setAddContentDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    if (!feedHome) {
      setIsRelationshipLoading(isFeedHomeLoading);
      if (isFeedHomeLoading) {
        setIsContentLoading(true);
      }
      return;
    }

    if (feedHome.relationship) {
      setRelationshipStartDate(feedHome.relationship.startDate);
      setDaysCount(feedHome.relationship.daysCount);
      setRelationshipPhoto(feedHome.relationship.photo);
      setRelationshipSignature(feedHome.relationship.signature);
      setRelationshipSignatures(feedHome.relationship.signatures || {});
      setRelationshipOwnerId(feedHome.relationship.ownerId);
    } else {
      setRelationshipStartDate(null);
      setDaysCount(null);
      setRelationshipPhoto(undefined);
      setRelationshipSignature(undefined);
      setRelationshipSignatures({});
      setRelationshipOwnerId(null);
    }
    setIsRelationshipLoading(false);
  }, [feedHome, isFeedHomeLoading]);

  useEffect(() => {
    if (!feedHome || !isCryptoBootstrapComplete) {
      return;
    }

    let cancelled = false;

    const applyHomeContent = async () => {
      setIsContentLoading(true);
      setCurrentIndex(0);
      try {
        const formattedContent = await formatFeedContentItems(
          feedHome.content,
          localDeviceKeys,
          user?._id,
          partnerId
        );
        if (!cancelled) {
          setPartnerContent(formattedContent);
        }
      } catch (error) {
        console.error('Ошибка при загрузке контента:', error);
      } finally {
        if (!cancelled) {
          setIsContentLoading(false);
        }
      }
    };

    void applyHomeContent();
    return () => {
      cancelled = true;
    };
  }, [feedHome, isCryptoBootstrapComplete, localDeviceKeys, user?._id, partnerId]);

  useEffect(() => {
    if (!addContentDialogOpen) {
      return;
    }

    void fetchUserContent();
  }, [addContentDialogOpen, localDeviceKeys, user?._id, partnerId]);

  useEffect(() => {
    if (!user?._id || location.pathname !== '/') {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const claimMedalStipends = () => {
      void axios
        .post(`${API_URL}/api/currency/medal-stipends`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {});
    };

    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(claimMedalStipends, { timeout: 3000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(claimMedalStipends, 500);
    return () => window.clearTimeout(timeoutId);
  }, [user?._id, location.pathname]);

  useEffect(() => {
    const contentId = searchParams.get('content');
    if (!contentId || isContentLoading) {
      return;
    }

    const partnerItem = partnerContent.find((item) => item.id === contentId);
    const selfItem = selfContent.find((item) => item.id === contentId);
    const matchedItem = partnerItem || selfItem;

    if (matchedItem) {
      setTabValue(partnerItem ? 0 : 1);
      setSelectedContent(matchedItem);
      setViewerOpen(true);
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('content');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, isContentLoading, partnerContent, selfContent, setSearchParams]);

  useEffect(() => {
    const handlePartnerChanged = () => {
      void refreshFeedHome();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && location.pathname === '/') {
        void refreshFeedHome();
      }
    };

    window.addEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [refreshFeedHome, location.pathname]);
  
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
        items = await decryptContentItemsWithMedia(
          localDeviceKeys,
          items,
          user?._id,
          partnerId || undefined
        );
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
      setIsContentLoading(true);
      setPartnerContent([]);
      setCurrentIndex(0);

      const token = localStorage.getItem('token');
      if (!token) {
        setIsContentLoading(false);
        return;
      }
      
      // Загружаем контент от партнера
      const partnerResponse = await axios.get(`${API_URL}/api/feed/content?target=partner`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const formattedContent = await formatFeedContentItems(
        partnerResponse.data,
        localDeviceKeys,
        user?._id,
        partnerId
      );

      setPartnerContent(formattedContent);
    } catch (error) {
      console.error('Ошибка при загрузке контента:', error);
    } finally {
      setIsContentLoading(false);
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
    navigate(`/calendar?event=${eventId}`);
  };
  
  const handleAddContent = async (
    files: File[], 
    target: 'self' | 'partner', 
    frequency: { count: number, hours: number }, 
    applyNow: boolean,
    resetRotation?: boolean
  ) => {
    try {
      setIsContentLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setIsContentLoading(false);
        return;
      }
      
      // Если есть файлы, загружаем их
      if (files.length > 0) {
        if (!localDeviceKeys) {
          throw new Error('Нет ключей для шифрования контента');
        }
        if (!encryptionRecipientId) {
          throw new Error('Не удалось определить получателя шифрования');
        }

        const { encryptAndUploadContentFiles } = await import('../crypto/encryptedUploadService');
        const uploaded = await encryptAndUploadContentFiles(
          files,
          localDeviceKeys,
          encryptionRecipientId
        );

        await axios.post(
          `${API_URL}/api/feed/content-encrypted`,
          {
            target,
            frequency,
            items: uploaded.map((item) => ({
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
    } catch (error) {
      console.error('Ошибка при добавлении контента:', error);
      setIsContentLoading(false);
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
      <FeedHeader />

      <LocaleBanner />
      <InstallAppBanner />

      <ContentSlider 
        content={partnerContent} 
        isLoading={isContentLoading}
        onContentClick={handleContentClick}
        onEventClick={handleEventClick}
        navigateTo="/calendar"
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4, gap: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('feed.contentOfDay')}
        </Typography>
        <Tooltip
          title={t('feed.contentUpdateTooltip')}
          placement="top"
          arrow
          enterTouchDelay={0}
          leaveTouchDelay={3000}
          slotProps={getFeedContentUpdateTooltipSlotProps(theme)}
        >
          <IconButton size="small" sx={{ color: 'text.secondary', p: 0.3 }} aria-label={t('feed.contentUpdateAriaLabel')}>
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <DailyQuestionsSection />

      <PetSection />

      <Box sx={{ mb: 3 }}>
        <DatingIdeasSection />
      </Box>

      <Box sx={{ mb: 3 }}>
        <DaysTogether
          daysCount={daysCount}
          relationshipStartDate={relationshipStartDate}
          isLoading={isRelationshipLoading}
          onAddPhoto={handleAddPhoto}
          onAddSignature={handleAddSignature}
          photo={relationshipPhoto}
          signature={relationshipSignature}
          signatures={relationshipSignatures}
          currentUserId={user?._id}
          relationshipOwnerId={relationshipOwnerId}
        />
      </Box>

      <Box sx={{ pb: { xs: 10, sm: 0 } }}>
        <AdminRequestSection />
      </Box>
      
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