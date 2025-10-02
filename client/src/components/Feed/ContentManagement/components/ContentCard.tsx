// Карточка контента для сетки

import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Typography,
  Chip,
  Tooltip,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoIcon from '@mui/icons-material/Photo';
import VideocamIcon from '@mui/icons-material/Videocam';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { ContentItem } from '../types';
import { formatFileSize, formatDate } from '../utils/helpers';

interface ContentCardProps {
  item: ContentItem;
  isDragged: boolean;
  isDragOver: boolean;
  isDragging: boolean;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent, itemId: string) => void;
  onDelete: (contentId: string) => void;
}

const ContentCard: React.FC<ContentCardProps> = ({
  item,
  isDragged,
  isDragOver,
  isDragging,
  onPointerDown,
  onDelete
}) => {
  return (
    <Card
      data-content-id={item.id}
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: isDragged ? 0.7 : 1,
        transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        border: isDragOver ? '2px dashed' : '1px solid',
        borderColor: isDragOver ? 'primary.main' : 'divider',
        userSelect: 'none',
        '&:hover': {
          transform: isDragged ? 'scale(1)' : 'scale(1.01)'
        }
      }}
    >
      {/* Drag Handle */}
      <Box
        onMouseDown={(e) => onPointerDown(e, item.id)}
        onTouchStart={(e) => onPointerDown(e, item.id)}
        sx={{
          position: 'absolute',
          top: 4,
          left: 4,
          zIndex: 10,
          cursor: isDragging && isDragged ? 'grabbing' : 'grab',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          borderRadius: '4px',
          padding: { xs: '2px', sm: '4px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.9)',
          }
        }}
      >
        <DragHandleIcon sx={{ fontSize: { xs: '16px', sm: '20px' } }} />
      </Box>

      <Box sx={{ position: 'relative', paddingTop: '100%' }}>
        {item.type === 'image' ? (
          <CardMedia
            component="img"
            image={item.url}
            alt={item.name}
            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <CardMedia
            component="video"
            src={item.url}
            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <Chip
          icon={item.type === 'image' ? <PhotoIcon fontSize="small" /> : <VideocamIcon fontSize="small" />}
          label={item.type === 'image' ? 'Фото' : 'Видео'}
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            height: { xs: 20, sm: 24 },
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
            '& .MuiChip-label': {
              px: { xs: 0.5, sm: 1 }
            }
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 1, p: { xs: 1, sm: 2 } }}>
        <Tooltip title={item.name}>
          <Typography
            variant="body2"
            noWrap
            sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            {item.name}
          </Typography>
        </Tooltip>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          {item.size > 0 ? formatFileSize(item.size) : 'Размер неизвестен'}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          {formatDate(item.uploadedAt)}
        </Typography>
        {item.uploadedBy && (
          <Typography
            variant="caption"
            color="primary"
            display="block"
            sx={{ fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          >
            Загрузил: {item.uploadedBy.name || item.uploadedBy.email || 'Пользователь'}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ pt: 0, p: { xs: 1, sm: 2 } }}>
        <Button
          size="small"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => onDelete(item.id)}
          fullWidth
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 0.5, sm: 1 }
          }}
        >
          Удалить
        </Button>
      </CardActions>
    </Card>
  );
};

export default ContentCard;

