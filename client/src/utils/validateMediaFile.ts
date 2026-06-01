import { MAX_VIDEO_SOURCE_BYTES, formatMegabytes } from './mediaLimits';
import { isVideoFile } from './videoMetadata';

export const validateMediaFileSize = (file: File): string | undefined => {
  if (isVideoFile(file) && file.size > MAX_VIDEO_SOURCE_BYTES) {
    return `Максимальный размер видео — ${formatMegabytes(MAX_VIDEO_SOURCE_BYTES)} МБ`;
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

    // Длительность видео проверяем при отправке (prepareMediaForUpload), не при выборе файла —
    // иначе iPhone MOV может «зависать» на metadata и повторный выбор того же файла не срабатывает.
    accepted.push(file);
  }

  return { accepted, errors };
};
