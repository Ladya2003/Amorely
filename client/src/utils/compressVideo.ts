import {
  MAX_VIDEO_COMPRESSION_PASSES,
  MAX_VIDEO_DURATION_SEC,
  MAX_VIDEO_SOURCE_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  MAX_VIDEO_WIDTH,
  MIN_VIDEO_BITRATE,
  VIDEO_AUDIO_BITRATE,
  VIDEO_BITRATE,
  VIDEO_COMPRESSION_MARGIN,
  VIDEO_SKIP_BELOW_BYTES,
  formatMegabytes
} from './mediaLimits';
import {
  cleanupVideoMetadata,
  isVideoFile,
  loadVideoMetadata,
  type VideoMetadata
} from './videoMetadata';

type CompressionProfile = {
  maxDimension: number;
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;
};

const RECORDER_MIME_WITH_AUDIO = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4'
];

const RECORDER_MIME_VIDEO_ONLY = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4'
];

const pickRecorderMimeType = (needsAudio: boolean): string | undefined => {
  const candidates = needsAudio ? RECORDER_MIME_WITH_AUDIO : RECORDER_MIME_VIDEO_ONLY;
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
};

type AudioAttachment = {
  hasAudio: boolean;
  detach: () => void;
};

type ReencodeAudioCapture = {
  canCaptureAudio: boolean;
  attachAudioTo: (targetStream: MediaStream) => AudioAttachment;
  cleanup: () => void;
};

/** Захват аудиодорожки для перекодирования (Safari/iPhone MOV не отдаёт звук через captureStream). */
const createReencodeAudioCapture = async (video: HTMLVideoElement): Promise<ReencodeAudioCapture> => {
  const noopCapture: ReencodeAudioCapture = {
    canCaptureAudio: false,
    attachAudioTo: () => ({ hasAudio: false, detach: () => {} }),
    cleanup: () => {}
  };

  video.muted = false;
  video.volume = 1;

  const videoWithCapture = video as HTMLVideoElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  };

  let captureStream: MediaStream | null = null;
  try {
    captureStream = videoWithCapture.captureStream?.() ?? videoWithCapture.mozCaptureStream?.() ?? null;
    const captureAudioTrack = captureStream?.getAudioTracks()[0];
    if (captureAudioTrack) {
      return {
        canCaptureAudio: true,
        attachAudioTo: (targetStream) => {
          const track = captureAudioTrack.clone();
          targetStream.addTrack(track);
          return {
            hasAudio: true,
            detach: () => {
              targetStream.removeTrack(track);
              track.stop();
            }
          };
        },
        cleanup: () => captureStream?.getTracks().forEach((track) => track.stop())
      };
    }
    captureStream?.getTracks().forEach((track) => track.stop());
    captureStream = null;
  } catch {
    captureStream?.getTracks().forEach((track) => track.stop());
  }

  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return noopCapture;
  }

  try {
    const audioContext = new AudioContextCtor();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const elementSource = audioContext.createMediaElementSource(video);

    return {
      canCaptureAudio: true,
      attachAudioTo: (targetStream) => {
        const destination = audioContext.createMediaStreamDestination();
        elementSource.connect(destination);
        const track = destination.stream.getAudioTracks()[0];
        if (!track) {
          elementSource.disconnect(destination);
          return { hasAudio: false, detach: () => elementSource.disconnect(destination) };
        }

        targetStream.addTrack(track);
        return {
          hasAudio: true,
          detach: () => {
            targetStream.removeTrack(track);
            track.stop();
            elementSource.disconnect(destination);
          }
        };
      },
      cleanup: () => {
        elementSource.disconnect();
        void audioContext.close();
      }
    };
  } catch {
    return noopCapture;
  }
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

const estimateVideoBitrate = (durationSec: number): number => {
  const safeDuration = Math.max(durationSec, 1);
  const targetBytes = MAX_VIDEO_UPLOAD_BYTES * VIDEO_COMPRESSION_MARGIN;
  const audioBytes = (VIDEO_AUDIO_BITRATE / 8) * safeDuration;
  const videoBytes = Math.max(0, targetBytes - audioBytes);
  const estimated = Math.floor((videoBytes * 8) / safeDuration);

  return Math.max(MIN_VIDEO_BITRATE, Math.min(VIDEO_BITRATE, estimated));
};

