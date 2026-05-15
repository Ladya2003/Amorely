import React from 'react';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import CakeIcon from '@mui/icons-material/Cake';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DecryptedMedia from '../common/DecryptedMedia';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';

interface CalendarDayProps {
  date: Date;
  isOutsideMonth?: boolean;
  content: {
    mediaUrl: string;
    type: 'image' | 'video';
    _id?: string;
    mediaId?: string;
    encrypted?: boolean;
    mediaEnvelope?: ContentMediaEnvelope;
    isBirthdayEvent?: boolean;
    isAnniversaryEvent?: boolean;
  } | null;
  onContentClick?: (eventId: string) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ date, content, isOutsideMonth = false, onContentClick }) => {
  const day = format(date, 'd');
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isBirthdayEvent = content && content.isBirthdayEvent;
  const isAnniversaryEvent = content && content.isAnniversaryEvent;

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
        cursor: content && !isOutsideMonth ? 'pointer' : 'default',
        opacity: isOutsideMonth ? 0.35 : 1,
      }}
      onClick={isOutsideMonth ? undefined : handleClick}
    >
      <Box
        sx={{
          position: 'relative',
          width: 40,
          height: 40,
          overflow: 'visible',
          bgcolor: isOutsideMonth
            ? 'transparent'
            : content
              ? content.mediaUrl === 'placeholder' ? 'primary.light' : 'transparent'
              : isToday
                ? 'primary.main'
                : 'grey.200',
          borderRadius: '50%'
        }}
      >
        {content ? (
          content.mediaUrl === 'placeholder' ? (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '2px solid #ff4b8d',
                overflow: 'hidden'
              }}
            >
              <DescriptionIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                borderRadius: '50%',
                border: '2px solid #ff4b8d',
                overflow: 'hidden'
              }}
            >
              <DecryptedMedia
                cacheKey={`cal-day-${content._id}-${content.mediaId || '0'}`}
                url={content.mediaUrl}
                resourceType={content.type}
                encrypted={content.encrypted}
                mediaEnvelope={content.mediaEnvelope}
                imageStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loadingMinHeight={40}
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
              justifyContent: 'center'
            }}
          >
            <Typography variant="body2" color={isToday && !isOutsideMonth ? 'white' : 'text.secondary'}>
              {day}
            </Typography>
          </Box>
        )}

        {isBirthdayEvent && (
          <Box
            sx={{
              position: 'absolute',
              top: -4,
              right: -4,
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

        {isAnniversaryEvent && (
          <Box
            sx={{
              position: 'absolute',
              top: -4,
              ...(isBirthdayEvent ? { left: -4 } : { right: -4 }),
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
    </Box>
  );
};

export default CalendarDay;
