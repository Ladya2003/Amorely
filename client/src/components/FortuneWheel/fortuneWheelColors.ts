/** Основные цвета: красный, оранжевый, жёлтый, зелёный, синий, фиолетовый. */
export const FORTUNE_WHEEL_PRIMARY_COLORS = [
  '#FF2D2D',
  '#FF9100',
  '#FFD600',
  '#00C853',
  '#2979FF',
  '#7C4DFF',
] as const;

/** Дополнительные — после исчерпания основных. */
export const FORTUNE_WHEEL_EXTRA_COLORS = [
  '#00B8FF',
  '#E040FB',
  '#FF4081',
  '#76FF03',
  '#304FFE',
  '#FF6D00',
  '#00E5FF',
  '#D500F9',
] as const;

export const getFortuneWheelColors = (taskCount: number): string[] => {
  if (taskCount <= 0) {
    return [];
  }

  if (taskCount <= FORTUNE_WHEEL_PRIMARY_COLORS.length) {
    return FORTUNE_WHEEL_PRIMARY_COLORS.slice(0, taskCount) as unknown as string[];
  }

  const palette = [...FORTUNE_WHEEL_PRIMARY_COLORS, ...FORTUNE_WHEEL_EXTRA_COLORS];
  return Array.from({ length: taskCount }, (_, index) => palette[index % palette.length]);
};

export const truncateWheelLabel = (task: string, maxLength: number): string => {
  const firstLine = task.split('\n')[0]?.trim() ?? '';
  const short = firstLine.split('—')[0]?.trim() || firstLine;

  if (short.length <= maxLength) {
    return short;
  }

  if (maxLength <= 3) {
    return '...';
  }

  return `${short.slice(0, maxLength - 3)}...`;
};

export const getWheelLabelFontSize = (taskCount: number): number => {
  if (taskCount <= 6) {
    return 11;
  }
  if (taskCount <= 10) {
    return 10;
  }
  if (taskCount <= 16) {
    return 9;
  }
  if (taskCount <= 24) {
    return 8;
  }
  return 7;
};

const HUB_OUTER_RATIO = 0.16;
/** Отступ первой буквы от дуги сектора, чтобы её не срезал белый контур. */
const LABEL_OUTER_INSET = 12;

/** Радиус, с которого подпись начинается — у внешнего края сектора. */
export const getWheelLabelOuterRadius = (wheelRadius: number): number =>
  Math.max(wheelRadius * 0.55, wheelRadius - LABEL_OUTER_INSET);

/** Сколько символов помещается вдоль радиуса, от края сектора к центру. */
export const getWheelLabelMaxLength = (
  taskCount: number,
  wheelRadius: number,
  fontSize: number
): number => {
  if (taskCount <= 0) {
    return 0;
  }

  const segmentAngleRad = (Math.PI * 2) / taskCount;
  const outerRadius = getWheelLabelOuterRadius(wheelRadius);
  const hubClearance = wheelRadius * (HUB_OUTER_RATIO + 0.08);
  const minRadiusForGlyph = (fontSize * 1.12) / segmentAngleRad;
  const innerRadius = Math.min(
    outerRadius - fontSize,
    Math.max(hubClearance, minRadiusForGlyph)
  );
  const available = Math.max(fontSize, outerRadius - innerRadius);
  const charWidth = fontSize * 0.68;
  const fitChars = Math.floor(available / charWidth);

  return Math.max(3, Math.min(fitChars, 40));
};

/**
 * Поворот подписи вдоль радиуса.
 * angleDeg — середина сектора (0 = верх, по часовой). Текст идёт от края к центру.
 */
export const getWheelLabelRotation = (angleDeg: number): number => angleDeg + 90;
