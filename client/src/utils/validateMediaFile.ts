import {
  MAX_VIDEO_DURATION_SEC,
  MAX_VIDEO_UPLOAD_BYTES,
  formatMegabytes
} from './mediaLimits';
import { getVideoDuration, isVideoFile } from './videoMetadata';

export const validateMediaFileSize = (file: File): string | undefined => {
  if (isVideoFile(file) && file.size > MAX_VIDEO_UPLOAD_BYTES) {
    return `Максимальный размер видео — ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ`;
  }

  return undefined;
};

export const validateAndFilterMediaFiles = async (
  files: File[]
): Promise<{ accepted: File[]; errors: string[] }> => {
  const accepted: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const sizeError = validateMediaFileSize(file);
    if (sizeError) {
      errors.push(`${file.name}: ${sizeError}`);
      continue;
    }

    if (isVideoFile(file)) {
      try {
        const duration = await getVideoDuration(file);
        if (duration > MAX_VIDEO_DURATION_SEC) {
          errors.push(`${file.name}: максимум ${MAX_VIDEO_DURATION_SEC} секунд`);
          continue;
        }
      } catch {
        // Браузер не смог прочитать метаданные (кодек, moov atom и т.д.) —
        // не блокируем: файл маленький, проверим снова при загрузке.
      }
    }

    accepted.push(file);
  }

  return { accepted, errors };
};
