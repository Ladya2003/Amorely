import React from 'react';
import { Dialog, DialogContent, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ContentItem } from './ContentSlider';

interface ContentViewerProps {
  open: boolean;
  onClose: () => void;
  content: ContentItem | null;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ open, onClose, content }) => {
  if (!content) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'black',
          maxHeight: '90vh'
        }
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'white',
          zIndex: 1
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {content.resourceType === 'image' ? (
          <img
            src={content.url}
            alt="Просмотр"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />
        ) : (
          <Box sx={{ width: '100%', height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <video
              src={content.url}
              controls
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: '80vh'
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContentViewer; 