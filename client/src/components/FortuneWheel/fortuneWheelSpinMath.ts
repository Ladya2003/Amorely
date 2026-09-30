export const normalizeDegrees = (degrees: number): number => {
  const normalized = degrees % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

export const getSegmentAngle = (segmentCount: number): number => 360 / segmentCount;

/** Угол центра сектора index (0 = верх, по часовой). */
export const getSegmentCenterAngle = (index: number, segmentCount: number): number => {
  const segmentAngle = getSegmentAngle(segmentCount);
  return index * segmentAngle + segmentAngle / 2;
};

/**
 * Куда должно прийти колесо (mod 360), чтобы сектор index оказался под указателем сверху.
 * Колесо в CSS вращается по часовой: α + R ≡ 0 (mod 360) → R ≡ 360 - center.
 */
export const getTargetRotationMod = (index: number, segmentCount: number): number =>
  normalizeDegrees(360 - getSegmentCenterAngle(index, segmentCount));

/** Приращение поворота от текущего положения до сектора index (+ extraSpins полных оборотов). */
export const computeSpinDeltaRotation = (
  startRotation: number,
  winnerIndex: number,
  segmentCount: number,
  extraSpins: number
): number => {
  const targetMod = getTargetRotationMod(winnerIndex, segmentCount);
  const currentMod = normalizeDegrees(startRotation);
  let deltaMod = targetMod - currentMod;
  if (deltaMod <= 0) {
    deltaMod += 360;
  }
  return 360 * extraSpins + deltaMod;
};

/** Какой сектор под указателем сверху при данном rotation. */
export const getWinnerIndexFromRotation = (rotation: number, segmentCount: number): number => {
  if (segmentCount <= 0) {
    return 0;
  }

  const segmentAngle = getSegmentAngle(segmentCount);
  const angleAtPointer = normalizeDegrees(360 - normalizeDegrees(rotation));
  const index = Math.floor(angleAtPointer / segmentAngle);

  if (index >= segmentCount) {
    return segmentCount - 1;
  }

  return index;
};
