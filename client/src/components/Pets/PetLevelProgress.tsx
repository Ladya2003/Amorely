import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, LinearProgress, Typography } from '@mui/material';
import { PET_MAX_LEVEL } from '../../config/petCatalogShared';

import { INPUT_BORDER_RADIUS } from '../../theme/appTheme';

interface PetLevelProgressProps {
  level: number;
  subLevel: number;
  subLevelMax: number;
  levelProgressPercent?: number;
  showBar?: boolean;
  compact?: boolean;
}

const PetLevelProgress: React.FC<PetLevelProgressProps> = ({
  level,
  subLevel,
  subLevelMax,
  levelProgressPercent,
  showBar = true,
  compact = false,
}) => {
  const { t } = useTranslation();
  const isMaxLevel = level >= PET_MAX_LEVEL;
  const progress =
    levelProgressPercent ?? (subLevelMax > 0 ? Math.round((subLevel / subLevelMax) * 100) : 100);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant={compact ? 'caption' : 'body2'}
        color={isMaxLevel ? 'text.secondary' : 'text.primary'}
        fontWeight={compact ? 500 : 600}
        sx={{ display: 'block', mb: showBar && !isMaxLevel ? 0.75 : 0 }}
      >
        {isMaxLevel
          ? t('pets.levelMax', { level })
          : t('pets.levelWithProgress', { level, current: subLevel, total: subLevelMax })}
      </Typography>
      {showBar && !isMaxLevel && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: compact ? 6 : 10,
            borderRadius: INPUT_BORDER_RADIUS,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { borderRadius: INPUT_BORDER_RADIUS },
          }}
        />
      )}
    </Box>
  );
};

export default PetLevelProgress;
