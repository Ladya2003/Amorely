import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box, 
  Chip, 
  CardActionArea 
} from '@mui/material';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import { formatCalendarDate } from '../../localization/calendarHelpers';
import { getNewsCategoryLabel } from '../../localization/newsHelpers';
import EventIcon from '@mui/icons-material/Event';
import UpdateIcon from '@mui/icons-material/Update';

import type { NewsTranslations } from '../../localization/newsContent';

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
        return 'info';
      case 'event':
        return 'success';
      case 'announcement':
      default:
        return 'warning';
    }
  };

  const coverMedia =
    news.images?.[0] ??
    (news.image ? { url: news.image.url, resourceType: 'image' as const } : null);

  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardActionArea onClick={() => onClick(news)}>
        {coverMedia && (
          (coverMedia.resourceType ?? 'image') === 'video' ? (
            <CardMedia
              component="video"
              height="140"
              src={coverMedia.url}
              muted
              playsInline
              sx={{ objectFit: 'cover' }}
            />
          ) : (
            <CardMedia
              component="img"
              height="140"
              image={coverMedia.url}
              alt={news.title}
            />
          )
        )}
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Chip 
              icon={getCategoryIcon(news.category)} 
              label={getNewsCategoryLabel(t, news.category)} 
              size="small" 
              color={getCategoryColor(news.category) as any}
              sx={{ height: 24 }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatCalendarDate(new Date(news.publishDate), i18n.language)}
            </Typography>
          </Box>
          <Typography variant="h6" component="h2" fontWeight={400} gutterBottom>
            {news.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {news.content.length > 120 
              ? `${news.content.substring(0, 120)}...` 
              : news.content}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default NewsCard; 