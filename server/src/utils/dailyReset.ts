export const getUtcDayKey = () => new Date().toISOString().slice(0, 10);

export const getNextUtcMidnight = () => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
};

export const getMinutesUntilUtcMidnight = () => {
  const nextMidnight = getNextUtcMidnight();
  return Math.max(0, Math.ceil((nextMidnight.getTime() - Date.now()) / 60_000));
};

export const getSecondsUntilUtcMidnight = () => getMinutesUntilUtcMidnight() * 60;
