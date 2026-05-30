import {
  MAX_VIDEO_DURATION_SEC,
  MAX_VIDEO_UPLOAD_BYTES,
  formatMegabytes
} from './mediaLimits';
import {
  cleanupVideoMetadata,
  isVideoFile,
  loadVideoMetadata,
  type VideoMetadata
} from './videoMetadata';

/** Проверяет лимиты и возвращает исходный файл (без MediaRecorder — ломает воспроизведение в Chrome). */
export const compressVideoForUpload = async (file: File): Promise<File> => {
  if (!isVideoFile(file)) return file;

  if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
    throw new Error(
      `Видео слишком большое. Максимум ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ`
    );
  }

  let metadata: VideoMetadata;
  try {
    metadata = await loadVideoMetadata(file);
  } catch {
    // Браузер не умеет декодировать файл — загружаем как есть (1.5 МБ и т.п.).
    return file;
  }

  try {
    if (metadata.duration > MAX_VIDEO_DURATION_SEC) {
      throw new Error(`Видео слишком длинное. Максимум ${MAX_VIDEO_DURATION_SEC} секунд`);
    }

    return file;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('МБ') || error.message.includes('секунд'))) {
      throw error;
    }

    return file;
  } finally {
    cleanupVideoMetadata(metadata);
  }
};