const buildCompressionProfiles = (durationSec: number): CompressionProfile[] => {
  const firstBitrate = estimateVideoBitrate(durationSec);

  const rawTiers: CompressionProfile[] = [
    { maxDimension: MAX_VIDEO_WIDTH, videoBitsPerSecond: firstBitrate, audioBitsPerSecond: VIDEO_AUDIO_BITRATE },
    { maxDimension: MAX_VIDEO_WIDTH, videoBitsPerSecond: 700_000, audioBitsPerSecond: VIDEO_AUDIO_BITRATE },
    { maxDimension: 960, videoBitsPerSecond: 520_000, audioBitsPerSecond: 80_000 },
    { maxDimension: 720, videoBitsPerSecond: 380_000, audioBitsPerSecond: 64_000 },
    { maxDimension: 480, videoBitsPerSecond: MIN_VIDEO_BITRATE, audioBitsPerSecond: 48_000 }
  ];

  const seen = new Set<string>();
  const unique: CompressionProfile[] = [];

  for (const tier of rawTiers) {
    const key = `${tier.maxDimension}:${tier.videoBitsPerSecond}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(tier);
  }

  return unique.slice(0, MAX_VIDEO_COMPRESSION_PASSES);
};

const resetVideoForReencode = async (video: HTMLVideoElement) => {
  video.pause();
  video.currentTime = 0;

  await new Promise<void>((resolve) => {
    if (video.readyState >= 1) {
      resolve();
      return;
    }

    const onReady = () => {
      video.removeEventListener('loadeddata', onReady);
      resolve();
    };

    video.addEventListener('loadeddata', onReady);
    video.load();
  });

  await wait(80);
};

const reencodeVideo = async (
  file: File,
  metadata: VideoMetadata,
  mimeType: string,
  profile: CompressionProfile,
  audioCapture: ReencodeAudioCapture
): Promise<File> => {
  const { video, duration, width, height } = metadata;
  const { width: targetWidth, height: targetHeight } = scaleVideoDimensions(
    width,
    height,
    profile.maxDimension
  );

  await resetVideoForReencode(video);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas недоступен');
  }

  const canvasStream = canvas.captureStream(24);
  const { hasAudio, detach: detachAudio } = audioCapture.attachAudioTo(canvasStream);

  const recorderOptions: MediaRecorderOptions = {
    mimeType,
    videoBitsPerSecond: profile.videoBitsPerSecond
  };

  if (hasAudio) {
    recorderOptions.audioBitsPerSecond = profile.audioBitsPerSecond;
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

  detachAudio();
  canvasStream.getTracks().forEach((track) => track.stop());

  const blob = await recordingFinished;
  const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'video';

  return new File([blob], `${baseName}.${extension}`, {
    type: mimeType,
    lastModified: Date.now()
  });
};

const pickBestCompressed = (original: File, candidates: File[]): File | null => {
  const underLimit = candidates.filter((item) => item.size <= MAX_VIDEO_UPLOAD_BYTES);
  if (underLimit.length === 0) return null;

  return underLimit.reduce((best, current) => (current.size < best.size ? current : best));
};

const shouldSkipVideoCompression = (file: File, metadata: VideoMetadata): boolean => {
  if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
    return false;
  }

  if (file.size > VIDEO_SKIP_BELOW_BYTES) {
    return false;
  }

  return metadata.width <= MAX_VIDEO_WIDTH && metadata.height <= MAX_VIDEO_WIDTH;
};

const compressWithRetries = async (
  file: File,
  metadata: VideoMetadata,
  mimeType: string
): Promise<File> => {
  const profiles = buildCompressionProfiles(metadata.duration);
  const attempts: File[] = [];
  const audioCapture = await createReencodeAudioCapture(metadata.video);

  if (!audioCapture.canCaptureAudio && file.size <= MAX_VIDEO_UPLOAD_BYTES) {
    audioCapture.cleanup();
    return file;
  }

  if (!audioCapture.canCaptureAudio) {
    audioCapture.cleanup();
    throw new Error(
      `Не удалось сохранить звук при сжатии видео. Выберите файл до ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ.`
    );
  }

  try {
    for (const profile of profiles) {
      const compressed = await reencodeVideo(file, metadata, mimeType, profile, audioCapture);
      attempts.push(compressed);

      if (compressed.size <= MAX_VIDEO_UPLOAD_BYTES) {
        const best = pickBestCompressed(file, attempts);
        if (!best) break;

        if (best.size < file.size || file.size > MAX_VIDEO_UPLOAD_BYTES) {
          return best;
        }

        return file;
      }
    }
  } finally {
    audioCapture.cleanup();
  }

  const best = pickBestCompressed(file, attempts);
  if (best) {
    return best.size < file.size || file.size > MAX_VIDEO_UPLOAD_BYTES ? best : file;
  }

  throw new Error(
    `Не удалось сжать видео до ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ. ` +
      'Попробуйте более короткий ролик.'
  );
};

/** Сжимает видео перед E2EE-загрузкой и проверяет лимиты размера/длительности. */
export const compressVideoForUpload = async (file: File): Promise<File> => {
  if (!isVideoFile(file)) return file;

  if (file.size > MAX_VIDEO_SOURCE_BYTES) {
    throw new Error(
      `Видео слишком большое. Максимум ${formatMegabytes(MAX_VIDEO_SOURCE_BYTES)} МБ`
    );
  }

  let metadata: VideoMetadata;
  try {
    metadata = await loadVideoMetadata(file);
  } catch {
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      throw new Error(
        `Не удалось сжать видео. Выберите файл до ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ ` +
          'или другой формат (MP4).'
      );
    }
    return file;
  }

  try {
    if (metadata.duration > MAX_VIDEO_DURATION_SEC) {
      throw new Error(`Видео слишком длинное. Максимум ${MAX_VIDEO_DURATION_SEC} секунд`);
    }

    if (shouldSkipVideoCompression(file, metadata)) {
      return file;
    }

    const mimeType = pickRecorderMimeType(true);
    if (!mimeType || typeof MediaRecorder === 'undefined') {
      if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
        throw new Error(
          `Браузер не умеет сжимать видео. Выберите файл до ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ.`
        );
      }
      return file;
    }

    return await compressWithRetries(file, metadata, mimeType);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('МБ') || error.message.includes('секунд'))) {
      throw error;
    }

    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      throw new Error(
        `Не удалось сжать видео. Попробуйте более короткий ролик или файл до ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ.`
      );
    }

    return file;
  } finally {
    cleanupVideoMetadata(metadata);
  }
};
