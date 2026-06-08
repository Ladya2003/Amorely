import {
  MAX_VIDEO_COMPRESSION_PASSES,
  MAX_VIDEO_DURATION_SEC,
  MAX_VIDEO_SOURCE_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  MAX_VIDEO_WIDTH,
  MIN_VIDEO_BITRATE,
  VIDEO_AUDIO_BITRATE,
  VIDEO_BITRATE,
  VIDEO_SKIP_BELOW_BYTES,
  formatMegabytes
} from './mediaLimits';
import { SaveAbortedError, throwIfAborted } from './saveAbort';
import {
  cleanupVideoMetadata,
  getVideoDuration,
  isVideoFile,
  loadVideoMetadata,
  type VideoMetadata
} from './videoMetadata';

type CompressionProfile = {
  maxDimension: number;
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;
};

export type CompressionPassLog = {
  pass: number;
  mode: 'audio' | 'video_only' | 'video_only_fallback';
  maxDimension: number;
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;
  outputSizeBytes: number;
  outputSizeMb: string;
  underLimit: boolean;
  playable: boolean;
  playableReason?: string;
  durationSec?: number;
};

const MIN_VALID_OUTPUT_BYTES = 4096;

export type VideoCompressionFailureDetails = {
  fileName: string;
  sourceSizeBytes: number;
  sourceSizeMb: string;
  sourceMimeType: string;
  durationSec: number;
  width: number;
  height: number;
  recorderMimeType: string;
  uploadLimitBytes: number;
  uploadLimitMb: string;
  passesPlanned: number;
  passes: CompressionPassLog[];
  acceptedAttempts: number;
  smallestOutputBytes: number | null;
  reason: 'all_over_limit' | 'no_valid_output' | 'no_audio_capture';
};

export class VideoCompressionError extends Error {
  readonly details: VideoCompressionFailureDetails;

  constructor(message: string, details: VideoCompressionFailureDetails) {
    super(message);
    this.name = 'VideoCompressionError';
    this.details = details;
    logVideoCompressionFailure(details, message);
  }
}

export const isVideoCompressionError = (error: unknown): error is VideoCompressionError =>
  error instanceof VideoCompressionError;

const logVideoCompressionFailure = (
  details: VideoCompressionFailureDetails,
  message: string
): void => {
  console.groupCollapsed(`[compressVideo] ${message}`);
  console.error('Сообщение:', message);
  console.table(
    details.passes.map((pass) => ({
      pass: pass.pass,
      mode: pass.mode,
      resolution: pass.maxDimension,
      videoKbps: Math.round(pass.videoBitsPerSecond / 1000),
      audioKbps: Math.round(pass.audioBitsPerSecond / 1000),
      sizeMb: pass.outputSizeMb,
      under10Mb: pass.underLimit,
      playable: pass.playable,
      note: pass.playableReason ?? ''
    }))
  );
  console.error('Исходник:', {
    fileName: details.fileName,
    sizeMb: details.sourceSizeMb,
    durationSec: details.durationSec,
    resolution: `${details.width}x${details.height}`,
    mimeType: details.sourceMimeType,
    recorderMimeType: details.recorderMimeType
  });
  console.error('Итог:', {
    reason: details.reason,
    passesPlanned: details.passesPlanned,
    acceptedAttempts: details.acceptedAttempts,
    smallestOutputMb:
      details.smallestOutputBytes != null
        ? formatMegabytes(details.smallestOutputBytes)
        : null,
    limitMb: details.uploadLimitMb
  });
  console.groupEnd();
};

const formatBytesMb = (bytes: number): string =>
  `${(bytes / (1024 * 1024)).toFixed(2)} МБ (${bytes.toLocaleString()} байт)`;

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

const noopAudioCapture: ReencodeAudioCapture = {
  canCaptureAudio: false,
  attachAudioTo: () => ({ hasAudio: false, detach: () => {} }),
  cleanup: () => {}
};

const prefersAudioContextCapture = (sourceMimeType?: string, fileName?: string): boolean => {
  const mime = sourceMimeType?.toLowerCase() ?? '';
  if (mime.includes('quicktime') || mime.includes('mp4')) {
    return true;
  }
  return /\.(mov|mp4|m4v)$/i.test(fileName ?? '');
};

