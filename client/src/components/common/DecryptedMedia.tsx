import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';
import { fetchDecryptedBlobUrl, getCachedBlobUrl } from '../../crypto/decryptedMediaCache';

interface DecryptedMediaProps {
  cacheKey: string;
  url: string;
  resourceType: 'image' | 'video';
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
  onImageClick?: (blobUrl: string) => void;
  imageStyle?: React.CSSProperties;
  videoStyle?: React.CSSProperties;
  loadingMinHeight?: number;
}

const DecryptedMedia: React.FC<DecryptedMediaProps> = ({
  cacheKey,
  url,
  resourceType,
  encrypted,
  mediaEnvelope,
  onImageClick,
  imageStyle,
  videoStyle,
  loadingMinHeight = 80
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(() => {
    if (!encrypted) return url;
    return getCachedBlobUrl(cacheKey) || null;
  });
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(Boolean(encrypted) && !blobUrl);

  useEffect(() => {
    if (!encrypted || !mediaEnvelope) {
      setBlobUrl(url);
      setLoading(false);
      return;
    }

    const cached = getCachedBlobUrl(cacheKey);
    if (cached) {
      setBlobUrl(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(false);
        const resolved = await fetchDecryptedBlobUrl(cacheKey, url, mediaEnvelope);
        if (!cancelled) {
          setBlobUrl(resolved);
        }
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
  }, [cacheKey, encrypted, mediaEnvelope, url]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, minHeight: loadingMinHeight }}>
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

  if (resourceType === 'video') {
    return (
      <video
        src={blobUrl}
        controls
        style={{
          maxWidth: '100%',
          maxHeight: '200px',
          display: 'block',
          ...videoStyle
        }}
      />
    );
  }

  return (
    <img
      src={blobUrl}
      alt=""
      onClick={() => onImageClick?.(blobUrl)}
      style={{
        maxWidth: '100%',
        maxHeight: '200px',
        display: 'block',
        cursor: onImageClick ? 'pointer' : 'default',
        ...imageStyle
      }}
    />
  );
};

export default DecryptedMedia;
