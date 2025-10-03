// Хук для управления логикой DaysTogether

import { useState, useEffect } from 'react';
import { Milestone, Achievement } from '../types';
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
      setMilestones(calculateMilestones(daysCount));
      setNextMilestone(getNextMilestone(daysCount));
      setProgress(calculateProgressToNextMilestone(daysCount));
      setAchievements(getAchievements(daysCount));
    }
  }, [daysCount]);

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

