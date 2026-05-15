import axios from 'axios';
import { API_URL } from '../config';
import { encryptFileForUpload } from './mediaCrypto';

export type UploadedEncryptedFile = {
  url: string;
  publicId: string;
  mediaEnvelope: {
    mediaKey: string;
    iv: string;
    mimeType: string;
    displayType: 'image' | 'video';
  };
  fileSize: number;
};

export const getDisplayTypeFromFile = (file: File): 'image' | 'video' =>
  file.type.startsWith('video/') ? 'video' : 'image';

export const encryptAndUploadFiles = async (files: File[]): Promise<UploadedEncryptedFile[]> => {
  const token = localStorage.getItem('token');
  const uploads: UploadedEncryptedFile[] = [];

  for (const file of files) {
    const encrypted = await encryptFileForUpload(file);
    const uploadName = `encrypted-${Date.now()}-${Math.random().toString(36).slice(2)}.enc`;
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
      throw new Error('Не удалось загрузить зашифрованный файл');
    }

    uploads.push({
      url: item.url,
      publicId: item.publicId,
      mediaEnvelope: {
        mediaKey: encrypted.mediaKey,
        iv: encrypted.iv,
        mimeType: file.type || 'application/octet-stream',
        displayType: getDisplayTypeFromFile(file)
      },
      fileSize: file.size
    });
  }

  return uploads;
};
