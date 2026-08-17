import React, { useEffect, useState } from 'react';
import { Box, IconButton, Skeleton, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DecryptedMedia from '../../common/DecryptedMedia';
import type { ContentMediaEnvelope } from '../../../crypto/contentCryptoService';
import { useHorizontalSwipe } from '../../../hooks/useHorizontalSwipe';
import { getCompletedEventPreviewSx } from './datingIdeasStyles';
import { ArrowBackIosNewIcon, ArrowForwardIosIcon, NorthEastIcon } from '../../UI/icons';

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
  const canOpenEvent = Boolean(event?.eventId);

  const handleOpenEvent = () => {
    if (!event?.eventId) return;
    navigate(`/calendar?event=${encodeURIComponent(event.eventId)}`);
  };

  const handlePrev = () => {
    setMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1));
  };

  const handleNext = () => {
    setMediaIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0));
  };

  const { swipeHandlers, swipeContainerSx } = useHorizontalSwipe({
    enabled: showSlider,
    onPrev: handlePrev,
    onNext: handleNext,
  });

  return (
    <Box
      sx={{
        ...getCompletedEventPreviewSx(theme),
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 5',
          maxHeight: 360,
          bgcolor: 'grey.900',
          overflow: 'hidden',
          ...swipeContainerSx,
        }}
        {...swipeHandlers}
      >
        {loading ? (
          <Skeleton
            variant="rectangular"
            animation="wave"
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              bgcolor: 'action.hover',
              transform: 'none',
            }}
          />
        ) : hasMedia ? (
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              height: '100%',
              transform: `translateX(-${mediaIndex * 100}%)`,
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {mediaItems.map((item, index) => (
              <Box
                key={item.mediaId || `${item.mediaUrl}-${index}`}
                sx={{
                  position: 'relative',
                  minWidth: '100%',
                  height: '100%',
                  flexShrink: 0,
                }}
              >
                <Box sx={{ position: 'absolute', inset: 0, '& > *': { width: '100%', height: '100%' } }}>
                  <DecryptedMedia
                    cacheKey={`dating-idea-event-${event?.eventId || 'x'}-${item.mediaId || index}`}
                    url={item.mediaUrl}
                    resourceType={item.resourceType || 'image'}
                    encrypted={item.encrypted}
                    mediaEnvelope={item.mediaEnvelope}
                    recoveryContext="calendar"
                    decryptFailedVariant="compact"
                    videoPreview={item.resourceType === 'video'}
                    imageStyle={MEDIA_FILL_STYLE}
                    videoStyle={MEDIA_FILL_STYLE}
                    loadingMinHeight={0}
                  />
                </Box>
              </Box>
            ))}
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

        {canOpenEvent && !loading && (
          <IconButton
            aria-label={t('datingIdeas.openEventAria')}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              handleOpenEvent();
            }}
            sx={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 3,
              width: 52,
              height: 52,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.28)',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            <NorthEastIcon sx={{ fontSize: 26 }} />
          </IconButton>
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
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                maskImage: 'linear-gradient(to top, black 35%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to top, black 35%, transparent 100%)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 45%, transparent 100%)',
              },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                px: 2.5,
                pt: 6,
                pb: showSlider ? 7.5 : 2.5,
              }}
            >
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

        {showSlider && !loading && (
          <>
            <IconButton
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                handlePrev();
              }}
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
              <ArrowBackIosNewIcon />
            </IconButton>
            <IconButton
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                handleNext();
              }}
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
              <ArrowForwardIosIcon />
            </IconButton>

            <Box
              sx={{
                position: 'absolute',
                bottom: 18,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2,
                display: 'flex',
                gap: 1.25,
                bgcolor: 'rgba(0,0,0,0.5)',
                borderRadius: 2.5,
                px: 1.25,
                py: 0.75,
              }}
            >
              {mediaItems.map((item, index) => (
                <Box
                  key={item.mediaId || `dot-${index}`}
                  sx={{
                    width: 11,
                    height: 11,
                    borderRadius: '50%',
                    bgcolor: index === mediaIndex ? 'white' : 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={(clickEvent) => {
                    clickEvent.stopPropagation();
                    setMediaIndex(index);
                  }}
                />
              ))}
            </Box>
          </>
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
