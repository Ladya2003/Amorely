export const getMsUntilUtcMidnight = () => {
  const now = new Date();
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.max(0, nextMidnight - now.getTime());
};

export const getMinutesUntilUtcMidnight = () =>
  Math.max(0, Math.ceil(getMsUntilUtcMidnight() / 60_000));

export const formatDailyResetCountdown = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};
