export const assertFilesReadable = async (files: File[]): Promise<void> => {
  for (const file of files) {
    try {
      const sampleSize = Math.min(file.size, 4096);
      if (sampleSize === 0) continue;
      await file.slice(0, sampleSize).arrayBuffer();
    } catch {
      throw new Error('UNREADABLE_MEDIA');
    }
  }
};
