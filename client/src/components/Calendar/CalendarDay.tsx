import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { format } from 'date-fns';
import DescriptionIcon from '@mui/icons-material/Description';
import CakeIcon from '@mui/icons-material/Cake';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DecryptedMedia from '../common/DecryptedMedia';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';
import {
  getCalendarDayContentSx,
  getCalendarDayEmptySx,
  getCalendarDayPlaceholderSx,
} from './calendarPageStyles';

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
  onAddContent?: (date: Date) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  content,
  isOutsideMonth = false,
  onContentClick,
  onAddContent,
}) => {
  const theme = useTheme();
  const day = format(date, 'd');
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isBirthdayEvent = content && content.isBirthdayEvent;
  const isAnniversaryEvent = content && content.isAnniversaryEvent;

  const handleClick = () => {
    if (isOutsideMonth) {
      return;
    }

    if (content && content._id && onContentClick) {
      onContentClick(content._id);
      return;
    }

    if (!content && onAddContent) {
      onAddContent(date);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: !isOutsideMonth ? 'pointer' : 'default',
        opacity: isOutsideMonth ? 0.35 : 1,
      }}
      onClick={handleClick}
    >
      <Box
        sx={{
          position: 'relative',
          width: 40,
          height: 40,
          overflow: 'visible',
        }}
      >
        {content ? (
          content.mediaUrl === 'placeholder' ? (
            <Box sx={getCalendarDayPlaceholderSx(theme)}>
              <DescriptionIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            </Box>
          ) : (
            <Box sx={getCalendarDayContentSx(theme)}>
              <DecryptedMedia
                cacheKey={`cal-day-${content._id}-${content.mediaId || '0'}`}
                url={content.mediaUrl}
                resourceType={content.type}
                encrypted={content.encrypted}
                mediaEnvelope={content.mediaEnvelope}
                videoPreview={content.type === 'video'}
                imageStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loadingMinHeight={40}
              />
            </Box>
          )
        ) : (
          <Box sx={getCalendarDayEmptySx(theme, { isToday, isOutsideMonth })}>
            <Typography variant="body2" color={isToday && !isOutsideMonth ? 'primary.contrastText' : 'text.secondary'}>
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
              border: '1px solid white',
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
              border: '1px solid white',
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
