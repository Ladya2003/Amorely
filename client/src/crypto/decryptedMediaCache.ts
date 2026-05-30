import { decryptMediaBlob } from './mediaCrypto';
import type { ContentMediaEnvelope } from './contentCryptoService';
import { normalizeVideoMimeType } from '../utils/videoMime';

const blobUrlCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const normalizeMediaMimeType = (mimeType?: string, displayType?: string): string => {
  if (displayType === 'video') {
    return normalizeVideoMimeType(mimeType);
  }

  const baseType = mimeType?.split(';')[0]?.trim().toLowerCase();
  if (baseType === 'image/jpeg' || baseType === 'image/png' || baseType === 'image/webp') {
    return baseType;
  }
  return mimeType || 'application/octet-stream';
};

export const getCachedBlobUrl = (cacheKey: string): string | undefined =>
  blobUrlCache.get(cacheKey);

export const fetchDecryptedBlobUrl = async (
  cacheKey: string,
  url: string,
  envelope: ContentMediaEnvelope
): Promise<string> => {
  const cached = blobUrlCache.get(cacheKey);
  if (cached) return cached;

  const pending = inflight.get(cacheKey);
  if (pending) return pending;

  const promise = (async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('fetch failed');
    }
    const encryptedBlob = await response.blob();
    const decrypted = await decryptMediaBlob(
      encryptedBlob,
      envelope.mediaKey,
      envelope.iv,
      normalizeMediaMimeType(envelope.mimeType, envelope.displayType)
    );
    const blobUrl = URL.createObjectURL(decrypted);
    blobUrlCache.set(cacheKey, blobUrl);
    return blobUrl;
  })();

  inflight.set(cacheKey, promise);

  try {
    return await promise;
  } finally {
    inflight.delete(cacheKey);
  }
};
