import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DescriptionIcon from '@mui/icons-material/Description';

interface CalendarDayProps {
  date: Date;
  content: {
    mediaUrl: string;
    type: 'image' | 'video';
    _id?: string;
  } | null;
  onContentClick?: (eventId: string) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ date, content, onContentClick }) => {
  const day = format(date, 'd');
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const handleClick = () => {
    if (content && content._id && onContentClick) {
      onContentClick(content._id);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        cursor: content ? 'pointer' : 'default'
      }}
      onClick={handleClick}
    >
      <Avatar 
        sx={{ 
          width: 40, 
          height: 40, 
          bgcolor: isToday ? 'primary.main' : content ? (content.mediaUrl === 'placeholder' ? 'primary.light' : 'transparent') : 'grey.200',
          border: content ? '2px solid #ff4b8d' : 'none',
          position: 'relative'
        }}
      >
        {content ? (
          content.mediaUrl === 'placeholder' ? (
            // Текстовое событие - показываем иконку
            <DescriptionIcon sx={{ fontSize: 20, color: 'white' }} />
          ) : (
            // Событие с медиа - показываем превью
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
              <Avatar 
                src={content.mediaUrl} 
                sx={{ width: '100%', height: '100%' }}
                variant="circular"
              />
              {content.type === 'video' && (
                <PlayCircleIcon 
                  sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    fontSize: 16
                  }} 
                />
              )}
            </Box>
          )
        ) : (
          <Typography 
            variant="body2" 
            color={isToday ? 'white' : 'text.primary'}
          >
            {day}
          </Typography>
        )}
      </Avatar>
      {content && (
        <Typography variant="caption" sx={{ mt: 0.5 }}>
          {day}
        </Typography>
      )}
    </Box>
  );
};

export default CalendarDay; 