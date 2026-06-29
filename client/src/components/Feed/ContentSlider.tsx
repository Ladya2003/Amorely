import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, IconButton, Typography, CircularProgress, Chip } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import CakeIcon from '@mui/icons-material/Cake';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import DecryptedMedia from '../common/DecryptedMedia';
import { useHorizontalSwipe } from '../../hooks/useHorizontalSwipe';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';
import { AppCalendarFilledIcon } from '../UI/AppIcons';
import { getFeedContentEmptyIconSx, getFeedContentEmptySx } from './feedBannerStyles';

export const CAROUSEL_BORDER_RADIUS = 32;

const MEDIA_COVER_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center',
  display: 'block',
  maxHeight: 'none',
  maxWidth: 'none',
};

export interface ContentItem {
  id: string;
  url: string;
  resourceType: 'image' | 'video';
  createdAt: string;
  title?: string;
  description?: string;
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
  eventId?: string;
  isBirthdayEvent?: boolean;
  isAnniversaryEvent?: boolean;
}

interface ContentSliderProps {
  content: ContentItem[];
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
  onContentClick?: (content: ContentItem) => void;
  onEventClick?: (eventId: string) => void;
  navigateTo?: string;
  onEmptyClick?: () => void;
}

const ContentSlider: React.FC<ContentSliderProps> = ({
  content,
  currentIndex,
  setCurrentIndex,
  isLoading,
  onContentClick,
  onEventClick,
  navigateTo,
  onEmptyClick,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : content.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < content.length - 1 ? prevIndex + 1 : 0));
  };

  const { swipeHandlers, swipeContainerSx, consumeSwipeClick } = useHorizontalSwipe({
    enabled: content.length > 1,
    onPrev: handlePrev,
    onNext: handleNext,
  });

  const handleEmptyClick = () => {
    if (navigateTo) {
      navigate(navigateTo);
    } else if (onEmptyClick) {
      onEmptyClick();
    }
  };

  const handleOpenItem = (item: ContentItem) => {
    if (item.eventId && onEventClick) {
      onEventClick(item.eventId);
    } else if (onContentClick) {
      onContentClick(item);
    }
  };

  const handleMediaClick = (content: ContentItem) => {
    handleOpenItem(content);
  };

  const handleSlideItemClick = (item: ContentItem) => {
    if (consumeSwipeClick()) {
      return;
    }

    handleMediaClick(item);
  };

  const carouselShellSx = {
    borderRadius: `${CAROUSEL_BORDER_RADIUS}px`,
    overflow: 'hidden',
    position: 'relative' as const,
    bgcolor: 'grey.900',
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
          ...carouselShellSx,
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (content.length === 0) {
    const isInteractive = Boolean(navigateTo || onEmptyClick);

    return (
      <Box
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={isInteractive ? handleEmptyClick : undefined}
        onKeyDown={
          isInteractive
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleEmptyClick();
                }
              }
            : undefined
        }
        sx={getFeedContentEmptySx(theme, isInteractive)}
      >
        <Box sx={getFeedContentEmptyIconSx(theme)}>
          <AppCalendarFilledIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography
          component="p"
          sx={{
            fontSize: '1.35rem',
            fontWeight: 600,
            lineHeight: 1.25,
            mb: 1,
          }}
        >
          {t('feed.emptyState.title')}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 300, lineHeight: 1.55, mb: isInteractive ? 2 : 0 }}
        >
          {t('feed.emptyState.description')}
        </Typography>
        {isInteractive && (
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {t('feed.emptyState.cta')}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', mb: 3 }}>
      <Box
        sx={{
          height: 400,
          ...carouselShellSx,
          ...swipeContainerSx,
        }}
        {...swipeHandlers}
      >
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            height: '100%',
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {content.map((item, index) => (
            <Box
              key={item.id}
              sx={{
                minWidth: '100%',
                height: '100%',
                cursor: 'pointer',
                position: 'relative',
              }}
              onClick={() => handleSlideItemClick(item)}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: item.resourceType === 'video' ? 'auto' : 'none',
                }}
                onClick={(e) => item.resourceType === 'video' && e.stopPropagation()}
              >
                <DecryptedMedia
                  cacheKey={`feed-${item.id}`}
                  url={item.url}
                  resourceType={item.resourceType}
                  encrypted={item.encrypted}
                  mediaEnvelope={item.mediaEnvelope}
                  imageStyle={MEDIA_COVER_STYLE}
                  videoStyle={MEDIA_COVER_STYLE}
                  loadingMinHeight={400}
                />
                {item.resourceType === 'video' && index !== currentIndex && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <PlayCircleFilledIcon sx={{ fontSize: 60, color: 'white', opacity: 0.8 }} />
                  </Box>
                )}
              </Box>

              {(item.isBirthdayEvent || item.isAnniversaryEvent) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.8,
                    alignItems: 'flex-start',
                    zIndex: 2,
                  }}
                >
                  {item.isBirthdayEvent && (
                    <Chip icon={<CakeIcon />} label={t('feed.birthday')} color="secondary" size="small" />
                  )}
                  {item.isAnniversaryEvent && (
                    <Chip icon={<FavoriteIcon />} label={t('feed.anniversary')} color="error" size="small" />
                  )}
                </Box>
              )}

              {item.eventId && onEventClick && (
                <IconButton
                  aria-label={t('feed.openEventAriaLabel')}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenItem(item);
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

              {(item.title || item.description) && (
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
                        'linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.45) 45%, transparent 100%)',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1, px: 2.5, pt: 6, pb: 7.5 }}>
                    {item.title && (
                      <Typography
                        variant="h3"
                        component="p"
                        sx={{
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          maxWidth: '100%',
                        }}
                      >
                        {item.title}
                      </Typography>
                    )}
                    {item.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: item.title ? 0.75 : 0,
                          opacity: 0.92,
                          fontSize: '0.95rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {item.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {content.length > 1 && (
        <>
          <IconButton
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
            onClick={handlePrev}
          >
            <ArrowBackIosNewIcon />
          </IconButton>

          <IconButton
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
            onClick={handleNext}
          >
            <ArrowForwardIosIcon />
          </IconButton>

          <Box
            sx={{
              position: 'absolute',
              bottom: 18,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1.25,
              bgcolor: 'rgba(0,0,0,0.5)',
              borderRadius: 2.5,
              px: 1.25,
              py: 0.75,
            }}
          >
            {content.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  bgcolor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default ContentSlider;
