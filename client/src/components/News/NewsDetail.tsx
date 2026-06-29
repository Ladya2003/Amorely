import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Box,
  Chip,
  IconButton,
  Modal,
  Slide,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import EventIcon from '@mui/icons-material/Event';
import UpdateIcon from '@mui/icons-material/Update';
import { useNavigation } from '../../contexts/NavigationContext';
import { formatCalendarDate } from '../../localization/calendarHelpers';
import { getNewsCategoryLabel } from '../../localization/newsHelpers';
import { claimNewsReadReward } from '../../services/newsService';
import { NewsItem } from './NewsCard';
import {
  getNewsDetailBodySx,
  getNewsDetailContentStackSx,
  getNewsDetailHeaderIconButtonSx,
  getNewsDetailHeaderSx,
  getNewsDetailHeaderTitleSx,
  getNewsDetailHeaderWrapSx,
  getNewsDetailImageSx,
  getNewsDetailMediaCaptionSx,
  getNewsDetailMetaSx,
  getNewsDetailRootSx,
  getNewsDetailScrollSx,
  getNewsDetailTitleSx,
  getNewsDetailVideoSx,
  NEWS_DETAIL_TRANSITION_MS,
} from './newsPageStyles';

interface NewsDetailProps {
  open: boolean;
  onClose: () => void;
  news: NewsItem | null;
}

const NewsDetail: React.FC<NewsDetailProps> = ({ open, onClose, news }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { setShowBottomNav } = useNavigation();
  const [activeNews, setActiveNews] = useState<NewsItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open && news) {
      setActiveNews(news);
      const frameId = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => window.cancelAnimationFrame(frameId);
    }

    if (!open) {
      setIsVisible(false);
    }

    return undefined;
  }, [open, news]);

  useEffect(() => {
    if (!activeNews) {
      return;
    }

    setShowBottomNav(false);
    return () => {
      setShowBottomNav(true);
    };
  }, [activeNews, setShowBottomNav]);

  useEffect(() => {
    if (!isVisible || !activeNews?._id) {
      return;
    }

    void claimNewsReadReward(activeNews._id).catch(() => {
      // Reward is best-effort; ignore network errors.
    });
  }, [isVisible, activeNews?._id]);

  const handleRequestClose = () => {
    setIsVisible(false);
  };

  const handleExited = () => {
    setActiveNews(null);
    onClose();
  };

  if (!activeNews) {
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'update':
        return <UpdateIcon fontSize="small" />;
      case 'event':
        return <EventIcon fontSize="small" />;
      case 'announcement':
      default:
        return <AnnouncementIcon fontSize="small" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'update':
        return 'primary';
      case 'event':
        return 'secondary';
      case 'announcement':
      default:
        return 'success';
    }
  };

  const galleryMedia = activeNews.images?.length
    ? activeNews.images
    : activeNews.image
      ? [{ url: activeNews.image.url, resourceType: 'image' as const }]
      : [];

  return (
    <Modal
      open={Boolean(activeNews)}
      onClose={handleRequestClose}
      closeAfterTransition
      hideBackdrop
      sx={{
        zIndex: theme.zIndex.modal + 2,
      }}
    >
      <Slide
        direction="left"
        in={isVisible}
        onExited={handleExited}
        mountOnEnter
        unmountOnExit
        timeout={NEWS_DETAIL_TRANSITION_MS}
      >
        <Box sx={getNewsDetailRootSx(theme)} tabIndex={-1}>
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
            }}
          >
            <Box sx={getNewsDetailHeaderWrapSx()}>
              <Box sx={getNewsDetailHeaderSx(theme)}>
                <IconButton
                  edge="start"
                  onClick={handleRequestClose}
                  aria-label={t('common.back', { defaultValue: 'Назад' })}
                  size="small"
                  sx={getNewsDetailHeaderIconButtonSx(theme)}
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography component="h1" noWrap sx={getNewsDetailHeaderTitleSx()}>
                  {activeNews.title}
                </Typography>
              </Box>
            </Box>

            <Box sx={getNewsDetailScrollSx()}>
              <Box sx={getNewsDetailContentStackSx()}>
                <Typography component="h2" sx={getNewsDetailTitleSx()}>
                  {activeNews.title}
                </Typography>

                <Box sx={getNewsDetailMetaSx()}>
                  <Typography variant="body2" color="text.secondary">
                    {formatCalendarDate(new Date(activeNews.publishDate), i18n.language)}
                  </Typography>
                  <Chip
                    icon={getCategoryIcon(activeNews.category)}
                    label={getNewsCategoryLabel(t, activeNews.category)}
                    size="small"
                    color={getCategoryColor(activeNews.category) as 'primary' | 'secondary' | 'success'}
                  />
                </Box>

                <Typography component="div" sx={getNewsDetailBodySx()}>
                  {activeNews.content}
                </Typography>

                {galleryMedia.map((media, mediaIndex) => (
                  <Box key={mediaIndex}>
                    {media.caption && (
                      <Typography sx={getNewsDetailMediaCaptionSx()}>{media.caption}</Typography>
                    )}
                    {(media.resourceType ?? 'image') === 'video' ? (
                      <Box
                        component="video"
                        src={media.url}
                        controls
                        playsInline
                        sx={getNewsDetailVideoSx(theme)}
                      />
                    ) : (
                      <Box
                        component="img"
                        src={media.url}
                        alt={media.caption || activeNews.title}
                        sx={getNewsDetailImageSx(theme)}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Slide>
    </Modal>
  );
};

export default NewsDetail;
