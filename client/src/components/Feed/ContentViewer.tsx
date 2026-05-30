import React from 'react';
import MediaViewerDialog from '../common/MediaViewerDialog';
import { ContentItem } from './ContentSlider';

interface ContentViewerProps {
  open: boolean;
  onClose: () => void;
  content: ContentItem | null;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ open, onClose, content }) => (
  <MediaViewerDialog
    open={open}
    onClose={onClose}
    content={
      content
        ? {
            url: content.url,
            resourceType: content.resourceType,
            cacheKey: `feed-viewer-${content.id}`,
            encrypted: content.encrypted,
            mediaEnvelope: content.mediaEnvelope
          }
        : null
    }
  />
);

export default ContentViewer;
