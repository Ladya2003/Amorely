const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isYesterday = (date: Date, now: Date) => {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};

export const formatContactPresence = (
  isOnline?: boolean,
  lastSeen?: string | null
): string => {
  if (isOnline) {
    return 'В сети';
  }

  if (!lastSeen) {
    return 'Не в сети';
  }

  const lastSeenDate = new Date(lastSeen);
  if (Number.isNaN(lastSeenDate.getTime())) {
    return 'Не в сети';
  }

  const now = new Date();
  const time = lastSeenDate.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  if (isSameDay(lastSeenDate, now)) {
    return `был(а) в сети сегодня в ${time}`;
  }

  if (isYesterday(lastSeenDate, now)) {
    return `был(а) в сети вчера в ${time}`;
  }

  const date = lastSeenDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return `был(а) в сети ${date} в ${time}`;
};
