import { decryptMediaBlob } from './mediaCrypto';
import type { ContentMediaEnvelope } from './contentCryptoService';

const blobUrlCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

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
    const decrypted = await decryptMediaBlob(encryptedBlob, envelope.mediaKey, envelope.iv);
    const blobUrl = URL.createObjectURL(
      new Blob([decrypted], { type: envelope.mimeType || 'application/octet-stream' })
    );
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
