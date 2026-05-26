import React from 'react';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { Box, IconButton, DialogContent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ContentViewerProps {
  open: boolean;
  onClose: () => void;
  content: {
    mediaUrl: string;
    resourceType: 'image' | 'video';
  } | null;
  fullScreen?: boolean;
  stackAboveParentModal?: boolean;
}

const ContentViewer: React.FC<ContentViewerProps> = ({
  open,
  onClose,
  content,
  fullScreen = false,
  stackAboveParentModal = false
}) => {
  if (!content) return null;

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      disableMobileDrawer
      sx={
        stackAboveParentModal
          ? { zIndex: (theme) => theme.zIndex.modal + 2 }
          : undefined
      }
    >
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent
        sx={{
          p: 0,
          overflow: 'hidden',
          bgcolor: 'black',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: fullScreen ? '100%' : undefined
        }}
      >
        {content.resourceType === 'image' ? (
          <img
            src={content.mediaUrl}
            alt="Просмотр изображения"
            style={{
              maxWidth: '100%',
              maxHeight: fullScreen ? '100dvh' : '90vh',
              objectFit: 'contain'
            }}
          />
        ) : (
          <video
            src={content.mediaUrl}
            controls
            autoPlay
            style={{
              maxWidth: '100%',
              maxHeight: fullScreen ? '100dvh' : '90vh'
            }}
          />
        )}
      </DialogContent>
    </ResponsiveDialog>
  );
};

export default ContentViewer; 