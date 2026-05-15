import React from 'react';
import DecryptedMedia from '../common/DecryptedMedia';
import type { ChatMediaEnvelope } from '../../crypto/cryptoService';

interface EncryptedAttachmentProps {
  cacheKey: string;
  url: string;
  envelope: ChatMediaEnvelope;
  onImageClick?: (blobUrl: string) => void;
}

const EncryptedAttachment: React.FC<EncryptedAttachmentProps> = ({
  cacheKey,
  url,
  envelope,
  onImageClick
}) => (
  <DecryptedMedia
    cacheKey={cacheKey}
    url={url}
    resourceType={envelope.displayType}
    encrypted
    mediaEnvelope={envelope}
    onImageClick={onImageClick}
  />
);

export default EncryptedAttachment;
