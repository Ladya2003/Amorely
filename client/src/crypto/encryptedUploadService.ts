import axios, { isAxiosError } from 'axios';
import { API_URL } from '../config';
import {
  prepareAllMediaForUpload,
  type ParallelPrepareOptions
} from '../utils/parallelMediaPrepare';
import { isSaveAborted, throwIfAborted } from '../utils/saveAbort';
import { isVideoFile } from '../utils/videoMetadata';
import { getDisplayTypeFromFile, getVideoMimeType } from '../utils/videoMime';
import { encryptFileForUpload } from './mediaCrypto';
import { encryptMediaEnvelopeForPartner } from './contentCryptoService';
import type { EncryptedTextPayload } from './contentCryptoService';
import type { LocalDeviceKeys } from './cryptoService';

export type EncryptedUploadOptions = {
  signal?: AbortSignal;
  onFileUploaded?: (publicId: string) => void;
  onPrepareStart?: ParallelPrepareOptions['onPrepareStart'];
};

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

export { getDisplayTypeFromFile } from '../utils/videoMime';

const getUploadErrorMessage = (error: unknown): string | null => {
  if (!isAxiosError(error)) return null;
  const data = error.response?.data as { error?: string } | undefined;
  return typeof data?.error === 'string' && data.error.length > 0 ? data.error : null;
};

export const encryptAndUploadFiles = async (
  files: File[],
  options?: EncryptedUploadOptions
): Promise<UploadedEncryptedFile[]> => {
  const token = localStorage.getItem('token');

  throwIfAborted(options?.signal);
  const preparedFiles = await prepareAllMediaForUpload(files, {
    signal: options?.signal,
    onPrepareStart: options?.onPrepareStart
  });

  const uploads: UploadedEncryptedFile[] = [];

  for (const preparedFile of preparedFiles) {
    throwIfAborted(options?.signal);
    const encrypted = await encryptFileForUpload(preparedFile);
    const uploadName = `encrypted-${Date.now()}-${Math.random().toString(36).slice(2)}.enc`;
    const formData = new FormData();
    formData.append('media', encrypted.encryptedBlob, uploadName);

    let response;
    try {
      response = await axios.post(`${API_URL}/api/chat/upload-encrypted`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        signal: options?.signal
      });
    } catch (error) {
      if (isSaveAborted(error)) {
        throw error;
      }
      throw new Error(getUploadErrorMessage(error) || 'Не удалось загрузить зашифрованный файл');
    }

    const item = response.data.uploads?.[0];
    if (!item?.url || !item?.publicId) {
      throw new Error('Не удалось загрузить зашифрованный файл');
    }

    options?.onFileUploaded?.(item.publicId);

    uploads.push({
      url: item.url,
      publicId: item.publicId,
      mediaEnvelope: {
        mediaKey: encrypted.mediaKey,
        iv: encrypted.iv,
        mimeType: isVideoFile(preparedFile)
          ? getVideoMimeType(preparedFile)
          : preparedFile.type || 'application/octet-stream',
        displayType: getDisplayTypeFromFile(preparedFile)
      },
      fileSize: preparedFile.size
    });
  }

  return uploads;
};

export const deleteUploadedEncryptedFiles = async (publicIds: string[]): Promise<void> => {
  const uniqueIds = Array.from(new Set(publicIds.filter(Boolean)));
  if (uniqueIds.length === 0) return;

  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    await axios.post(
      `${API_URL}/api/chat/delete-uploaded-encrypted`,
      { publicIds: uniqueIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Не удалось удалить загруженные файлы при отмене:', error);
  }
};

/** Загрузка медиа для ленты/календаря: ключ файла шифруется ECDH для партнёра. */
export const encryptAndUploadContentFiles = async (
  files: File[],
  localKeys: LocalDeviceKeys,
  partnerUserId: string,
  options?: EncryptedUploadOptions
): Promise<UploadedEncryptedContentFile[]> => {
  const uploads = await encryptAndUploadFiles(files, options);

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
