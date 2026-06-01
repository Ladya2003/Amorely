/**
 * Итоговый размер после сжатия (E2EE → Cloudinary raw, Free-план 10 МБ).
 */
export const MAX_VIDEO_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Максимальный размер исходника при выборе файла (сожмётся перед загрузкой). */
export const MAX_VIDEO_SOURCE_BYTES = 50 * 1024 * 1024;

/** Максимальная длительность видео в секундах. */
export const MAX_VIDEO_DURATION_SEC = 120;

/** Уже маленькое видео с нормальным разрешением не перекодируем. */
export const VIDEO_SKIP_BELOW_BYTES = 6 * 1024 * 1024;

/** Длинная сторона после сжатия (макс. для первого прохода). */
export const MAX_VIDEO_WIDTH = 1280;

/** Стартовый битрейт видео, если длительность неизвестна. */
export const VIDEO_BITRATE = 900_000;

/** Битрейт аудио при перекодировании. */
export const VIDEO_AUDIO_BITRATE = 96_000;

/** Запас под превышение битрейта браузером (0–1). */
export const VIDEO_COMPRESSION_MARGIN = 0.88;

/** Минимальный битрейт видео на последних проходах. */
export const MIN_VIDEO_BITRATE = 220_000;

/** Сколько раз перекодируем с усилением сжатия, пока не влезет в лимит. */
export const MAX_VIDEO_COMPRESSION_PASSES = 5;

export const formatMegabytes = (bytes: number): string =>
  String(Math.round(bytes / (1024 * 1024)));

export const VIDEO_LIMITS_HINT =
  `Видео: до ${formatMegabytes(MAX_VIDEO_SOURCE_BYTES)} МБ и ${MAX_VIDEO_DURATION_SEC} сек. ` +
  `Перед загрузкой автоматически сжимается до ${formatMegabytes(MAX_VIDEO_UPLOAD_BYTES)} МБ.`;