const tryCaptureStreamAudioCapture = (video: HTMLVideoElement): ReencodeAudioCapture => {
  const videoWithCapture = video as HTMLVideoElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  };

  let captureStream: MediaStream | null = null;
  try {
    captureStream = videoWithCapture.captureStream?.() ?? videoWithCapture.mozCaptureStream?.() ?? null;
    const captureAudioTrack = captureStream?.getAudioTracks()[0];
    if (!captureAudioTrack) {
      captureStream?.getTracks().forEach((track) => track.stop());
      return noopAudioCapture;
    }

    return {
      canCaptureAudio: true,
      attachAudioTo: (targetStream) => {
        targetStream.addTrack(captureAudioTrack);
        return {
          hasAudio: true,
          detach: () => {
            targetStream.removeTrack(captureAudioTrack);
          }
        };
      },
      cleanup: () => captureStream?.getTracks().forEach((track) => track.stop())
    };
  } catch {
    captureStream?.getTracks().forEach((track) => track.stop());
    return noopAudioCapture;
  }
};

const tryAudioContextCapture = async (video: HTMLVideoElement): Promise<ReencodeAudioCapture> => {
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return noopAudioCapture;
  }

  try {
    const audioContext = new AudioContextCtor();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const elementSource = audioContext.createMediaElementSource(video);
    let activeDestination: MediaStreamAudioDestinationNode | null = null;

    return {
      canCaptureAudio: true,
      attachAudioTo: (targetStream) => {
        const destination = audioContext.createMediaStreamDestination();
        activeDestination = destination;
        elementSource.connect(destination);
        const track = destination.stream.getAudioTracks()[0];
        if (!track) {
          elementSource.disconnect(destination);
          activeDestination = null;
          return { hasAudio: false, detach: () => elementSource.disconnect(destination) };
        }

        targetStream.addTrack(track);
        return {
          hasAudio: true,
          detach: () => {
            targetStream.removeTrack(track);
            track.stop();
            elementSource.disconnect(destination);
            if (activeDestination === destination) {
              activeDestination = null;
            }
          }
        };
      },
      cleanup: () => {
        if (activeDestination) {
          elementSource.disconnect(activeDestination);
          activeDestination = null;
        }
        elementSource.disconnect();
        void audioContext.close();
      }
    };
  } catch {
    return noopAudioCapture;
  }
};

/** Захват аудиодорожки для перекодирования (Safari/iPhone MOV не отдаёт звук через captureStream). */
const createReencodeAudioCapture = async (
  video: HTMLVideoElement,
  sourceMimeType?: string,
  fileName?: string
): Promise<ReencodeAudioCapture> => {
  video.muted = false;
  video.volume = 1;

  type AudioCaptureStrategy = (targetVideo: HTMLVideoElement) => Promise<ReencodeAudioCapture>;
  const strategies: AudioCaptureStrategy[] = prefersAudioContextCapture(sourceMimeType, fileName)
    ? [tryAudioContextCapture, async (targetVideo) => tryCaptureStreamAudioCapture(targetVideo)]
    : [async (targetVideo) => tryCaptureStreamAudioCapture(targetVideo), tryAudioContextCapture];

  for (const strategy of strategies) {
    const capture = await strategy(video);
    if (capture.canCaptureAudio) {
      return capture;
    }
  }

  return noopAudioCapture;
};

const disposeClonedVideo = (video: HTMLVideoElement) => {
  video.pause();
  video.removeAttribute('src');
  video.load();
};

const cloneMetadataForReencode = async (metadata: VideoMetadata): Promise<VideoMetadata> => {
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = false;
  video.volume = 1;
  video.playsInline = true;
  video.setAttribute('playsinline', 'true');
  video.src = metadata.objectUrl;

  await new Promise<void>((resolve, reject) => {
    const onReady = () => {
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('error', onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('error', onError);
      reject(new Error('Не удалось подготовить видео для сжатия'));
    };
    video.addEventListener('loadeddata', onReady);
    video.addEventListener('error', onError);
    video.load();
  });

  return {
    video,
    objectUrl: metadata.objectUrl,
    duration: metadata.duration,
    width: metadata.width,
    height: metadata.height
  };
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

/** Запас ниже лимита: MediaRecorder часто даёт файл крупнее заданного битрейта. */
const BITRATE_ESTIMATE_MARGIN = 0.72;

const estimateVideoBitrate = (durationSec: number): number => {
  const safeDuration = Math.max(durationSec, 1);
  const targetBytes = MAX_VIDEO_UPLOAD_BYTES * BITRATE_ESTIMATE_MARGIN;
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
    { maxDimension: 480, videoBitsPerSecond: MIN_VIDEO_BITRATE, audioBitsPerSecond: 48_000 },
    { maxDimension: 360, videoBitsPerSecond: 180_000, audioBitsPerSecond: 32_000 },
    { maxDimension: 320, videoBitsPerSecond: 150_000, audioBitsPerSecond: 32_000 }
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

const waitForPlaybackStart = async (
  video: HTMLVideoElement,
  signal?: AbortSignal
): Promise<void> => {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    throwIfAborted(signal);

    if (!video.paused && (video.currentTime > 0.01 || video.readyState >= 3)) {
      return;
    }

    if (video.ended) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
      } catch {
        await wait(50);
      }
    }

    await wait(50);
  }

  throw new Error('video_playback_timeout');
};

