import React, { useState } from 'react';
import { Box, IconButton, Typography, CircularProgress, Paper, Chip } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import CakeIcon from '@mui/icons-material/Cake';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useNavigate } from 'react-router-dom';
import DecryptedMedia from '../common/DecryptedMedia';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';

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
  placeholder?: string;
  onContentClick?: (content: ContentItem) => void;
  onEventClick?: (eventId: string) => void; // Новый пропс для перехода к событию
  navigateTo?: string;
  onEmptyClick?: () => void; // Новый пропс для обработки клика по пустому состоянию
}

const ContentSlider: React.FC<ContentSliderProps> = ({ 
  content, 
  currentIndex, 
  setCurrentIndex, 
  isLoading, 
  onContentClick, 
  onEventClick,
  placeholder, 
  navigateTo, 
  onEmptyClick 
}) => {
  const navigate = useNavigate();

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : content.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < content.length - 1 ? prevIndex + 1 : 0));
  };

  const handleEmptyClick = () => {
    if (navigateTo) {
      navigate(navigateTo);
    } else if (onEmptyClick) {
      onEmptyClick();
    }
  };

  const handleMediaClick = (content: ContentItem) => {
    if (content.eventId && onEventClick) {
      onEventClick(content.eventId);
    } else if (onContentClick) {
      onContentClick(content);
    }
  };

  const handleContentClick = () => {
    if (content.length > 0 && onContentClick) {
      onContentClick(content[currentIndex]);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 300,
        bgcolor: 'background.paper',
        borderRadius: 2
      }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (content.length === 0) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 300,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider',
          cursor: (navigateTo || onEmptyClick) ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          '&:hover': (navigateTo || onEmptyClick) ? {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          } : {}
        }}
        onClick={handleEmptyClick}
      >
        <Typography 
          color="text.secondary" 
          align="center"
          sx={{ 
            whiteSpace: 'pre-line',
            fontWeight: (navigateTo || onEmptyClick) ? 500 : 400
          }}
        >
          {placeholder || 'Нет доступного контента'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: 'relative', mb: 3 }}>
      <Box 
        sx={{ 
          height: 400, 
          borderRadius: 2, 
          overflow: 'hidden',
          position: 'relative',
          bgcolor: 'black'
        }}
      >
        {/* Контейнер слайдера с плавной анимацией */}
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            height: '100%',
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {content.map((item, index) => (
            <Box
              key={item.id}
              sx={{
                minWidth: '100%',
                height: '100%',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => handleMediaClick(item)}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  pointerEvents: item.resourceType === 'video' ? 'auto' : 'none'
                }}
                onClick={(e) => item.resourceType === 'video' && e.stopPropagation()}
              >
                <DecryptedMedia
                  cacheKey={`feed-${item.id}`}
                  url={item.url}
                  resourceType={item.resourceType}
                  encrypted={item.encrypted}
                  mediaEnvelope={item.mediaEnvelope}
                  imageStyle={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    maxHeight: '100%'
                  }}
                  videoStyle={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    maxHeight: '100%'
                  }}
                  loadingMinHeight={300}
                />
                {item.resourceType === 'video' && index !== currentIndex && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      pointerEvents: 'none'
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
                    top: 8,
                    right: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.8,
                    alignItems: 'flex-end',
                    zIndex: 2
                  }}
                >
                  {item.isBirthdayEvent && (
                    <Chip
                      icon={<CakeIcon />}
                      label="День рождения"
                      color="secondary"
                      size="small"
                    />
                  )}
                  {item.isAnniversaryEvent && (
                    <Chip
                      icon={<FavoriteIcon />}
                      label="Годовщина"
                      color="error"
                      size="small"
                    />
                  )}
                </Box>
              )}
              
              {(item.title || item.description) && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.88))',
                    px: 2,
                    pt: 1.5,
                    pb: 5.5,
                    color: 'white'
                  }}
                >
                  {item.title && (
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        maxWidth: '100%'
                      }}
                    >
                      {item.title}
                    </Typography>
                  )}
                  {item.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: item.title ? 0.5 : 0,
                        opacity: 0.92,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {item.description}
                    </Typography>
                  )}
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
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)'
              }
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
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)'
              }
            }}
            onClick={handleNext}
          >
            <ArrowForwardIosIcon />
          </IconButton>

          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
              bgcolor: 'rgba(0,0,0,0.5)',
              borderRadius: 2,
              px: 1,
              py: 0.5
            }}
          >
            {content.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
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