import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';
import { fetchDecryptedBlobUrl, getCachedBlobUrl } from '../../crypto/decryptedMediaCache';
import { captureVideoPosterFromUrl } from '../../utils/videoPoster';
import type { CryptoRecoveryContext } from '../../services/cryptoRecoveryService';
import ChatVideoPlayer from './ChatVideoPlayer';
import DecryptFailedState from './DecryptFailedState';
import BrandLoader from './BrandLoader';

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
  /** compact — миниатюры; full — крупные превью с кнопкой заявки */
  decryptFailedVariant?: 'compact' | 'full' | 'auto';
  recoveryContext?: CryptoRecoveryContext;
  onDecryptFailedChange?: (failed: boolean) => void;
}

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
  loadingMinHeight = 80,
  decryptFailedVariant = 'auto',
  recoveryContext = 'other',
  onDecryptFailedChange,
}) => {
  const needsDecrypt = Boolean(mediaEnvelope?.mediaKey && mediaEnvelope?.iv);
  const awaitingDecryption = Boolean(encrypted && !needsDecrypt);

  const [blobUrl, setBlobUrl] = useState<string | null>(() => {
    if (needsDecrypt) return getCachedBlobUrl(cacheKey) || null;
    if (awaitingDecryption) return null;
    return url;
  });
  const [error, setError] = useState(awaitingDecryption);
  const [loading, setLoading] = useState(needsDecrypt && !blobUrl);
  const [videoPosterUrl, setVideoPosterUrl] = useState<string | null>(null);
  const [posterLoading, setPosterLoading] = useState(false);

  useEffect(() => {
    if (awaitingDecryption) {
      setBlobUrl(null);
      setLoading(false);
      setError(true);
      return;
    }

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
  }, [awaitingDecryption, cacheKey, needsDecrypt, mediaEnvelope, url]);

  useEffect(() => {
    if (!videoPreview || resourceType !== 'video' || !blobUrl) {
      setVideoPosterUrl(null);
      setPosterLoading(false);
      return;
    }

    let cancelled = false;
    setPosterLoading(true);
    setVideoPosterUrl(null);

    void captureVideoPosterFromUrl(blobUrl).then((poster) => {
      if (cancelled) return;
      setVideoPosterUrl(poster);
      setPosterLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [blobUrl, resourceType, videoPreview]);

  const decryptFailed = !loading && (error || !blobUrl);
  const onDecryptFailedChangeRef = useRef(onDecryptFailedChange);
  onDecryptFailedChangeRef.current = onDecryptFailedChange;

  useEffect(() => {
    onDecryptFailedChangeRef.current?.(decryptFailed);
    return () => {
      onDecryptFailedChangeRef.current?.(false);
    };
  }, [decryptFailed]);

  if (loading || (videoPreview && resourceType === 'video' && posterLoading)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, minHeight: loadingMinHeight }}>
        <BrandLoader size={40} />
      </Box>
    );
  }

  if (error || !blobUrl) {
    const resolvedVariant =
      decryptFailedVariant === 'auto'
        ? loadingMinHeight > 0 && loadingMinHeight < 100
          ? 'compact'
          : 'full'
        : decryptFailedVariant;

    return (
      <DecryptFailedState
        variant={resolvedVariant}
        context={recoveryContext}
        minHeight={loadingMinHeight || undefined}
      />
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
    return <ChatVideoPlayer src={blobUrl} style={videoStyle} />;
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
