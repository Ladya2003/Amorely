import { compressImageForUpload } from './compressImage';
import { compressVideoForUpload } from './compressVideo';
import { throwIfAborted } from './saveAbort';
import { isVideoFile } from './videoMetadata';

export type PrepareMediaOptions = {
  signal?: AbortSignal;
};

export const prepareMediaForUpload = async (
  file: File,
  options?: PrepareMediaOptions
): Promise<File> => {
  throwIfAborted(options?.signal);

  if (isVideoFile(file)) {
    return compressVideoForUpload(file, options);
  }

  if (file.type.startsWith('image/')) {
    return compressImageForUpload(file);
  }

  return file;
};
