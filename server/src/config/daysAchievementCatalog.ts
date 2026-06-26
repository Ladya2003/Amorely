/** Must stay in sync with client DaysTogether ACHIEVEMENT_DEFS. */
export const DAYS_ACHIEVEMENT_DEFS: { id: string; days: number }[] = [
  { id: 'first_week', days: 7 },
  { id: 'two_weeks', days: 14 },
  { id: 'first_month', days: 30 },
  { id: 'two_months', days: 60 },
  { id: 'three_months', days: 90 },
  { id: 'century', days: 100 },
  { id: 'half_year', days: 180 },
  { id: 'nine_months', days: 270 },
  { id: 'first_year', days: 365 },
  { id: 'year_and_half', days: 548 },
  { id: 'two_years', days: 730 },
  { id: 'three_years', days: 1095 },
  { id: 'four_years', days: 1460 },
  { id: 'five_years', days: 1825 },
  { id: 'seven_years', days: 2555 },
  { id: 'ten_years', days: 3650 },
  { id: 'fifteen_years', days: 5475 },
  { id: 'twenty_years', days: 7300 },
  { id: 'silver_wedding', days: 9125 },
  { id: 'pearl_wedding', days: 10950 },
];

export const DAYS_ACHIEVEMENT_REWARD = 50;

export const calculateDaysTogether = (startDate: Date, now = new Date()): number => {
  const diffTime = Math.abs(now.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getUnlockedAchievementIds = (daysCount: number): string[] =>
  DAYS_ACHIEVEMENT_DEFS.filter((achievement) => daysCount >= achievement.days).map(
    (achievement) => achievement.id
  );
