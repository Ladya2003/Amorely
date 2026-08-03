import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, IconButton, Typography, useTheme } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DecryptedMedia from '../../common/DecryptedMedia';
import type { ContentMediaEnvelope } from '../../../crypto/contentCryptoService';
import { getCompletedEventPreviewSx } from './datingIdeasStyles';

export interface CompletedEventMediaItem {
  mediaUrl: string;
  resourceType?: 'image' | 'video';
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
  mediaId?: string;
}

export interface CompletedEventPreviewData {
  title?: string;
  description?: string;
  mediaUrl?: string;
  resourceType?: 'image' | 'video';
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
  mediaId?: string;
  eventId?: string;
  media?: CompletedEventMediaItem[];
}

interface CompletedEventPreviewProps {
  loading?: boolean;
  error?: string | null;
  event: CompletedEventPreviewData | null;
  fallbackEmoji: string;
}

const MEDIA_FILL_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  maxWidth: 'none',
  maxHeight: 'none',
  objectFit: 'cover',
  objectPosition: 'center',
  display: 'block',
};

const CompletedEventPreview: React.FC<CompletedEventPreviewProps> = ({
  loading,
  error,
  event,
  fallbackEmoji,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [mediaIndex, setMediaIndex] = useState(0);

  const mediaItems: CompletedEventMediaItem[] = React.useMemo(() => {
    if (event?.media && event.media.length > 0) {
      return event.media.filter((item) => item.mediaUrl?.trim() && item.mediaUrl !== 'placeholder');
    }
    if (event?.mediaUrl && event.mediaUrl.trim() && event.mediaUrl !== 'placeholder') {
      return [
        {
          mediaUrl: event.mediaUrl,
          resourceType: event.resourceType,
          encrypted: event.encrypted,
          mediaEnvelope: event.mediaEnvelope,
          mediaId: event.mediaId,
        },
      ];
    }
    return [];
  }, [event]);

  useEffect(() => {
    setMediaIndex(0);
  }, [event?.eventId, mediaItems.length]);

  const hasMedia = mediaItems.length > 0;
  const showSlider = mediaItems.length > 1;
  const currentMedia = mediaItems[Math.min(mediaIndex, Math.max(mediaItems.length - 1, 0))];
  const canOpenEvent = Boolean(event?.eventId);

  const handleOpenEvent = () => {
    if (!event?.eventId) return;
    navigate(`/calendar?event=${encodeURIComponent(event.eventId)}`);
  };

  const handlePrev = (clickEvent: React.MouseEvent) => {
    clickEvent.stopPropagation();
    setMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1));
  };

  const handleNext = (clickEvent: React.MouseEvent) => {
    clickEvent.stopPropagation();
    setMediaIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0));
  };

  return (
    <Box
      sx={{
        ...getCompletedEventPreviewSx(theme),
        cursor: canOpenEvent ? 'pointer' : 'default',
        transition: 'transform 200ms ease',
        ...(canOpenEvent && {
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        }),
      }}
      role={canOpenEvent ? 'button' : undefined}
      tabIndex={canOpenEvent ? 0 : undefined}
      onClick={canOpenEvent ? handleOpenEvent : undefined}
      onKeyDown={
        canOpenEvent
          ? (keyEvent) => {
              if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                keyEvent.preventDefault();
                handleOpenEvent();
              }
            }
          : undefined
      }
      aria-label={canOpenEvent ? t('datingIdeas.openEventAria') : undefined}
    >
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
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : hasMedia && currentMedia ? (
          <Box sx={{ position: 'absolute', inset: 0, '& > *': { width: '100%', height: '100%' } }}>
            <DecryptedMedia
              cacheKey={`dating-idea-event-${event?.eventId || 'x'}-${currentMedia.mediaId || mediaIndex}`}
              url={currentMedia.mediaUrl}
              resourceType={currentMedia.resourceType || 'image'}
              encrypted={currentMedia.encrypted}
              mediaEnvelope={currentMedia.mediaEnvelope}
              videoPreview={currentMedia.resourceType === 'video'}
              imageStyle={MEDIA_FILL_STYLE}
              videoStyle={MEDIA_FILL_STYLE}
              loadingMinHeight={0}
            />
          </Box>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background: (tTheme) =>
                `radial-gradient(circle at 50% 40%, ${tTheme.palette.primary.light}33 0%, transparent 60%)`,
            }}
          >
            <Typography sx={{ fontSize: '4.5rem', lineHeight: 1 }}>{fallbackEmoji}</Typography>
          </Box>
        )}

        {showSlider && (
          <>
            <IconButton
              size="small"
              onClick={handlePrev}
              aria-label={t('datingIdeas.mediaPrevAria')}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleNext}
              aria-label={t('datingIdeas.mediaNextAria')}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
              }}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </>
        )}

        {!loading && event && (event.title || event.description) && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1,
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
