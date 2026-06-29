import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Box,
  Chip,
  useTheme,
} from '@mui/material';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import { formatCalendarDate } from '../../localization/calendarHelpers';
import { getNewsCategoryLabel } from '../../localization/newsHelpers';
import EventIcon from '@mui/icons-material/Event';
import UpdateIcon from '@mui/icons-material/Update';
import type { NewsTranslations } from '../../localization/newsContent';
import {
  getNewsCardContentSx,
  getNewsCardDateSx,
  getNewsCardMetaSx,
  getNewsCardSx,
  getNewsCardTitleSx,
  getNewsDetailMediaSx,
  NEWS_MEDIA_RADIUS,
} from './newsPageStyles';

export interface NewsItem {
  _id: string;
  title: string;
  content: string;
  translations?: NewsTranslations;
  image?: {
    url: string;
  };
  images?: Array<{
    url: string;
    caption?: string;
    resourceType?: 'image' | 'video';
    publicId?: string;
  }>;
  category: 'update' | 'event' | 'announcement';
  publishDate: string;
}

interface NewsCardProps {
  news: NewsItem;
  onClick: (news: NewsItem) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, onClick }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

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

  const coverMedia =
    news.images?.[0] ??
    (news.image ? { url: news.image.url, resourceType: 'image' as const } : null);

  const coverMediaSx = {
    ...getNewsDetailMediaSx(theme),
    height: 140,
    maxHeight: 140,
    objectFit: 'cover' as const,
    borderRadius: `${NEWS_MEDIA_RADIUS}px ${NEWS_MEDIA_RADIUS}px 0 0`,
    borderBottom: 'none',
  };

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onClick(news)}
      sx={{
        ...getNewsCardSx(theme),
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 0,
      }}
    >
      {coverMedia && (
        (coverMedia.resourceType ?? 'image') === 'video' ? (
          <Box component="video" src={coverMedia.url} muted playsInline sx={coverMediaSx} />
        ) : (
          <Box component="img" src={coverMedia.url} alt={news.title} sx={coverMediaSx} />
        )
      )}
      <Box sx={{ ...getNewsCardContentSx(), flexGrow: 1, width: '100%' }}>
        <Box sx={{ ...getNewsCardMetaSx(), justifyContent: 'space-between' }}>
          <Chip
            icon={getCategoryIcon(news.category)}
            label={getNewsCategoryLabel(t, news.category)}
            size="small"
            color={getCategoryColor(news.category) as 'primary' | 'secondary' | 'success'}
          />
          <Typography sx={getNewsCardDateSx()}>
            {formatCalendarDate(new Date(news.publishDate), i18n.language)}
          </Typography>
        </Box>
        <Typography component="h2" sx={{ ...getNewsCardTitleSx(), mt: 1 }}>
          {news.title}
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.75, textAlign: 'left' }}>
          {news.content.length > 120 ? `${news.content.substring(0, 120)}...` : news.content}
        </Typography>
      </Box>
    </Box>
  );
};

export default NewsCard;
