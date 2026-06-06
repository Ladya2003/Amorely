// Вспомогательные функции для DaysTogether

import type { TFunction } from 'i18next';
import { Milestone, Achievement } from '../types';
import { formatLocalizedDate } from '../../../../localization/localeFormat';

const STATUS_RULES: { key: string; max: number }[] = [
  { key: 'lt3', max: 3 },
  { key: 'lt7', max: 7 },
  { key: 'lt14', max: 14 },
  { key: 'lt30', max: 30 },
  { key: 'lt60', max: 60 },
  { key: 'lt90', max: 90 },
  { key: 'lt120', max: 120 },
  { key: 'lt180', max: 180 },
  { key: 'lt270', max: 270 },
  { key: 'lt365', max: 365 },
  { key: 'lt548', max: 548 },
  { key: 'lt730', max: 730 },
  { key: 'lt1095', max: 1095 },
  { key: 'lt1460', max: 1460 },
  { key: 'lt1825', max: 1825 },
  { key: 'lt2190', max: 2190 },
  { key: 'lt2555', max: 2555 },
  { key: 'lt2920', max: 2920 },
  { key: 'lt3650', max: 3650 },
  { key: 'lt4380', max: 4380 },
  { key: 'lt5475', max: 5475 },
  { key: 'lt7300', max: 7300 },
  { key: 'lt10950', max: 10950 },
  { key: 'lt14600', max: 14600 },
  { key: 'lt18250', max: 18250 },
];

const MILESTONE_DEFS: { id: string; days: number; icon: string }[] = [
  { id: 'week1', days: 7, icon: '💫' },
  { id: 'week2', days: 14, icon: '✨' },
  { id: 'month1', days: 30, icon: '💕' },
  { id: 'month2', days: 60, icon: '💖' },
  { id: 'month3', days: 90, icon: '🌸' },
  { id: 'days100', days: 100, icon: '💯' },
  { id: 'month6', days: 180, icon: '💝' },
  { id: 'month9', days: 270, icon: '🌹' },
  { id: 'year1', days: 365, icon: '👑' },
  { id: 'year1_5', days: 548, icon: '🌳' },
  { id: 'year2', days: 730, icon: '💎' },
  { id: 'year3', days: 1095, icon: '📖' },
  { id: 'year4', days: 1460, icon: '🏆' },
  { id: 'year5', days: 1825, icon: '🎊' },
  { id: 'year7', days: 2555, icon: '🌈' },
  { id: 'year10', days: 3650, icon: '🎭' },
  { id: 'year15', days: 5475, icon: '💫' },
  { id: 'year20', days: 7300, icon: '⭐' },
  { id: 'year25', days: 9125, icon: '🥈' },
  { id: 'year30', days: 10950, icon: '📿' },
];

const ACHIEVEMENT_DEFS: { id: string; days: number; icon: string }[] = [
  { id: 'first_week', days: 7, icon: '🌟' },
  { id: 'two_weeks', days: 14, icon: '🌸' },
  { id: 'first_month', days: 30, icon: '💫' },
  { id: 'two_months', days: 60, icon: '🦋' },
  { id: 'three_months', days: 90, icon: '💑' },
  { id: 'century', days: 100, icon: '💯' },
  { id: 'half_year', days: 180, icon: '💝' },
  { id: 'nine_months', days: 270, icon: '🎈' },
  { id: 'first_year', days: 365, icon: '👑' },
  { id: 'year_and_half', days: 548, icon: '🌳' },
  { id: 'two_years', days: 730, icon: '💎' },
  { id: 'three_years', days: 1095, icon: '📖' },
  { id: 'four_years', days: 1460, icon: '💎' },
  { id: 'five_years', days: 1825, icon: '🎊' },
  { id: 'seven_years', days: 2555, icon: '🌈' },
  { id: 'ten_years', days: 3650, icon: '🎭' },
  { id: 'fifteen_years', days: 5475, icon: '💫' },
  { id: 'twenty_years', days: 7300, icon: '⭐' },
  { id: 'silver_wedding', days: 9125, icon: '🥈' },
  { id: 'pearl_wedding', days: 10950, icon: '📿' },
];

export const getDaysWord = (count: number, t: TFunction): string =>
  t('feed.day', { count });

export const getRelationshipStatus = (days: number, t: TFunction): string => {
  for (const rule of STATUS_RULES) {
    if (days < rule.max) {
      return t(`feed.status.${rule.key}`);
    }
  }
  return t('feed.status.default');
};

export const calculateMilestones = (daysCount: number, t: TFunction): Milestone[] =>
  MILESTONE_DEFS.map((milestone) => ({
    id: milestone.id,
    days: milestone.days,
    icon: milestone.icon,
    title: t(`feed.milestones.${milestone.id}.title`),
    description: t(`feed.milestones.${milestone.id}.description`, { days: milestone.days }),
    achieved: daysCount >= milestone.days,
  }));

export const getNextMilestone = (daysCount: number, t: TFunction): Milestone | null => {
  const milestones = calculateMilestones(daysCount, t);
  return milestones.find((m) => !m.achieved) || null;
};

export const calculateProgressToNextMilestone = (daysCount: number, t: TFunction): number => {
  const nextMilestone = getNextMilestone(daysCount, t);
  if (!nextMilestone) return 100;

  const anniversaries = [365, 730, 1095, 1825];

  let start = 0;
  if (!anniversaries.includes(nextMilestone.days)) {
    const milestones = calculateMilestones(daysCount, t);
    const previousMilestone = milestones
      .filter((m) => m.achieved)
      .sort((a, b) => b.days - a.days)[0];
    start = previousMilestone?.days || 0;
  }

  const end = nextMilestone.days;
  const current = daysCount - start;
  const total = end - start;

  return Math.min(100, Math.max(0, (current / total) * 100));
};

export const getAchievements = (daysCount: number, t: TFunction): Achievement[] =>
  ACHIEVEMENT_DEFS.filter((achievement) => daysCount >= achievement.days).map((achievement) => ({
    id: achievement.id,
    icon: achievement.icon,
    title: t(`feed.achievements.${achievement.id}.title`),
    description: t(`feed.achievements.${achievement.id}.description`),
    unlocked: true,
  }));

export const validateFileSize = (
  file: File,
  t: TFunction,
  maxSizeMB: number = 100
): { valid: boolean; error?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: t('feed.validation.fileTooLarge', { max: maxSizeMB }),
    };
  }

  return { valid: true };
};

export const validateFileType = (file: File, t: TFunction): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: t('feed.validation.invalidFormat'),
    };
  }

  return { valid: true };
};

export const formatDate = (dateString: string, locale?: string | null): string =>
  formatLocalizedDate(dateString, locale);

export const getDaysUntilAnniversary = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();

  const nextAnniversary = new Date(start);
  nextAnniversary.setFullYear(now.getFullYear());

  if (nextAnniversary < now) {
    nextAnniversary.setFullYear(now.getFullYear() + 1);
  }

  const diffTime = nextAnniversary.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
