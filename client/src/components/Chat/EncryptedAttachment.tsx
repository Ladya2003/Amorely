import React from 'react';
import DecryptedMedia from '../common/DecryptedMedia';
import type { ChatMediaEnvelope } from '../../crypto/cryptoService';

interface EncryptedAttachmentProps {
  cacheKey: string;
  url: string;
  envelope?: ChatMediaEnvelope;
  onImageClick?: (blobUrl: string) => void;
  imageStyle?: React.CSSProperties;
}

const EncryptedAttachment: React.FC<EncryptedAttachmentProps> = ({
  cacheKey,
  url,
  envelope,
  onImageClick,
  imageStyle
}) => (
  <DecryptedMedia
    cacheKey={cacheKey}
    url={url}
    resourceType={envelope?.displayType || 'image'}
    encrypted
    mediaEnvelope={envelope}
    onImageClick={onImageClick}
    imageStyle={imageStyle}
  />
);

export default EncryptedAttachment;
