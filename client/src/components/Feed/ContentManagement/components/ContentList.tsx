// Список контента

import React from 'react';
import {
  List,
  ListItem,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoIcon from '@mui/icons-material/Photo';
import VideocamIcon from '@mui/icons-material/Videocam';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { ContentItem } from '../types';
import { formatFileSize, formatDate } from '../utils/helpers';

interface ContentListProps {
  content: ContentItem[];
  draggedItem: string | null;
  dragOverItem: string | null;
  isDragging: boolean;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent, itemId: string) => void;
  onDelete: (contentId: string) => void;
}

const ContentList: React.FC<ContentListProps> = ({
  content,
  draggedItem,
  dragOverItem,
  isDragging,
  onPointerDown,
  onDelete
}) => {
  return (
    <List sx={{ mt: 2 }}>
      {content.map((item) => (
        <ListItem
          key={item.id}
          data-content-id={item.id}
          sx={{
            mb: 1,
            border: dragOverItem === item.id ? '2px dashed' : '1px solid',
            borderColor: dragOverItem === item.id ? 'primary.main' : 'divider',
            borderRadius: 1,
            opacity: draggedItem === item.id ? 0.7 : 1,
            transform: dragOverItem === item.id ? 'scale(1.01)' : 'scale(1)',
            transition: isDragging ? 'none' : 'all 0.2s ease',
            userSelect: 'none',
            position: 'relative',
            p: 1,
            '&:hover': {
              bgcolor: 'action.hover',
              transform: draggedItem === item.id ? 'scale(1)' : 'scale(1.005)'
            }
          }}
        >
          {/* Drag Handle */}
          <Box
            onMouseDown={(e) => onPointerDown(e, item.id)}
            onTouchStart={(e) => onPointerDown(e, item.id)}
            sx={{
              position: 'absolute',
              left: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              cursor: isDragging && draggedItem === item.id ? 'grabbing' : 'grab',
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '4px',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.2)',
              }
            }}
          >
            <DragHandleIcon fontSize="small" />
          </Box>

          {/* Контент */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              ml: 4,
              gap: 1,
              pr: 1
            }}
          >
            <Avatar
              variant="rounded"
              src={item.url}
              sx={{ width: 48, height: 48, flexShrink: 0 }}
            >
              {item.type === 'image' ? <PhotoIcon fontSize="small" /> : <VideocamIcon fontSize="small" />}
            </Avatar>

            <Box sx={{ flexGrow: 1, minWidth: 0, mr: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flexGrow: 1,
                    minWidth: 0
                  }}
                >
                  {item.name}
                </Typography>
                <Chip
                  icon={item.type === 'image' ? <PhotoIcon sx={{ fontSize: '12px !important' }} /> : <VideocamIcon sx={{ fontSize: '12px !important' }} />}
                  label={item.type === 'image' ? 'Фото' : 'Видео'}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    flexShrink: 0,
                    '& .MuiChip-label': { px: 0.5 }
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {item.size > 0 ? formatFileSize(item.size) : 'Размер неизвестен'} • {formatDate(item.uploadedAt)}
                </Typography>
                {item.uploadedBy && (
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                    {item.uploadedBy.name || item.uploadedBy.email || 'Пользователь'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Кнопка удаления */}
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(item.id)}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 24,
              height: 24,
              backgroundColor: 'rgba(255,255,255,0.9)',
              '&:hover': {
                backgroundColor: 'error.main',
                color: 'white'
              }
            }}
          >
            <DeleteIcon sx={{ fontSize: '16px' }} />
          </IconButton>
        </ListItem>
      ))}
    </List>
  );
};

export default ContentList;

