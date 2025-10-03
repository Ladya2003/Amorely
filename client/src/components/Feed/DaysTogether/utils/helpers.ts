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
  if (days < 3) return "Самое начало нашей истории любви 💕";
  if (days < 7) return "Первые дни волшебства вместе ✨";
  if (days < 14) return "Неделя за неделей - открываем друг друга 🌸";
  if (days < 30) return "Первый месяц незабываемых моментов 🌟";
  if (days < 60) return "Два месяца счастья и бабочек в животе 🦋";
  if (days < 90) return "Три месяца любви и нежности 💑";
  if (days < 120) return "Четыре месяца вместе - наш маленький мир 🌍";
  if (days < 180) return "Полгода любви и взаимопонимания 💝";
  if (days < 270) return "Девять месяцев - как рождение нашей любви 🎈";
  if (days < 365) return "Почти год вместе - наша любовь крепнет 💕";
  if (days < 548) return "Больше года любви и заботы друг о друге 💖";
  if (days < 730) return "Полтора года - наша любовь как крепкий дуб 🌳";
  if (days < 1095) return "Два года вместе - наша история продолжается 📖";
  if (days < 1460) return "Три года любви - мы непобедимы вместе 👑";
  if (days < 1825) return "Четыре года - наша любовь как драгоценный камень 💎";
  if (days < 2190) return "Пять лет вместе - половина десятилетия счастья 🎊";
  if (days < 2555) return "Шесть лет - наша связь становится все глубже 🌊";
  if (days < 2920) return "Семь лет - мы прошли через все вместе 🌈";
  if (days < 3650) return "Восемь лет любви - настоящая крепость 🏰";
  if (days < 4380) return "Десять лет вместе - целая эпоха любви 🎭";
  if (days < 5475) return "Двенадцать лет - наша любовь как вино, с годами лучше 🍷";
  if (days < 7300) return "Пятнадцать лет вместе - мы единое целое 💫";
  if (days < 10950) return "Двадцать лет любви - наша легенда ⭐";
  if (days < 14600) return "Двадцать пять лет - серебряная свадьба близко! 🥈";
  if (days < 18250) return "Тридцать лет вместе - жемчужная прочность 📿";
  return "Любовь длиною в жизнь - вечная и бесконечная 💎✨";
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
    { id: 'month3', days: 90, title: 'Три месяца', icon: '🌸', description: '90 дней вместе', achieved: false },
    { id: 'days100', days: 100, title: 'Первая сотня!', icon: '💯', description: '100 дней вместе', achieved: false },
    { id: 'month6', days: 180, title: 'Полгода', icon: '💝', description: '180 дней вместе', achieved: false },
    { id: 'month9', days: 270, title: 'Девять месяцев', icon: '🌹', description: '270 дней вместе', achieved: false },
    { id: 'year1', days: 365, title: 'Год вместе!', icon: '👑', description: '365 дней вместе', achieved: false },
    { id: 'year1_5', days: 548, title: 'Полтора года', icon: '🌳', description: '548 дней вместе', achieved: false },
    { id: 'year2', days: 730, title: 'Два года!', icon: '💎', description: '730 дней вместе', achieved: false },
    { id: 'year3', days: 1095, title: 'Три года!', icon: '📖', description: '1095 дней вместе', achieved: false },
    { id: 'year4', days: 1460, title: 'Четыре года!', icon: '🏆', description: '1460 дней вместе', achieved: false },
    { id: 'year5', days: 1825, title: 'Пять лет!', icon: '🎊', description: '1825 дней вместе', achieved: false },
    { id: 'year7', days: 2555, title: 'Семь лет!', icon: '🌈', description: '2555 дней вместе', achieved: false },
    { id: 'year10', days: 3650, title: 'Десять лет!', icon: '🎭', description: '3650 дней вместе', achieved: false },
    { id: 'year15', days: 5475, title: 'Пятнадцать лет!', icon: '💫', description: '5475 дней вместе', achieved: false },
    { id: 'year20', days: 7300, title: 'Двадцать лет!', icon: '⭐', description: '7300 дней вместе', achieved: false },
    { id: 'year25', days: 9125, title: 'Серебряная свадьба!', icon: '🥈', description: '9125 дней вместе', achieved: false },
    { id: 'year30', days: 10950, title: 'Жемчужная свадьба!', icon: '📿', description: '10950 дней вместе', achieved: false }
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
      description: 'Первые дни волшебства вместе',
      unlocked: daysCount >= 7
    },
    {
      id: 'two_weeks',
      icon: '🌸',
      title: 'Две недели',
      description: 'Открываем друг друга',
      unlocked: daysCount >= 14
    },
    {
      id: 'first_month',
      icon: '💫',
      title: 'Месяц любви',
      description: 'Месяц незабываемых моментов!',
      unlocked: daysCount >= 30
    },
    {
      id: 'two_months',
      icon: '🦋',
      title: 'Два месяца',
      description: 'Счастье и бабочки в животе',
      unlocked: daysCount >= 60
    },
    {
      id: 'three_months',
      icon: '💑',
      title: 'Три месяца',
      description: 'Любовь и нежность',
      unlocked: daysCount >= 90
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
      description: 'Любовь и взаимопонимание',
      unlocked: daysCount >= 180
    },
    {
      id: 'nine_months',
      icon: '🎈',
      title: 'Девять месяцев',
      description: 'Как рождение нашей любви',
      unlocked: daysCount >= 270
    },
    {
      id: 'first_year',
      icon: '👑',
      title: 'Год вместе',
      description: 'Целый год любви и заботы!',
      unlocked: daysCount >= 365
    },
    {
      id: 'year_and_half',
      icon: '🌳',
      title: 'Полтора года',
      description: 'Любовь как крепкий дуб',
      unlocked: daysCount >= 548
    },
    {
      id: 'two_years',
      icon: '💎',
      title: 'Два года',
      description: 'Наша история продолжается',
      unlocked: daysCount >= 730
    },
    {
      id: 'three_years',
      icon: '📖',
      title: 'Три года',
      description: 'Мы непобедимы вместе',
      unlocked: daysCount >= 1095
    },
    {
      id: 'four_years',
      icon: '💎',
      title: 'Четыре года',
      description: 'Любовь как драгоценный камень',
      unlocked: daysCount >= 1460
    },
    {
      id: 'five_years',
      icon: '🎊',
      title: 'Пять лет',
      description: 'Половина десятилетия счастья!',
      unlocked: daysCount >= 1825
    },
    {
      id: 'seven_years',
      icon: '🌈',
      title: 'Семь лет',
      description: 'Прошли через все вместе',
      unlocked: daysCount >= 2555
    },
    {
      id: 'ten_years',
      icon: '🎭',
      title: 'Десять лет',
      description: 'Целая эпоха любви!',
      unlocked: daysCount >= 3650
    },
    {
      id: 'fifteen_years',
      icon: '💫',
      title: 'Пятнадцать лет',
      description: 'Мы единое целое',
      unlocked: daysCount >= 5475
    },
    {
      id: 'twenty_years',
      icon: '⭐',
      title: 'Двадцать лет',
      description: 'Наша легенда!',
      unlocked: daysCount >= 7300
    },
    {
      id: 'silver_wedding',
      icon: '🥈',
      title: 'Серебряная свадьба',
      description: '25 лет вместе - невероятно!',
      unlocked: daysCount >= 9125
    },
    {
      id: 'pearl_wedding',
      icon: '📿',
      title: 'Жемчужная свадьба',
      description: '30 лет - жемчужная прочность',
      unlocked: daysCount >= 10950
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

