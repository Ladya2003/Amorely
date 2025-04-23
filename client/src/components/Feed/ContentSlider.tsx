import React, { useState } from 'react';
import { Box, IconButton, Typography, CircularProgress, Paper } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import { useNavigate } from 'react-router-dom';

export interface ContentItem {
  id: string;
  url: string;
  resourceType: 'image' | 'video';
  createdAt: string;
}

interface ContentSliderProps {
  content: ContentItem[];
  isLoading: boolean;
  placeholder?: string;
  onContentClick?: (content: ContentItem) => void;
  navigateTo?: string;
}

const ContentSlider: React.FC<ContentSliderProps> = ({ content, isLoading, onContentClick, placeholder, navigateTo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : content.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < content.length - 1 ? prevIndex + 1 : 0));
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
          borderColor: 'divider'
        }}
        onClick={navigateTo ? () => navigate(navigateTo) : undefined}
      >
        <Typography color="text.secondary" align="center">
          {placeholder || 'Нет доступного контента'}
        </Typography>
      </Paper>
    );
  }

  const currentContent = content[currentIndex];

  return (
    <Box sx={{ position: 'relative', mb: 3 }}>
      <Box 
        sx={{ 
          height: 400, 
          borderRadius: 2, 
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          bgcolor: 'black'
        }}
        onClick={handleContentClick}
      >
        {currentContent.resourceType === 'image' ? (
          <Box
            component="img"
            src={currentContent.url}
            alt="Контент"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <Box
              component="video"
              src={currentContent.url}
              controls
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
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
              <PlayCircleFilledIcon 
                sx={{ 
                  fontSize: 60, 
                  color: 'white', 
                  opacity: 0.8,
                  pointerEvents: 'none'
                }} 
              />
            </Box>
          </Box>
        )}
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
              gap: 1
            }}
          >
            {content.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: index === currentIndex ? 'primary.main' : 'rgba(255, 255, 255, 0.7)'
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