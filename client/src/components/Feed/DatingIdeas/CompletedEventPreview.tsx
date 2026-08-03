import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import DecryptedMedia from '../../common/DecryptedMedia';
import type { ContentMediaEnvelope } from '../../../crypto/contentCryptoService';
import { getCompletedEventPreviewSx } from './datingIdeasStyles';

export interface CompletedEventPreviewData {
  title?: string;
  description?: string;
  mediaUrl?: string;
  resourceType?: 'image' | 'video';
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
  mediaId?: string;
  eventId?: string;
}

interface CompletedEventPreviewProps {
  loading?: boolean;
  error?: string | null;
  event: CompletedEventPreviewData | null;
  fallbackEmoji: string;
}

const CompletedEventPreview: React.FC<CompletedEventPreviewProps> = ({
  loading,
  error,
  event,
  fallbackEmoji,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const hasMedia = Boolean(event?.mediaUrl && event.mediaUrl.trim() && event.mediaUrl !== 'placeholder');

  return (
    <Box sx={getCompletedEventPreviewSx(theme)}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 5',
          maxHeight: 360,
          bgcolor: 'action.hover',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : hasMedia && event ? (
          <DecryptedMedia
            cacheKey={`dating-idea-event-${event.eventId || 'x'}-${event.mediaId || '0'}`}
            url={event.mediaUrl!}
            resourceType={event.resourceType || 'image'}
            encrypted={event.encrypted}
            mediaEnvelope={event.mediaEnvelope}
            videoPreview={event.resourceType === 'video'}
            imageStyle={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            videoStyle={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loadingMinHeight={0}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              background: (tTheme) =>
                `radial-gradient(circle at 50% 40%, ${tTheme.palette.primary.light}33 0%, transparent 60%)`,
            }}
          >
            <Typography sx={{ fontSize: '4.5rem', lineHeight: 1 }}>{fallbackEmoji}</Typography>
          </Box>
        )}

        {!loading && event && (event.title || event.description) && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              color: 'white',
              pointerEvents: 'none',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                maskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, px: 2, pt: 4, pb: 2 }}>
              {event.title && (
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {event.title}
                </Typography>
              )}
              {event.description && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    opacity: 0.92,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {event.description}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {error && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </Box>
      )}

      {!loading && !error && !event && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {t('datingIdeas.eventPreviewMissing')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CompletedEventPreview;
