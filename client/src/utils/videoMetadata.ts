const VIDEO_EXTENSION_PATTERN = /\.(mp4|mov|webm|m4v)$/i;

export const isVideoFile = (file: File): boolean =>
  file.type.startsWith('video/') || VIDEO_EXTENSION_PATTERN.test(file.name);

export type VideoMetadata = {
  video: HTMLVideoElement;
  objectUrl: string;
  duration: number;
  width: number;
  height: number;
};

const METADATA_TIMEOUT_MS = 15_000;

export const loadVideoMetadata = (file: File): Promise<VideoMetadata> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');

    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const cleanup = () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(objectUrl);
    };

    const finish = (metadata: VideoMetadata) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(metadata);
    };

    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      cleanup();
      reject(new Error(message));
    };

    const tryResolve = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      finish({
        video,
        objectUrl,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      });
    };

    video.addEventListener('loadedmetadata', tryResolve);
    video.addEventListener('durationchange', tryResolve);
    video.addEventListener('loadeddata', tryResolve);
    video.onerror = () => fail('Не удалось прочитать видео');

    const timeoutId = window.setTimeout(() => {
      fail('Не удалось прочитать видео');
    }, METADATA_TIMEOUT_MS);

    video.src = objectUrl;
    video.load();
  });

export const cleanupVideoMetadata = (metadata: VideoMetadata) => {
  metadata.video.pause();
  metadata.video.removeAttribute('src');
  metadata.video.load();
  URL.revokeObjectURL(metadata.objectUrl);
};

export const getVideoDuration = async (file: File): Promise<number> => {
  const metadata = await loadVideoMetadata(file);

  try {
    return metadata.duration;
  } finally {
    cleanupVideoMetadata(metadata);
  }
};
