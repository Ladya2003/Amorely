import axios from 'axios';
import { API_URL } from '../config';
import { prepareMediaForUpload } from '../utils/prepareMediaForUpload';
import { encryptFileForUpload } from './mediaCrypto';
import { encryptMediaEnvelopeForPartner } from './contentCryptoService';
import type { EncryptedTextPayload } from './contentCryptoService';
import type { LocalDeviceKeys } from './cryptoService';

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

export type UploadedEncryptedContentFile = {
  url: string;
  publicId: string;
  fileSize: number;
  mediaEnvelope: {
    mimeType: string;
    displayType: 'image' | 'video';
  };
  encryptedMediaEnvelope: EncryptedTextPayload;
};

export const getDisplayTypeFromFile = (file: File): 'image' | 'video' =>
  file.type.startsWith('video/') ? 'video' : 'image';

export const encryptAndUploadFiles = async (files: File[]): Promise<UploadedEncryptedFile[]> => {
  const token = localStorage.getItem('token');
  const uploads: UploadedEncryptedFile[] = [];

  for (const file of files) {
    const preparedFile = await prepareMediaForUpload(file);
    const encrypted = await encryptFileForUpload(preparedFile);
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
        mimeType: preparedFile.type || 'application/octet-stream',
        displayType: getDisplayTypeFromFile(preparedFile)
      },
      fileSize: preparedFile.size
    });
  }

  return uploads;
};

/** Загрузка медиа для ленты/календаря: ключ файла шифруется ECDH для партнёра. */
export const encryptAndUploadContentFiles = async (
  files: File[],
  localKeys: LocalDeviceKeys,
  partnerUserId: string
): Promise<UploadedEncryptedContentFile[]> => {
  const uploads = await encryptAndUploadFiles(files);

  return Promise.all(
    uploads.map(async (item) => {
      const encryptedMediaEnvelope = await encryptMediaEnvelopeForPartner(localKeys, partnerUserId, {
        mediaKey: item.mediaEnvelope.mediaKey,
        iv: item.mediaEnvelope.iv
      });

      return {
        url: item.url,
        publicId: item.publicId,
        fileSize: item.fileSize,
        mediaEnvelope: {
          mimeType: item.mediaEnvelope.mimeType,
          displayType: item.mediaEnvelope.displayType
        },
        encryptedMediaEnvelope
      };
    })
  );
};
