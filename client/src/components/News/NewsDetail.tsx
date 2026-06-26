import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Box,
  Chip,
  IconButton,
  AppBar,
  Toolbar,
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

interface NewsDetailProps {
  open: boolean;
  onClose: () => void;
  news: NewsItem | null;
}

const NewsDetail: React.FC<NewsDetailProps> = ({ open, onClose, news }) => {
  const { t, i18n } = useTranslation();
  const { setShowBottomNav } = useNavigation();

  useEffect(() => {
    if (!open) {
      return;
    }

    setShowBottomNav(false);
    return () => {
      setShowBottomNav(true);
    };
  }, [open, setShowBottomNav]);

  useEffect(() => {
    if (!open || !news?._id) {
      return;
    }

    void claimNewsReadReward(news._id).catch(() => {
      // Reward is best-effort; ignore network errors.
    });
  }, [open, news?._id]);

  if (!open || !news) {
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

  const galleryMedia = news.images?.length
    ? news.images
    : news.image
      ? [{ url: news.image.url, resourceType: 'image' as const }]
      : [];

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (theme) => theme.zIndex.modal + 1,
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
          <IconButton edge="start" onClick={onClose} aria-label="Назад">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" noWrap sx={{ flex: 1, fontWeight: 500 }}>
            {news.title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 2,
          py: 2,
          pb: 3,
        }}
      >
        <Typography variant="h5" component="h1" fontWeight={400} sx={{ mb: 1.5 }}>
          {news.title}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {formatCalendarDate(new Date(news.publishDate), i18n.language)}
          </Typography>
          <Chip
            icon={getCategoryIcon(news.category)}
            label={getNewsCategoryLabel(t, news.category)}
            size="small"
            color={getCategoryColor(news.category) as 'primary' | 'secondary' | 'success'}
          />
        </Box>

        <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
          {news.content}
        </Typography>

        {galleryMedia.map((media, mediaIndex) => (
          <Box key={mediaIndex} sx={{ mb: 2 }}>
            {media.caption && (
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                {media.caption}
              </Typography>
            )}
            {(media.resourceType ?? 'image') === 'video' ? (
              <Box
                component="video"
                src={media.url}
                controls
                playsInline
                sx={{
                  width: '100%',
                  maxHeight: 480,
                  borderRadius: 1,
                  display: 'block',
                  bgcolor: 'black',
                }}
              />
            ) : (
              <Box
                component="img"
                src={media.url}
                alt={media.caption || news.title}
                sx={{
                  width: '100%',
                  maxHeight: 480,
                  objectFit: 'contain',
                  borderRadius: 1,
                  display: 'block',
                }}
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default NewsDetail;
