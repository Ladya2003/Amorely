const encoder = new TextEncoder();

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array => {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

export interface EncryptedMediaPayload {
  encryptedBlob: Blob;
  mediaKey: string;
  iv: string;
  algorithm: 'AES-GCM';
  version: number;
}

export const encryptFileForUpload = async (file: File): Promise<EncryptedMediaPayload> => {
  const mediaKeyRaw = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const mediaKey = await crypto.subtle.importKey('raw', mediaKeyRaw, { name: 'AES-GCM' }, false, ['encrypt']);
  const fileBuffer = await file.arrayBuffer();
  const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, mediaKey, fileBuffer);

  return {
    encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
    mediaKey: bytesToBase64(mediaKeyRaw),
    iv: bytesToBase64(iv),
    algorithm: 'AES-GCM',
    version: 1
  };
};

export const decryptMediaBlob = async (
  encryptedBlob: Blob,
  mediaKeyBase64: string,
  ivBase64: string
): Promise<Blob> => {
  const mediaKey = await crypto.subtle.importKey(
    'raw',
    base64ToBytes(mediaKeyBase64),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const encryptedBuffer = await encryptedBlob.arrayBuffer();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(ivBase64) },
    mediaKey,
    encryptedBuffer
  );
  return new Blob([decrypted]);
};

export const serializeMediaKeyEnvelope = (mediaKey: string, iv: string): string =>
  JSON.stringify({ mediaKey, iv, algorithm: 'AES-GCM', version: 1 });

export const parseMediaKeyEnvelope = (value: string): { mediaKey: string; iv: string } => {
  const parsed = JSON.parse(value) as { mediaKey: string; iv: string };
  if (!parsed.mediaKey || !parsed.iv) {
    throw new Error('Некорректный ключевой envelope для медиа');
  }
  return parsed;
};

export const textToBlob = (value: string): Blob => new Blob([encoder.encode(value)], { type: 'text/plain' });
