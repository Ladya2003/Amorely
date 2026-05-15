import React from 'react';
import { Dialog, DialogContent, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ContentItem } from './ContentSlider';
import DecryptedMedia from '../common/DecryptedMedia';

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
        <Box sx={{ width: '100%', maxHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <DecryptedMedia
            cacheKey={`feed-viewer-${content.id}`}
            url={content.url}
            resourceType={content.resourceType}
            encrypted={content.encrypted}
            mediaEnvelope={content.mediaEnvelope}
            imageStyle={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
            videoStyle={{
              maxWidth: '100%',
              maxHeight: '80vh'
            }}
            loadingMinHeight={240}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ContentViewer;
