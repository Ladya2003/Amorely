import React from 'react';
import MediaViewerDialog from '../common/MediaViewerDialog';

interface ContentViewerProps {
  open: boolean;
  onClose: () => void;
  content: {
    mediaUrl: string;
    resourceType: 'image' | 'video';
  } | null;
  /** @deprecated Всегда полноэкранный режим */
  fullScreen?: boolean;
  stackAboveParentModal?: boolean;
}

const ContentViewer: React.FC<ContentViewerProps> = ({
  open,
  onClose,
  content,
  stackAboveParentModal = false
}) => (
  <MediaViewerDialog
    open={open}
    onClose={onClose}
    content={
      content
        ? {
            url: content.mediaUrl,
            resourceType: content.resourceType
          }
        : null
    }
    stackAboveParentModal={stackAboveParentModal}
  />
);

export default ContentViewer;
