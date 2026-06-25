type SupportedLocale = 'ru' | 'en' | 'es' | 'de' | 'fr' | 'pt' | 'uk';

const normalizeLocale = (locale?: string): SupportedLocale => {
  const code = (locale || 'ru').slice(0, 2).toLowerCase();
  if (code === 'en' || code === 'es' || code === 'de' || code === 'fr' || code === 'pt' || code === 'uk') {
    return code;
  }
  return 'ru';
};

const pluralize = (value: number, forms: [string, string, string]): string => {
  const abs = Math.abs(value);
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod100 >= 11 && mod100 <= 14) {
    return forms[2];
  }
  if (mod10 === 1) {
    return forms[0];
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return forms[1];
  }
  return forms[2];
};

export const formatTimeRemaining = (msRemaining: number, locale?: string): string => {
  const loc = normalizeLocale(locale);
  const totalMinutes = Math.max(0, Math.ceil(msRemaining / (60 * 1000)));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];

  if (days > 0) {
    if (loc === 'ru' || loc === 'uk') {
      parts.push(`${days} ${pluralize(days, ['день', 'дня', 'дней'])}`);
    } else if (loc === 'en') {
      parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    } else if (loc === 'de') {
      parts.push(`${days} ${days === 1 ? 'Tag' : 'Tage'}`);
    } else if (loc === 'es') {
      parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
    } else if (loc === 'fr') {
      parts.push(`${days} ${days === 1 ? 'jour' : 'jours'}`);
    } else if (loc === 'pt') {
      parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);
    }
  }

  if (hours > 0) {
    if (loc === 'ru' || loc === 'uk') {
      parts.push(`${hours} ${pluralize(hours, ['час', 'часа', 'часов'])}`);
    } else if (loc === 'en') {
      parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    } else if (loc === 'de') {
      parts.push(`${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`);
    } else if (loc === 'es') {
      parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
    } else if (loc === 'fr') {
      parts.push(`${hours} ${hours === 1 ? 'heure' : 'heures'}`);
    } else if (loc === 'pt') {
      parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
    }
  }

  if (parts.length === 0 && minutes > 0) {
    if (loc === 'ru' || loc === 'uk') {
      parts.push(`${minutes} ${pluralize(minutes, ['минута', 'минуты', 'минут'])}`);
    } else if (loc === 'en') {
      parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    } else if (loc === 'de') {
      parts.push(`${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}`);
    } else if (loc === 'es') {
      parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
    } else if (loc === 'fr') {
      parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    } else if (loc === 'pt') {
      parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
    }
  }

  if (parts.length === 0) {
    const labels: Record<SupportedLocale, string> = {
      ru: 'менее минуты',
      uk: 'менше хвилини',
      en: 'less than a minute',
      es: 'menos de un minuto',
      de: 'weniger als eine Minute',
      fr: "moins d'une minute",
      pt: 'menos de um minuto'
    };
    return labels[loc];
  }

  if (loc === 'ru' || loc === 'uk') {
    return parts.join(' ');
  }
  return parts.join(' ');
};

export const buildDeadlineReminderText = (
  msRemaining: number,
  locale?: string,
  isInitial = false
): string => {
  const loc = normalizeLocale(locale);
  const remaining = formatTimeRemaining(msRemaining, loc);

  const templates: Record<SupportedLocale, { initial: string; reminder: string }> = {
    ru: {
      initial: `⏰ Напоминание о дедлайне заметки. Осталось: ${remaining}`,
      reminder: `⏰ До дедлайна заметки осталось: ${remaining}`
    },
    uk: {
      initial: `⏰ Нагадування про дедлайн нотатки. Залишилось: ${remaining}`,
      reminder: `⏰ До дедлайну нотатки залишилось: ${remaining}`
    },
    en: {
      initial: `⏰ Note deadline reminder. Time left: ${remaining}`,
      reminder: `⏰ Time left until the note deadline: ${remaining}`
    },
    es: {
      initial: `⏰ Recordatorio del plazo de la nota. Queda: ${remaining}`,
      reminder: `⏰ Queda hasta el plazo de la nota: ${remaining}`
    },
    de: {
      initial: `⏰ Erinnerung an die Notiz-Frist. Verbleibend: ${remaining}`,
      reminder: `⏰ Bis zur Notiz-Frist verbleiben: ${remaining}`
    },
    fr: {
      initial: `⏰ Rappel de l'échéance de la note. Reste : ${remaining}`,
      reminder: `⏰ Temps restant avant l'échéance de la note : ${remaining}`
    },
    pt: {
      initial: `⏰ Lembrete do prazo da nota. Restam: ${remaining}`,
      reminder: `⏰ Tempo restante até o prazo da nota: ${remaining}`
    }
  };

  const template = templates[loc];
  return isInitial ? template.initial : template.reminder;
};
