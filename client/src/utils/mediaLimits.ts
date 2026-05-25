/** Максимальный размер видео до загрузки (бесплатный Cloudinary + мобильный интернет). */
export const MAX_VIDEO_UPLOAD_BYTES = 30 * 1024 * 1024;

/** Максимальная длительность видео в секундах. */
export const MAX_VIDEO_DURATION_SEC = 120;

/** Видео меньше этого размера и с подходящим разрешением не перекодируем. */
export const VIDEO_SKIP_BELOW_BYTES = 8 * 1024 * 1024;

/** Целевая ширина/высота видео после сжатия (длинная сторона). */
export const MAX_VIDEO_WIDTH = 1280;

/** Целевой битрейт видео (~9 МБ/мин). */
export const VIDEO_BITRATE = 1_200_000;

export const formatMegabytes = (bytes: number): string =>
  String(Math.round(bytes / (1024 * 1024)));

export const VIDEO_LIMITS_HINT =
  `Видео: до ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ и ${MAX_VIDEO_DURATION_SEC} сек. ` +
  'Большие ролики автоматически сжимаются до 720p перед загрузкой.';
