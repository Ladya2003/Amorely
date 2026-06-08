/** TODO: убрать после исправления сжатия на мобильных. */
export const SHOW_VIDEO_COMPRESSION_DEBUG = true;

const serializeValue = (value: unknown): string => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export class VideoCompressionDebugError extends Error {
  readonly debugInfo: string;

  constructor(message: string, debugInfo: string) {
    super(message);
    this.name = 'VideoCompressionDebugError';
    this.debugInfo = debugInfo;
  }
}

export const isVideoCompressionDebugError = (
  error: unknown
): error is VideoCompressionDebugError => error instanceof VideoCompressionDebugError;

export const buildVideoCompressionDebugInfo = (
  error: unknown,
  context: Record<string, unknown> = {}
): string => {
  const lines = [
    `type: ${error instanceof Error ? error.name : typeof error}`,
    `message: ${error instanceof Error ? error.message : serializeValue(error)}`,
    ...(error instanceof Error && error.stack ? [`stack: ${error.stack}`] : []),
    ...Object.entries(context).map(([key, value]) => `${key}: ${serializeValue(value)}`),
    `userAgent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a'}`,
    `platform: ${typeof navigator !== 'undefined' ? navigator.platform : 'n/a'}`,
    `mediaRecorder: ${typeof MediaRecorder !== 'undefined' ? 'yes' : 'no'}`,
    `isSecureContext: ${typeof window !== 'undefined' ? String(window.isSecureContext) : 'n/a'}`
  ];

  if (
    error instanceof Error &&
    error.name === 'VideoCompressionError' &&
    'details' in error
  ) {
    lines.push(`compressionDetails: ${serializeValue((error as { details: unknown }).details)}`);
  }

  return lines.join('\n');
};

export const wrapVideoCompressionError = (
  error: unknown,
  context: Record<string, unknown> = {}
): Error => {
  const debugInfo = buildVideoCompressionDebugInfo(error, context);
  const message =
    error instanceof Error && error.message
      ? error.message
      : 'Неизвестная ошибка сжатия видео';

  console.groupCollapsed('[compressVideo][debug]', message);
  console.error(debugInfo);
  console.groupEnd();

  if (!SHOW_VIDEO_COMPRESSION_DEBUG) {
    return error instanceof Error ? error : new Error(message);
  }

  return new VideoCompressionDebugError(message, debugInfo);
};

export const formatErrorForUser = (error: unknown, fallback: string): string => {
  if (error instanceof VideoCompressionDebugError) {
    return `${error.message}\n\n— DEBUG —\n${error.debugInfo}`;
  }

  if (error instanceof Error && error.name === 'VideoCompressionError') {
    const base = error.message;
    if (!SHOW_VIDEO_COMPRESSION_DEBUG) return base;
    return `${base}\n\n— DEBUG —\n${buildVideoCompressionDebugInfo(error, {
      compressionDetails: 'details' in error ? (error as { details: unknown }).details : null
    })}`;
  }

  if (error instanceof Error) {
    if (!SHOW_VIDEO_COMPRESSION_DEBUG) return error.message;
    return `${error.message}\n\n— DEBUG —\n${buildVideoCompressionDebugInfo(error)}`;
  }

  if (!SHOW_VIDEO_COMPRESSION_DEBUG) return fallback;
  return `${fallback}\n\n— DEBUG —\n${buildVideoCompressionDebugInfo(error)}`;
};
