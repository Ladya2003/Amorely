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
  /** Показывать видео как статичный первый кадр без элементов управления. */
  videoPreview?: boolean;
  onImageClick?: (blobUrl: string) => void;
  imageStyle?: React.CSSProperties;
  videoStyle?: React.CSSProperties;
  loadingMinHeight?: number;
}

const captureVideoPoster = (blobUrl: string): Promise<string | null> =>
  new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = blobUrl;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.removeAttribute('src');
      video.load();
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.1, video.duration > 0 ? video.duration / 10 : 0.1);
    };

    video.onseeked = () => {
      try {
        if (!video.videoWidth || !video.videoHeight) {
          cleanup();
          resolve(null);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }

        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      } catch {
        resolve(null);
      } finally {
        cleanup();
      }
    };
  });

const DecryptedMedia: React.FC<DecryptedMediaProps> = ({
  cacheKey,
  url,
  resourceType,
  encrypted,
  mediaEnvelope,
  videoPreview = false,
  onImageClick,
  imageStyle,
  videoStyle,
  loadingMinHeight = 80
}) => {
  const needsDecrypt = Boolean(mediaEnvelope?.mediaKey && mediaEnvelope?.iv);

  const [blobUrl, setBlobUrl] = useState<string | null>(() => {
    if (!needsDecrypt) return url;
    return getCachedBlobUrl(cacheKey) || null;
  });
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(needsDecrypt && !blobUrl);
  const [videoPosterUrl, setVideoPosterUrl] = useState<string | null>(null);
  const [posterLoading, setPosterLoading] = useState(false);

  useEffect(() => {
    if (!needsDecrypt) {
      setBlobUrl(url);
      setLoading(false);
      setError(false);
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
      if (!mediaEnvelope?.mediaKey || !mediaEnvelope?.iv) {
        return;
      }

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
  }, [cacheKey, needsDecrypt, mediaEnvelope, url]);

  useEffect(() => {
    if (!videoPreview || resourceType !== 'video' || !blobUrl) {
      setVideoPosterUrl(null);
      setPosterLoading(false);
      return;
    }

    let cancelled = false;
    setPosterLoading(true);
    setVideoPosterUrl(null);

    void captureVideoPoster(blobUrl).then((poster) => {
      if (cancelled) return;
      setVideoPosterUrl(poster);
      setPosterLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [blobUrl, resourceType, videoPreview]);

  if (loading || (videoPreview && resourceType === 'video' && posterLoading)) {
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

  if (resourceType === 'video' && videoPreview) {
    if (videoPosterUrl) {
      return (
        <img
          src={videoPosterUrl}
          alt=""
          draggable={false}
          style={{
            maxWidth: '100%',
            maxHeight: '200px',
            display: 'block',
            pointerEvents: 'none',
            userSelect: 'none',
            ...imageStyle
          }}
        />
      );
    }

    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: loadingMinHeight,
          bgcolor: 'grey.300',
          pointerEvents: 'none'
        }}
      />
    );
  }

  if (resourceType === 'video') {
    return (
      <video
        src={blobUrl}
        controls
        playsInline
        preload="auto"
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
