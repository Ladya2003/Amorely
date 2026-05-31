import React, { useEffect, useState } from 'react';
import { Box, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import DecryptedMedia from './DecryptedMedia';
import ChatVideoPlayer from './ChatVideoPlayer';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';

export interface MediaViewerContent {
  url: string;
  resourceType: 'image' | 'video';
  cacheKey?: string;
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
}

interface MediaViewerDialogProps {
  open: boolean;
  onClose: () => void;
  content: MediaViewerContent | null;
  gallery?: MediaViewerContent[];
  initialIndex?: number;
  stackAboveParentModal?: boolean;
}

const fullscreenMediaStyle: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
  touchAction: 'auto'
};

const navButtonSx = {
  position: 'absolute' as const,
  top: '50%',
  transform: 'translateY(-50%)',
  bgcolor: 'rgba(0, 0, 0, 0.5)',
  color: 'white',
  zIndex: 1,
  '&:hover': {
    bgcolor: 'rgba(0, 0, 0, 0.7)'
  }
};

const MediaViewerDialog: React.FC<MediaViewerDialogProps> = ({
  open,
  onClose,
  content,
  gallery,
  initialIndex = 0,
  stackAboveParentModal = false
}) => {
  const items = gallery && gallery.length > 0 ? gallery : content ? [content] : [];
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const current = items[index] ?? null;

  if (!current) {
    return null;
  }

  const hasNav = items.length > 1;

  const handlePrev = () => {
    setIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = () => {
    setIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  const renderMedia = (item: MediaViewerContent) => {
    if (item.cacheKey) {
      return (
        <DecryptedMedia
          cacheKey={item.cacheKey}
          url={item.url}
          resourceType={item.resourceType}
          encrypted={item.encrypted}
          mediaEnvelope={item.mediaEnvelope}
          imageStyle={fullscreenMediaStyle}
          videoStyle={fullscreenMediaStyle}
          loadingMinHeight={200}
        />
      );
    }

    if (item.resourceType === 'video') {
      return <ChatVideoPlayer src={item.url} autoPlay style={fullscreenMediaStyle} />;
    }

    return <img src={item.url} alt="" style={fullscreenMediaStyle} draggable={false} />;
  };

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      fullScreen
      disableMobileDrawer
      sx={stackAboveParentModal ? { zIndex: (theme) => theme.zIndex.modal + 2 } : undefined}
      PaperProps={{
        sx: {
          bgcolor: '#000',
          boxShadow: 'none'
        }
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          position: 'relative',
          bgcolor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          overflow: 'auto',
          touchAction: 'auto'
        }}
      >
        <IconButton
          onClick={onClose}
          aria-label="Закрыть просмотр"
          sx={{
            position: 'fixed',
            top: 'max(8px, env(safe-area-inset-top, 0px))',
            right: 'max(8px, env(safe-area-inset-right, 0px))',
            zIndex: 10,
            width: 64,
            height: 64,
            color: '#fff',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            '& .MuiSvgIcon-root': {
              fontSize: 36
            },
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.7)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>

        {hasNav && (
          <>
            <IconButton sx={{ ...navButtonSx, left: 8 }} onClick={handlePrev} aria-label="Предыдущее">
              <ArrowBackIosNewIcon />
            </IconButton>
            <IconButton sx={{ ...navButtonSx, right: 8 }} onClick={handleNext} aria-label="Следующее">
              <ArrowForwardIosIcon />
            </IconButton>
          </>
        )}

        <Box
          sx={{
            position: 'relative',
            display: 'inline-flex',
            maxWidth: '100%',
            maxHeight: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'auto'
          }}
        >
          {renderMedia(current)}
        </Box>

        {hasNav && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: 3,
              px: 2,
              py: 1,
              zIndex: 1
            }}
          >
            {items.map((_, dotIndex) => (
              <Box
                key={dotIndex}
                component="button"
                type="button"
                aria-label={`Фото ${dotIndex + 1}`}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  border: 'none',
                  p: 0,
                  bgcolor: dotIndex === index ? 'white' : 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onClick={() => setIndex(dotIndex)}
              />
            ))}
          </Box>
        )}
      </DialogContent>
    </ResponsiveDialog>
  );
};

export default MediaViewerDialog;
