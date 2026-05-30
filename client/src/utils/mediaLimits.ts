/** Максимальный размер видео до загрузки (бесплатный Cloudinary + мобильный интернет). */
export const MAX_VIDEO_UPLOAD_BYTES = 30 * 1024 * 1024;

/** Максимальная длительность видео в секундах. */
export const MAX_VIDEO_DURATION_SEC = 120;

export const formatMegabytes = (bytes: number): string =>
  String(Math.round(bytes / (1024 * 1024)));

export const VIDEO_LIMITS_HINT =
  `Видео: до ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ и ${MAX_VIDEO_DURATION_SEC} сек.`;
