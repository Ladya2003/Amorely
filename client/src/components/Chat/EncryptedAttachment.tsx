import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { decryptMediaBlob } from '../../crypto/mediaCrypto';
import type { ChatMediaEnvelope } from '../../crypto/cryptoService';

interface EncryptedAttachmentProps {
  cacheKey: string;
  url: string;
  envelope: ChatMediaEnvelope;
  onImageClick?: (blobUrl: string) => void;
}

const blobUrlCache = new Map<string, string>();

const EncryptedAttachment: React.FC<EncryptedAttachmentProps> = ({
  cacheKey,
  url,
  envelope,
  onImageClick
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(() => blobUrlCache.get(cacheKey) || null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(!blobUrl);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    const cached = blobUrlCache.get(cacheKey);
    if (cached) {
      setBlobUrl(cached);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('fetch failed');
        }
        const encryptedBlob = await response.blob();
        const decrypted = await decryptMediaBlob(encryptedBlob, envelope.mediaKey, envelope.iv);
        createdUrl = URL.createObjectURL(
          new Blob([decrypted], { type: envelope.mimeType })
        );
        if (cancelled) {
          URL.revokeObjectURL(createdUrl);
          return;
        }
        blobUrlCache.set(cacheKey, createdUrl);
        setBlobUrl(createdUrl);
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, envelope.iv, envelope.mediaKey, envelope.mimeType, url]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, minHeight: 80 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error || !blobUrl) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        Не удалось расшифровать медиа
      </Typography>
    );
  }

  if (envelope.displayType === 'video') {
    return (
      <video
        src={blobUrl}
        controls
        style={{
          maxWidth: '100%',
          maxHeight: '200px',
          display: 'block'
        }}
      />
    );
  }

  return (
    <img
      src={blobUrl}
      alt="Вложение"
      onClick={() => onImageClick?.(blobUrl)}
      style={{
        maxWidth: '100%',
        maxHeight: '200px',
        display: 'block',
        cursor: onImageClick ? 'pointer' : 'default'
      }}
    />
  );
};

export default EncryptedAttachment;
