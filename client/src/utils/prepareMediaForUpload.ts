import { compressImageForUpload } from './compressImage';
import { compressVideoForUpload } from './compressVideo';
import { isVideoFile } from './videoMetadata';

export const prepareMediaForUpload = async (file: File): Promise<File> => {
  if (isVideoFile(file)) {
    return compressVideoForUpload(file);
  }

  if (file.type.startsWith('image/')) {
    return compressImageForUpload(file);
  }

  return file;
};
