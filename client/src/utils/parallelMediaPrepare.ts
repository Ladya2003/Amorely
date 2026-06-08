import { prepareMediaForUpload } from './prepareMediaForUpload';
import { isVideoFile } from './videoMetadata';
import { throwIfAborted } from './saveAbort';

const DEFAULT_MAX_CONCURRENCY = 2;

export type PrepareMediaProgress = {
  index: number;
  total: number;
  fileName: string;
  isVideo: boolean;
};

export type ParallelPrepareOptions = {
  signal?: AbortSignal;
  maxConcurrency?: number;
  onPrepareStart?: (progress: PrepareMediaProgress) => void;
};

export const runWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal
): Promise<R[]> => {
  if (items.length === 0) return [];

  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const poolSize = Math.max(1, Math.min(limit, items.length));

  const runWorker = async () => {
    while (nextIndex < items.length) {
      throwIfAborted(signal);
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  };

  await Promise.all(Array.from({ length: poolSize }, () => runWorker()));
  return results;
};

/** Сжимает медиа параллельно (до maxConcurrency), сохраняя порядок файлов. */
export const prepareAllMediaForUpload = async (
  files: File[],
  options?: ParallelPrepareOptions
): Promise<File[]> => {
  const total = files.length;
  const videoCount = files.filter(isVideoFile).length;
  let nextVideoIndex = 0;

  return runWithConcurrency(
    files,
    options?.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY,
    async (file, index) => {
      const isVideo = isVideoFile(file);
      const videoIndex = isVideo ? ++nextVideoIndex : 0;

      options?.onPrepareStart?.({
        index: isVideo ? videoIndex : index + 1,
        total: isVideo ? videoCount : total,
        fileName: file.name,
        isVideo
      });

      return prepareMediaForUpload(file, { signal: options?.signal });
    },
    options?.signal
  );
};
