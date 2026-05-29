import React from 'react';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Typography, 
  Box, 
  Chip, 
  Divider 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import EventIcon from '@mui/icons-material/Event';
import UpdateIcon from '@mui/icons-material/Update';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { NewsItem } from './NewsCard';

interface NewsDetailProps {
  open: boolean;
  onClose: () => void;
  news: NewsItem | null;
}

const NewsDetail: React.FC<NewsDetailProps> = ({ open, onClose, news }) => {
  if (!news) return null;

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
    <ResponsiveDialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ pr: 6, fontWeight: 400 }}>
        {news.title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Chip 
            icon={getCategoryIcon(news.category)} 
            label={getCategoryLabel(news.category)} 
            size="small" 
            color={getCategoryColor(news.category) as any}
          />
          <Typography variant="body2" color="text.secondary">
            {formatDate(news.publishDate)}
          </Typography>
        </Box>
        
        {news.image && (
          <Box 
            component="img" 
            src={news.image.url} 
            alt={news.title}
            sx={{ 
              width: '100%', 
              maxHeight: 400, 
              objectFit: 'contain', 
              mb: 2,
              borderRadius: 1
            }}
          />
        )}
        
        <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
          {news.content}
        </Typography>

        {news.images?.map((image, imageIndex) => (
          <Box key={imageIndex} sx={{ mt: 2 }}>
            {image.caption && (
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                {image.caption}
              </Typography>
            )}
            <Box
              component="img"
              src={image.url}
              alt={image.caption || news.title}
              sx={{
                width: '100%',
                maxHeight: 480,
                objectFit: 'contain',
                borderRadius: 1,
                display: 'block',
              }}
            />
          </Box>
        ))}
      </DialogContent>
    </ResponsiveDialog>
  );
};

export default NewsDetail; 