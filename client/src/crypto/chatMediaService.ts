import type { ChatMediaEnvelope } from './cryptoService';
import { encryptAndUploadFiles } from './encryptedUploadService';

export type StoredChatAttachment = {
  type: 'encrypted';
  url: string;
  publicId: string;
  encrypted: true;
};

export const encryptAndUploadChatFiles = async (
  files: File[]
): Promise<{ stored: StoredChatAttachment[]; envelopes: ChatMediaEnvelope[] }> => {
  const uploaded = await encryptAndUploadFiles(files);

  return {
    stored: uploaded.map((item) => ({
      type: 'encrypted' as const,
      url: item.url,
      publicId: item.publicId,
      encrypted: true as const
    })),
    envelopes: uploaded.map((item) => ({
      mediaKey: item.mediaEnvelope.mediaKey,
      iv: item.mediaEnvelope.iv,
      mimeType: item.mediaEnvelope.mimeType,
      displayType: item.mediaEnvelope.displayType
    }))
  };
};
