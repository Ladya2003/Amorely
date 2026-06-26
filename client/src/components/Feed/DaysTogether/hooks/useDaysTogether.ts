// Хук для управления логикой DaysTogether

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Milestone, Achievement } from '../types';
import { claimCurrency } from '../../../../services/petsService';
import {
  calculateMilestones,
  getNextMilestone,
  calculateProgressToNextMilestone,
  getAchievements,
  getDaysUntilAnniversary
} from '../utils/helpers';

interface UseDaysTogetherProps {
  daysCount: number | null;
  relationshipStartDate: string | null;
}

export const useDaysTogether = ({ daysCount, relationshipStartDate }: UseDaysTogetherProps) => {
  const { t, i18n } = useTranslation();
  const [showAchievements, setShowAchievements] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [nextMilestone, setNextMilestone] = useState<Milestone | null>(null);
  const [progress, setProgress] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [daysUntilAnniversary, setDaysUntilAnniversary] = useState<number | null>(null);
  
  // Загружаем выбранную тему из localStorage
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    const saved = localStorage.getItem('daysTogetherTheme');
    return saved || 'pink';
  });

  // Вычисляем все данные при изменении daysCount
  useEffect(() => {
    if (daysCount) {
      setMilestones(calculateMilestones(daysCount, t));
      setNextMilestone(getNextMilestone(daysCount, t));
      setProgress(calculateProgressToNextMilestone(daysCount, t));
      setAchievements(getAchievements(daysCount, t));
    }
  }, [daysCount, t, i18n.language]);

  // Вычисляем дни до годовщины
  useEffect(() => {
    if (relationshipStartDate) {
      setDaysUntilAnniversary(getDaysUntilAnniversary(relationshipStartDate));
    }
  }, [relationshipStartDate]);

  const toggleAchievements = () => {
    setShowAchievements(!showAchievements);
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    localStorage.setItem('daysTogetherTheme', themeId);
    void claimCurrency('days_theme').catch(() => undefined);
  };

  return {
    // State
    showAchievements,
    milestones,
    nextMilestone,
    progress,
    achievements,
    daysUntilAnniversary,
    selectedTheme,

    // Handlers
    toggleAchievements,
    handleThemeChange
  };
};

