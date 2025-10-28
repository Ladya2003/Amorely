import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import CakeIcon from '@mui/icons-material/Cake';
import FavoriteIcon from '@mui/icons-material/Favorite';

interface CalendarDayProps {
  date: Date;
  content: {
    mediaUrl: string;
    type: 'image' | 'video';
    _id?: string;
    isBirthdayEvent?: boolean;
    isAnniversaryEvent?: boolean;
  } | null;
  onContentClick?: (eventId: string) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ date, content, onContentClick }) => {
  const day = format(date, 'd');
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isBirthdayEvent = content && content.isBirthdayEvent;
  const isAnniversaryEvent = content && content.isAnniversaryEvent;
  const hasNoEvents = !isBirthdayEvent && !isAnniversaryEvent;

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
      {/* Контейнер для картинки события с relative позиционированием */}
      <Box
        sx={{
          position: 'relative',
          width: 40,
          height: 40,
          overflow: 'hidden',
          bgcolor: isToday ? 'primary.main' : content ? (content.mediaUrl === 'placeholder' ? 'primary.light' : 'transparent') : 'grey.200',
          borderRadius: hasNoEvents ? '50%' : '0%'
        }}
      >
        {content ? (
          content.mediaUrl === 'placeholder' ? (
            // Текстовое событие - показываем иконку
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '2px solid #ff4b8d'
              }}
            >
              <DescriptionIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
          ) : (
            // Событие с медиа - показываем превью
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
              <Avatar 
                src={content.mediaUrl} 
                sx={{ 
                  width: '100%', 
                  height: '100%',
                  borderRadius: '50%',
                  border: '2px solid #ff4b8d'
                }}
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
                    fontSize: 16,
                    zIndex: 5
                  }} 
                />
              )}
            </Box>
          )
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography 
              variant="body2" 
              color={isToday ? 'white' : 'text.primary'}
            >
              {day}
            </Typography>
          </Box>
        )}
        
        {/* Маленький бейджик дня рождения - 20px, top: 0, right: 0 */}
        {isBirthdayEvent && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              bgcolor: 'secondary.main',
              borderRadius: '50%',
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 2,
              zIndex: 100,
              border: '1px solid white'
            }}
          >
            <CakeIcon sx={{ fontSize: 12, color: 'white' }} />
          </Box>
        )}
        
        {/* Бейджик годовщины */}
        {isAnniversaryEvent && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              ...(isBirthdayEvent ? { left: 0 } : { right: 0 }),
              bgcolor: 'error.main',
              borderRadius: '50%',
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 2,
              zIndex: 100,
              border: '1px solid white'
            }}
          >
            <FavoriteIcon sx={{ fontSize: 12, color: 'white' }} />
          </Box>
        )}
      </Box>
      
      {content && (
        <Typography variant="caption" sx={{ mt: 0.5 }}>
          {day}
        </Typography>
      )}
    </Box>
  );
};

export default CalendarDay; 