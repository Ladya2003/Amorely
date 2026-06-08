import { prepareMediaForUpload } from './prepareMediaForUpload';
import { isVideoFile } from './videoMetadata';
import { throwIfAborted } from './saveAbort';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isSafariBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg/i.test(ua);
};

export type PrepareMediaProgress = {
  index: number;
  total: number;
  fileName: string;
  isVideo: boolean;
};

export type ParallelPrepareOptions = {
  signal?: AbortSignal;
  onPrepareStart?: (progress: PrepareMediaProgress) => void;
};

/** Сжимает и подготавливает медиа строго по одному файлу за раз. */
export const prepareAllMediaForUpload = async (
  files: File[],
  options?: ParallelPrepareOptions
): Promise<File[]> => {
  const results: File[] = [];
  const total = files.length;
  const videoCount = files.filter(isVideoFile).length;
  let videoIndex = 0;

  for (let index = 0; index < files.length; index += 1) {
    throwIfAborted(options?.signal);

    const file = files[index];
    const isVideo = isVideoFile(file);
    if (isVideo) {
      videoIndex += 1;
    }

    options?.onPrepareStart?.({
      index: isVideo ? videoIndex : index + 1,
      total: isVideo ? videoCount : total,
      fileName: file.name,
      isVideo
    });

    results.push(
      await prepareMediaForUpload(file, { signal: options?.signal })
    );

    if (isVideo && isSafariBrowser() && videoIndex < videoCount) {
      await wait(400);
    }
  }

  return results;
};
