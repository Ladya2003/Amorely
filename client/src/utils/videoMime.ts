import { isVideoFile } from './videoMetadata';

export const getVideoMimeType = (file: File): string => {
  const rawType = file.type?.split(';')[0]?.trim().toLowerCase();
  if (rawType && rawType.startsWith('video/')) {
    return rawType;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'mov') return 'video/quicktime';
  if (extension === 'mp4' || extension === 'm4v') return 'video/mp4';
  if (extension === 'webm') return 'video/webm';

  return 'video/mp4';
};

export const getDisplayTypeFromFile = (file: File): 'image' | 'video' =>
  isVideoFile(file) ? 'video' : 'image';

export const normalizeVideoMimeType = (mimeType?: string, fileName?: string): string => {
  const rawType = mimeType?.split(';')[0]?.trim().toLowerCase();
  if (rawType && rawType.startsWith('video/')) {
    return rawType;
  }

  if (fileName) {
    return getVideoMimeType(new File([], fileName));
  }

  return 'video/mp4';
};
