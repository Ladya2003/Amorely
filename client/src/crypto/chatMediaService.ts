import axios from 'axios';
import { API_URL } from '../config';
import { encryptFileForUpload } from './mediaCrypto';
import type { ChatMediaEnvelope } from './cryptoService';

export type StoredChatAttachment = {
  type: 'encrypted';
  url: string;
  publicId: string;
  encrypted: true;
};

export const getDisplayTypeFromFile = (file: File): 'image' | 'video' =>
  file.type.startsWith('video/') ? 'video' : 'image';

export const encryptAndUploadChatFiles = async (
  files: File[]
): Promise<{ stored: StoredChatAttachment[]; envelopes: ChatMediaEnvelope[] }> => {
  const token = localStorage.getItem('token');
  const stored: StoredChatAttachment[] = [];
  const envelopes: ChatMediaEnvelope[] = [];

  for (const file of files) {
    const encrypted = await encryptFileForUpload(file);
    const uploadName = `encrypted-${Date.now()}.bin`;
    const formData = new FormData();
    formData.append('media', encrypted.encryptedBlob, uploadName);

    const response = await axios.post(`${API_URL}/api/chat/upload-encrypted`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });

    const item = response.data.uploads?.[0];
    if (!item?.url || !item?.publicId) {
      throw new Error('Не удалось загрузить зашифрованное вложение');
    }

    stored.push({
      type: 'encrypted',
      url: item.url,
      publicId: item.publicId,
      encrypted: true
    });

    envelopes.push({
      mediaKey: encrypted.mediaKey,
      iv: encrypted.iv,
      mimeType: file.type || 'application/octet-stream',
      displayType: getDisplayTypeFromFile(file)
    });
  }

  return { stored, envelopes };
};
