import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, LinearProgress, Chip, useTheme } from '@mui/material';
import { Milestone } from '../types';
import { getDaysWord } from '../utils/helpers';
import { ColorTheme } from './ColorPicker';
import {
  getDaysTogetherChipSx,
  getDaysTogetherInnerSurfaceSx,
  getDaysTogetherProgressSx,
} from '../daysTogetherStyles';

interface ProgressIndicatorProps {
  nextMilestone: Milestone | null;
  progress: number;
  daysCount: number;
  theme: ColorTheme;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  nextMilestone,
  progress,
  daysCount,
  theme: colorTheme,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (!nextMilestone) {
    return (
      <Box sx={{ mt: 2, ...getDaysTogetherInnerSurfaceSx(theme) }}>
        <Typography variant="body2" align="center" fontWeight={700} color="success.main">
          {t('feed.progress.allMilestones')}
        </Typography>
      </Box>
    );
  }

  const daysRemaining = nextMilestone.days - daysCount;

  return (
    <Box sx={{ mt: 2, ...getDaysTogetherInnerSurfaceSx(theme) }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25, gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {t('feed.progress.nextMilestone')}
        </Typography>
        <Chip
          label={`${nextMilestone.icon} ${nextMilestone.title}`}
          size="small"
          variant="outlined"
          sx={getDaysTogetherChipSx(theme, colorTheme)}
        />
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          mb: 1.25,
          ...getDaysTogetherProgressSx(theme, colorTheme),
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {t('feed.progress.percentDone', { percent: Math.round(progress) })}
        </Typography>
        <Typography variant="caption" fontWeight={700} sx={{ color: colorTheme.preview }}>
          {t('feed.progress.daysRemaining', {
            count: daysRemaining,
            daysWord: getDaysWord(daysRemaining, t),
          })}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProgressIndicator;