const finalizeRecorder = async (recorder: MediaRecorder): Promise<void> => {
  if (recorder.state === 'recording') {
    recorder.requestData();
    await wait(400);
    recorder.stop();
    return;
  }

  if (recorder.state === 'paused') {
    recorder.resume();
    recorder.requestData();
    await wait(400);
    recorder.stop();
  }
};

type ReencodeVideoResult = {
  file: File;
  recordedAudio: boolean;
};

const reencodeVideo = async (
  file: File,
  metadata: VideoMetadata,
  mimeType: string,
  profile: CompressionProfile,
  audioCapture: ReencodeAudioCapture | null,
  signal?: AbortSignal,
  withAudio = true
): Promise<ReencodeVideoResult> => {
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
  let detachAudio = () => {};
  let hasAudio = false;

  if (withAudio && audioCapture) {
    const attachment = audioCapture.attachAudioTo(canvasStream);
    hasAudio = attachment.hasAudio;
    detachAudio = attachment.detach;
  }

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

  const outputMimeType = toBaseMimeType(mimeType);

  const recordingFinished = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: outputMimeType }));
    recorder.onerror = () => reject(new Error('Ошибка сжатия видео'));
  });

  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
  recorder.start(250);
  await waitForPlaybackStart(video, signal);

  await new Promise<void>((resolve, reject) => {
    const renderFrame = () => {
      if (signal?.aborted) {
        reject(new SaveAbortedError());
        return;
      }

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
  await wait(200);
  await finalizeRecorder(recorder);

  detachAudio();
  canvasStream.getTracks().forEach((track) => track.stop());

  const blob = await recordingFinished;
  const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'video';

  return {
    file: new File([blob], `${baseName}.${extension}`, {
      type: outputMimeType,
      lastModified: Date.now()
    }),
    recordedAudio: withAudio && hasAudio
  };
};

const toBaseMimeType = (mimeType: string): string => mimeType.split(';')[0].trim();

const inspectCompressedVideo = async (
  file: File
): Promise<{ playable: boolean; durationSec?: number; reason?: string }> => {
  if (file.size < MIN_VALID_OUTPUT_BYTES) {
    return { playable: false, reason: 'output_too_small' };
  }

  try {
    const durationSec = await getVideoDuration(file);
    if (Number.isFinite(durationSec) && durationSec > 0) {
      return { playable: true, durationSec };
    }
  } catch {
    // Свежий WebM от MediaRecorder иногда не отдаёт duration сразу, но воспроизводится.
  }

  return { playable: true, reason: 'duration_metadata_unavailable' };
};

const encodeProfileAttempt = async (
  file: File,
  metadata: VideoMetadata,
  profile: CompressionProfile,
  signal?: AbortSignal
): Promise<{ file: File; mode: CompressionPassLog['mode'] }> => {
  const mimeWithAudio = pickRecorderMimeType(true);
  const mimeVideoOnly = pickRecorderMimeType(false);

  if (!mimeVideoOnly && !mimeWithAudio) {
    throw new Error('Браузер не поддерживает сжатие видео');
  }

  if (mimeWithAudio) {
    const freshMetadata = await cloneMetadataForReencode(metadata);
    const freshAudioCapture = await createReencodeAudioCapture(
      freshMetadata.video,
      file.type,
      file.name
    );

    try {
      const audioAttempt = await reencodeVideo(
        file,
        freshMetadata,
        mimeWithAudio,
        profile,
        freshAudioCapture,
        signal,
        true
      );

      if (
        audioAttempt.recordedAudio &&
        audioAttempt.file.size >= MIN_VALID_OUTPUT_BYTES
      ) {
        return { file: audioAttempt.file, mode: 'audio' };
      }
    } finally {
      freshAudioCapture.cleanup();
      disposeClonedVideo(freshMetadata.video);
    }
  }

  const videoMetadata = await cloneMetadataForReencode(metadata);
  const outputMimeType = mimeVideoOnly ?? mimeWithAudio!;

  try {
    const videoOnly = await reencodeVideo(
      file,
      videoMetadata,
      outputMimeType,
      profile,
      null,
      signal,
      false
    );

    return {
      file: videoOnly.file,
      mode: mimeWithAudio ? 'video_only_fallback' : 'video_only'
    };
  } finally {
    disposeClonedVideo(videoMetadata.video);
  }
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

const buildFailureDetails = (
  file: File,
  metadata: VideoMetadata,
  mimeType: string,
  profiles: CompressionProfile[],
  passLogs: CompressionPassLog[],
  attempts: File[],
  reason: VideoCompressionFailureDetails['reason']
): VideoCompressionFailureDetails => {
  const allOutputs = passLogs.map((pass) => pass.outputSizeBytes);
  const smallestOutputBytes =
    allOutputs.length > 0 ? Math.min(...allOutputs) : attempts.length > 0
      ? Math.min(...attempts.map((item) => item.size))
      : null;

  return {
    fileName: file.name,
    sourceSizeBytes: file.size,
    sourceSizeMb: formatBytesMb(file.size),
    sourceMimeType: file.type || 'unknown',
    durationSec: metadata.duration,
    width: metadata.width,
    height: metadata.height,
    recorderMimeType: mimeType,
    uploadLimitBytes: MAX_VIDEO_UPLOAD_BYTES,
    uploadLimitMb: formatBytesMb(MAX_VIDEO_UPLOAD_BYTES),
    passesPlanned: profiles.length,
    passes: passLogs,
    acceptedAttempts: attempts.length,
    smallestOutputBytes,
    reason
  };
};

const throwCompressionFailure = (
  file: File,
  metadata: VideoMetadata,
  mimeType: string,
  profiles: CompressionProfile[],
  passLogs: CompressionPassLog[],
  attempts: File[],
  reason: VideoCompressionFailureDetails['reason']
): never => {
  const details = buildFailureDetails(file, metadata, mimeType, profiles, passLogs, attempts, reason);
  const smallestMb =
    details.smallestOutputBytes != null
      ? formatMegabytes(details.smallestOutputBytes)
      : null;

  let message = `Не удалось сжать видео до ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ.`;
  if (reason === 'no_audio_capture') {
    message =
      `Не удалось сохранить звук при сжатии видео. Выберите файл до ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ.`;
  } else if (reason === 'all_over_limit' && smallestMb) {
    message += ` Наименьший результат: ${smallestMb} МБ. Попробуйте более короткий ролик.`;
  } else if (reason === 'no_valid_output') {
    message += ' Ни один проход не дал пригодный файл. Подробности — в консоли.';
  } else {
    message += ' Попробуйте более короткий ролик. Подробности — в консоли.';
  }

  throw new VideoCompressionError(message, details);
};

const compressWithRetries = async (
  file: File,
  metadata: VideoMetadata,
  mimeType: string,
  signal?: AbortSignal
): Promise<File> => {
  const profiles = buildCompressionProfiles(metadata.duration);
  const attempts: File[] = [];
  const passLogs: CompressionPassLog[] = [];

  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index];
    throwIfAborted(signal);
    const { file: compressed, mode } = await encodeProfileAttempt(
      file,
      metadata,
      profile,
      signal
    );
    const inspection = await inspectCompressedVideo(compressed);
    const passLog: CompressionPassLog = {
      pass: index + 1,
      mode,
      maxDimension: profile.maxDimension,
      videoBitsPerSecond: profile.videoBitsPerSecond,
      audioBitsPerSecond: profile.audioBitsPerSecond,
      outputSizeBytes: compressed.size,
      outputSizeMb: formatBytesMb(compressed.size),
      underLimit: compressed.size <= MAX_VIDEO_UPLOAD_BYTES,
      playable: inspection.playable,
      playableReason: inspection.reason,
      durationSec: inspection.durationSec
    };
    passLogs.push(passLog);

    if (!inspection.playable) {
      continue;
    }
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

  const best = pickBestCompressed(file, attempts);
  if (best) {
    return best.size < file.size || file.size > MAX_VIDEO_UPLOAD_BYTES ? best : file;
  }

  if (attempts.length > 0 || passLogs.some((pass) => pass.outputSizeBytes > 0)) {
    return throwCompressionFailure(file, metadata, mimeType, profiles, passLogs, attempts, 'all_over_limit');
  }

  return throwCompressionFailure(file, metadata, mimeType, profiles, passLogs, attempts, 'no_valid_output');
};

export type CompressVideoOptions = {
  signal?: AbortSignal;
};

/** Сжимает видео перед E2EE-загрузкой и проверяет лимиты размера/длительности. */
export const compressVideoForUpload = async (
  file: File,
  options?: CompressVideoOptions
): Promise<File> => {
  const signal = options?.signal;
  throwIfAborted(signal);

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

    return await compressWithRetries(file, metadata, mimeType, signal);
  } catch (error) {
    if (error instanceof SaveAbortedError || error instanceof VideoCompressionError) {
      throw error;
    }

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
