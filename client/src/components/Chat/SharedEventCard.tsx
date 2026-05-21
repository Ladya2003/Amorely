import React from 'react';
import { Box, Typography } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ImageIcon from '@mui/icons-material/Image';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import DecryptedMedia from '../common/DecryptedMedia';
import type { SharedEventRef } from './ChatDialog';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';

interface SharedEventCardProps {
  sharedEvent: SharedEventRef;
  isOwn?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

const SharedEventCard: React.FC<SharedEventCardProps> = ({
  sharedEvent,
  isOwn = false,
  compact = false,
  onClick
}) => {
  const hasPreview = Boolean(sharedEvent.previewUrl);
  const eventDate = sharedEvent.eventDate ? new Date(sharedEvent.eventDate) : null;
  const formattedDate = eventDate
    ? format(eventDate, 'd MMMM yyyy', { locale: ru })
    : null;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        gap: 1,
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: isOwn ? 'rgba(255,255,255,0.25)' : 'divider',
        bgcolor: isOwn ? 'rgba(255,255,255,0.12)' : 'action.hover',
        cursor: onClick ? 'pointer' : 'default',
        maxWidth: compact ? '100%' : 280
      }}
    >
      <Box
        sx={{
          width: compact ? 56 : 72,
          minWidth: compact ? 56 : 72,
          height: compact ? 56 : 72,
          bgcolor: isOwn ? 'rgba(255,255,255,0.1)' : 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {hasPreview ? (
          <DecryptedMedia
            cacheKey={`shared-event-${sharedEvent.eventId}`}
            url={sharedEvent.previewUrl!}
            resourceType={sharedEvent.previewResourceType || 'image'}
            encrypted={sharedEvent.previewEncrypted}
            mediaEnvelope={sharedEvent.previewMediaEnvelope as ContentMediaEnvelope | undefined}
            imageStyle={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            videoStyle={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            loadingMinHeight={0}
          />
        ) : (
          <ImageIcon
            sx={{
              fontSize: compact ? 24 : 28,
              color: isOwn ? 'rgba(255,255,255,0.6)' : 'text.disabled'
            }}
          />
        )}
      </Box>
      <Box sx={{ py: 0.75, pr: 1, minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 600,
            color: isOwn ? 'rgba(255,255,255,0.85)' : 'primary.main',
            mb: 0.25
          }}
        >
          Событие
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: isOwn ? 'rgba(255,255,255,0.95)' : 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3
          }}
        >
          {sharedEvent.title}
        </Typography>
        {formattedDate && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <CalendarTodayIcon
              sx={{
                fontSize: 12,
                color: isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary'
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}
            >
              {formattedDate}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SharedEventCard;
