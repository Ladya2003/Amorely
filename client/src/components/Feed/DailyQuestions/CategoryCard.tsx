import React from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { CategoryStatus } from './types';
import CountdownTimer from './CountdownTimer';
import {
  getCategoryCardSx,
  getCategoryEmojiSx,
  getCategoryTimerSx,
} from './dailyQuestionsStyles';

interface CategoryCardProps {
  category: CategoryStatus;
  onOpen: () => void;
  onResults: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onOpen, onResults }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const showResults = category.userCompleted;
  const showTimer = category.bothCompleted && category.bothCompletedAt;

  const handleClick = () => {
    if (category.userCompleted) {
      onResults();
      return;
    }
    onOpen();
  };

  return (
    <Box
      sx={getCategoryCardSx(theme, true)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
    >
      <Typography sx={getCategoryEmojiSx()}>{category.emoji}</Typography>
      <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
        {category.title}
      </Typography>

      {!category.userCompleted && category.userProgress > 0 && (
        <Typography variant="caption" color="text.secondary">
          {t('dailyQuestions.progress', {
            current: category.userProgress,
            total: category.questionCount,
          })}
        </Typography>
      )}

      {category.userCompleted && !category.partnerCompleted && (
        <Typography variant="caption" color="text.secondary">
          {t('dailyQuestions.waitingPartner')}
        </Typography>
      )}

      {showTimer && category.bothCompletedAt && (
        <CountdownTimer
          startedAt={category.bothCompletedAt}
          sx={getCategoryTimerSx(theme)}
        />
      )}

      {showResults && (
        <Button
          size="small"
          variant="outlined"
          sx={{ mt: 0.5, textTransform: 'none', fontSize: '0.75rem' }}
          onClick={(e) => {
            e.stopPropagation();
            onResults();
          }}
        >
          {t('dailyQuestions.results')}
        </Button>
      )}
    </Box>
  );
};

export default CategoryCard;
