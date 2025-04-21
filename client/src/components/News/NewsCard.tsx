import React from 'react';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box, 
  Chip, 
  CardActionArea 
} from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import EventIcon from '@mui/icons-material/Event';
import UpdateIcon from '@mui/icons-material/Update';

export interface NewsItem {
  _id: string;
  title: string;
  content: string;
  image?: {
    url: string;
  };
  category: 'update' | 'event' | 'announcement';
  publishDate: string;
}

interface NewsCardProps {
  news: NewsItem;
  onClick: (news: NewsItem) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, onClick }) => {
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'update':
        return 'Обновление';
      case 'event':
        return 'Событие';
      case 'announcement':
      default:
        return 'Анонс';
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd MMMM yyyy', { locale: ru });
  };

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
        {news.image && (
          <CardMedia
            component="img"
            height="140"
            image={news.image.url}
            alt={news.title}
          />
        )}
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Chip 
              icon={getCategoryIcon(news.category)} 
              label={getCategoryLabel(news.category)} 
              size="small" 
              color={getCategoryColor(news.category) as any}
              sx={{ height: 24 }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatDate(news.publishDate)}
            </Typography>
          </Box>
          <Typography variant="h6" component="h2" gutterBottom>
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