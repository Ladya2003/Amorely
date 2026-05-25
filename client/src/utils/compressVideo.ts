import {
  MAX_VIDEO_DURATION_SEC,
  MAX_VIDEO_UPLOAD_BYTES,
  MAX_VIDEO_WIDTH,
  VIDEO_BITRATE,
  VIDEO_SKIP_BELOW_BYTES,
  formatMegabytes
} from './mediaLimits';
import {
  cleanupVideoMetadata,
  isVideoFile,
  loadVideoMetadata,
  type VideoMetadata
} from './videoMetadata';

const pickRecorderMimeType = (): string | undefined => {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4'
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
};

const scaleVideoDimensions = (width: number, height: number, maxDimension: number) => {
  if (width <= maxDimension && height <= maxDimension) {
    return {
      width: width - (width % 2) || width,
      height: height - (height % 2) || height
    };
  }

  const ratio = maxDimension / Math.max(width, height);
  return {
    width: Math.round((width * ratio) / 2) * 2,
    height: Math.round((height * ratio) / 2) * 2
  };
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const reencodeVideo = async (
  file: File,
  metadata: VideoMetadata,
  mimeType: string
): Promise<File> => {
  const { video, duration, width, height } = metadata;
  const { width: targetWidth, height: targetHeight } = scaleVideoDimensions(width, height, MAX_VIDEO_WIDTH);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas недоступен');
  }

  const canvasStream = canvas.captureStream(24);
  const videoWithCapture = video as HTMLVideoElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  };
  const sourceStream = videoWithCapture.captureStream?.() || videoWithCapture.mozCaptureStream?.();
  sourceStream?.getAudioTracks().forEach((track) => canvasStream.addTrack(track));

  const recorderOptions: MediaRecorderOptions = {
    mimeType,
    videoBitsPerSecond: VIDEO_BITRATE
  };

  if (sourceStream?.getAudioTracks().length) {
    recorderOptions.audioBitsPerSecond = 128_000;
  }

  const recorder = new MediaRecorder(canvasStream, recorderOptions);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const recordingFinished = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = () => reject(new Error('Ошибка сжатия видео'));
  });

  recorder.start(500);
  video.currentTime = 0;
  await video.play();

  await new Promise<void>((resolve) => {
    const renderFrame = () => {
      if (video.ended || video.currentTime >= duration - 0.05) {
        resolve();
        return;
      }

      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      requestAnimationFrame(renderFrame);
    };

    renderFrame();
  });

  video.pause();
  await wait(300);

  if (recorder.state !== 'inactive') {
    recorder.stop();
  }

  canvasStream.getTracks().forEach((track) => track.stop());
  sourceStream?.getTracks().forEach((track) => track.stop());

  const blob = await recordingFinished;
  const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'video';

  return new File([blob], `${baseName}.${extension}`, {
    type: mimeType,
    lastModified: Date.now()
  });
};

const shouldSkipVideoCompression = (file: File, metadata: VideoMetadata): boolean => {
  if (file.size > VIDEO_SKIP_BELOW_BYTES) {
    return false;
  }

  return (
    metadata.width <= MAX_VIDEO_WIDTH &&
    metadata.height <= MAX_VIDEO_WIDTH
  );
};

/** Сжимает видео перед E2EE-загрузкой и проверяет лимиты размера/длительности. */
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

    if (shouldSkipVideoCompression(file, metadata)) {
      return file;
    }

    const mimeType = pickRecorderMimeType();
    if (!mimeType || typeof MediaRecorder === 'undefined') {
      return file;
    }

    const compressed = await reencodeVideo(file, metadata, mimeType);

    if (compressed.size >= file.size) {
      return file;
    }

    if (compressed.size > MAX_VIDEO_UPLOAD_BYTES) {
      throw new Error(
        `После сжатия видео всё ещё больше ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ. ` +
          'Попробуйте более короткий ролик.'
      );
    }

    return compressed;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('МБ') || error.message.includes('секунд'))) {
      throw error;
    }

    return file;
  } finally {
    cleanupVideoMetadata(metadata);
  }
};
