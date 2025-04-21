import React from 'react';
import { Box, IconButton, Dialog, DialogContent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ContentViewerProps {
  open: boolean;
  onClose: () => void;
  content: {
    mediaUrl: string;
    type: 'image' | 'video';
  } | null;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ open, onClose, content }) => {
  if (!content) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 0, overflow: 'hidden', bgcolor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {content.type === 'image' ? (
          <img
            src={content.mediaUrl}
            alt="Просмотр изображения"
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
          />
        ) : (
          <video
            src={content.mediaUrl}
            controls
            autoPlay
            style={{ maxWidth: '100%', maxHeight: '90vh' }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContentViewer; 