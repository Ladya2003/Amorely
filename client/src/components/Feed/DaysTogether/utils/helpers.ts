// Вспомогательные функции для DaysTogether

import { Milestone, Achievement } from '../types';

/**
 * Правильная форма слова "день/дня/дней"
 */
export const getDaysWord = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastDigit === 1 && lastTwoDigits !== 11) return 'день';
  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) return 'дня';
  return 'дней';
};

/**
 * Получить статус отношений в зависимости от количества дней
 */
export const getRelationshipStatus = (days: number): string => {
  if (days < 7) return "Начало прекрасного пути вместе 💕";
  if (days < 30) return "Первые недели волшебства 🌟";
  if (days < 90) return "Месяц за месяцем строим наше счастье 💑";
  if (days < 180) return "Полгода любви и взаимопонимания 💝";
  if (days < 365) return "Наша любовь становится крепче с каждым днем 💪";
  if (days < 730) return "Год за годом - вместе навсегда 👑";
  return "Настоящая любовь, проверенная временем 💎";
};

/**
 * Вычислить все вехи (milestones)
 */
export const calculateMilestones = (daysCount: number): Milestone[] => {
  const milestones: Milestone[] = [
    { id: 'week1', days: 7, title: 'Первая неделя', icon: '💫', description: '7 дней вместе', achieved: false },
    { id: 'week2', days: 14, title: 'Две недели', icon: '✨', description: '14 дней вместе', achieved: false },
    { id: 'month1', days: 30, title: 'Месяц любви', icon: '💕', description: '30 дней вместе', achieved: false },
    { id: 'month2', days: 60, title: 'Два месяца', icon: '💖', description: '60 дней вместе', achieved: false },
    { id: 'days100', days: 100, title: 'Первая сотня!', icon: '💯', description: '100 дней вместе', achieved: false },
    { id: 'month3', days: 90, title: 'Три месяца', icon: '🌸', description: '90 дней вместе', achieved: false },
    { id: 'month6', days: 180, title: 'Полгода', icon: '💝', description: '180 дней вместе', achieved: false },
    { id: 'month9', days: 270, title: 'Девять месяцев', icon: '🌹', description: '270 дней вместе', achieved: false },
    { id: 'year1', days: 365, title: 'Год вместе!', icon: '👑', description: '365 дней вместе', achieved: false },
    { id: 'year2', days: 730, title: 'Два года!', icon: '💎', description: '730 дней вместе', achieved: false },
    { id: 'year3', days: 1095, title: 'Три года!', icon: '🏆', description: '1095 дней вместе', achieved: false },
    { id: 'year5', days: 1825, title: 'Пять лет!', icon: '🎖️', description: '1825 дней вместе', achieved: false }
  ];

  return milestones.map(milestone => ({
    ...milestone,
    achieved: daysCount >= milestone.days
  }));
};

/**
 * Найти следующую веху
 */
export const getNextMilestone = (daysCount: number): Milestone | null => {
  const milestones = calculateMilestones(daysCount);
  return milestones.find(m => !m.achieved) || null;
};

/**
 * Вычислить прогресс до следующей вехи (0-100)
 */
export const calculateProgressToNextMilestone = (daysCount: number): number => {
  const nextMilestone = getNextMilestone(daysCount);
  if (!nextMilestone) return 100;
  
  // Для годовщин (365, 730, 1095, 1825) считаем от начала
  const anniversaries = [365, 730, 1095, 1825];
  
  let start = 0;
  if (anniversaries.includes(nextMilestone.days)) {
    // Для годовщин показываем полный прогресс от начала
    start = 0;
  } else {
    // Для других вех используем предыдущую достигнутую веху
    const milestones = calculateMilestones(daysCount);
    const previousMilestone = milestones
      .filter(m => m.achieved)
      .sort((a, b) => b.days - a.days)[0];
    start = previousMilestone?.days || 0;
  }
  
  const end = nextMilestone.days;
  const current = daysCount - start;
  const total = end - start;
  
  return Math.min(100, Math.max(0, (current / total) * 100));
};

/**
 * Получить все разблокированные достижения
 */
export const getAchievements = (daysCount: number): Achievement[] => {
  const achievements: Achievement[] = [
    {
      id: 'first_week',
      icon: '🌟',
      title: 'Первая неделя',
      description: 'Прошли первую неделю вместе',
      unlocked: daysCount >= 7
    },
    {
      id: 'first_month',
      icon: '💫',
      title: 'Месяц любви',
      description: 'Целый месяц вместе!',
      unlocked: daysCount >= 30
    },
    {
      id: 'century',
      icon: '💯',
      title: 'Первая сотня',
      description: '100 дней - это круто!',
      unlocked: daysCount >= 100
    },
    {
      id: 'half_year',
      icon: '💝',
      title: 'Полгода счастья',
      description: 'Полгода незабываемых моментов',
      unlocked: daysCount >= 180
    },
    {
      id: 'first_year',
      icon: '👑',
      title: 'Год вместе',
      description: 'Целый год любви и заботы!',
      unlocked: daysCount >= 365
    },
    {
      id: 'two_years',
      icon: '💎',
      title: 'Два года',
      description: 'Два года настоящей любви',
      unlocked: daysCount >= 730
    }
  ];

  return achievements.filter(a => a.unlocked);
};

/**
 * Валидация размера файла
 */
export const validateFileSize = (file: File, maxSizeMB: number = 100): { valid: boolean; error?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Файл слишком большой. Максимальный размер: ${maxSizeMB} МБ`
    };
  }
  
  return { valid: true };
};

/**
 * Валидация типа файла
 */
export const validateFileType = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Недопустимый формат файла. Используйте JPG, PNG, GIF или WebP'
    };
  }
  
  return { valid: true };
};

/**
 * Форматирование даты на русском
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Вычислить дни до годовщины
 */
export const getDaysUntilAnniversary = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  
  // Находим следующую годовщину
  let nextAnniversary = new Date(start);
  nextAnniversary.setFullYear(now.getFullYear());
  
  // Если годовщина уже прошла в этом году, берем следующий год
  if (nextAnniversary < now) {
    nextAnniversary.setFullYear(now.getFullYear() + 1);
  }
  
  const diffTime = nextAnniversary.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

