// Индикатор прогресса до следующей вехи

import React from 'react';
import { Box, Typography, LinearProgress, Chip, useTheme } from '@mui/material';
import { Milestone } from '../types';
import { getDaysWord } from '../utils/helpers';
import { ColorTheme } from './ColorPicker';

interface ProgressIndicatorProps {
  nextMilestone: Milestone | null;
  progress: number;
  daysCount: number;
  theme: ColorTheme;
  hasPhoto?: boolean;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  nextMilestone,
  progress,
  daysCount,
  theme,
  hasPhoto = false
}) => {
  const muiTheme = useTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';

  const getBlockStyles = () => {
    if (isDarkMode) {
      return {
        bgcolor: hasPhoto ? 'rgba(30, 30, 30, 0.78)' : 'rgba(255, 255, 255, 0.06)',
        backdropFilter: hasPhoto ? 'blur(10px)' : 'none',
        border: hasPhoto ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.1)',
      };
    }

    return {
      bgcolor: hasPhoto ? 'rgba(255, 255, 255, 0.7)' : `${theme.colors[1].replace(/0\.\d+/, '0.1')}`,
      backdropFilter: hasPhoto ? 'blur(10px)' : 'none',
      border: hasPhoto ? '1px solid rgba(255, 75, 141, 0.2)' : `1px solid ${theme.colors[0].replace(/0\.\d+/, '0.3')}`,
    };
  };

  if (!nextMilestone) {
    return (
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          ...getBlockStyles(),
          ...(isDarkMode
            ? {
                bgcolor: 'rgba(46, 125, 50, 0.15)',
                border: '1px solid rgba(76, 175, 80, 0.25)',
              }
            : {
                bgcolor: hasPhoto ? 'rgba(76, 175, 80, 0.15)' : `${theme.colors[1].replace(/0\.\d+/, '0.1')}`,
                border: hasPhoto ? '1px solid rgba(76, 175, 80, 0.3)' : `1px solid ${theme.colors[0].replace(/0\.\d+/, '0.3')}`,
              }),
        }}
      >
        <Typography 
          variant="body2" 
          align="center" 
          fontWeight="bold"
          sx={{
            color: hasPhoto || isDarkMode ? 'success.main' : theme.preview
          }}
        >
          🎉 Все вехи достигнуты! Вы - легенды! 💎
        </Typography>
      </Box>
    );
  }

  const daysRemaining = nextMilestone.days - daysCount;

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 2,
        ...getBlockStyles(),
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography 
          variant="body2" 
          sx={{
            color: hasPhoto || isDarkMode ? 'text.secondary' : theme.preview
          }}
        >
          До следующей отметки:
        </Typography>
        <Chip
          label={`${nextMilestone.icon} ${nextMilestone.title}`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.preview,
            color: theme.preview,
            '&:hover': {
              bgcolor: `${theme.colors[0].replace(/0\.\d+/, '0.1')}`
            }
          }}
        />
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 4,
          mb: 1,
          bgcolor: isDarkMode
            ? 'rgba(255, 255, 255, 0.08)'
            : hasPhoto
              ? 'rgba(255, 75, 141, 0.1)'
              : `${theme.colors[0].replace(/0\.\d+/, '0.15')}`,
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            background: hasPhoto 
              ? `linear-gradient(90deg, ${theme.preview} 0%, ${theme.colors[1].replace(/rgba\((.+)\)/, 'rgb($1)').replace(/, 0\.\d+/, '')} 100%)`
              : `linear-gradient(90deg, ${theme.preview} 0%, ${theme.colors[1].replace(/rgba\((.+)\)/, 'rgb($1)').replace(/, 0\.\d+/, '')} 100%)`
          }
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography 
          variant="caption" 
          sx={{
            color: hasPhoto || isDarkMode ? 'text.secondary' : `${theme.preview}AA`
          }}
        >
          {Math.round(progress)}% пройдено
        </Typography>
        <Typography 
          variant="caption" 
          fontWeight="bold"
          sx={{
            color: theme.preview
          }}
        >
          {daysRemaining} {getDaysWord(daysRemaining)} осталось
        </Typography>
      </Box>
    </Box>
  );
};

export default ProgressIndicator;

