/** Кадр превью без seek — иначе blob/mp4 с moov в конце даёт ERR_REQUEST_RANGE_NOT_SATISFIABLE. */
export const captureVideoPosterFromUrl = (blobUrl: string): Promise<string | null> =>
  new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = blobUrl;

    const cleanup = () => {
      video.onloadeddata = null;
      video.onerror = null;
      video.removeAttribute('src');
      video.load();
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    video.onloadeddata = () => {
      try {
        if (!video.videoWidth || !video.videoHeight) {
          cleanup();
          resolve(null);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }

        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      } catch {
        resolve(null);
      } finally {
        cleanup();
      }
    };
  });

export const captureVideoPosterFromFile = async (file: File): Promise<string | null> => {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await captureVideoPosterFromUrl(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
