import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, LinearProgress, Typography } from '@mui/material';
import { alpha, lighten, type Theme } from '@mui/material/styles';
import { PET_MAX_LEVEL } from '../../config/petCatalogShared';

import { INPUT_BORDER_RADIUS } from '../../theme/appTheme';

const getLevelDigitColor = (theme: Theme) =>
  theme.palette.mode === 'dark' ? lighten(theme.palette.primary.main, 0.48) : theme.palette.primary.main;

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
  const showProgressBar = showBar && !isMaxLevel;

  if (compact) {
    return (
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            mb: showProgressBar ? 0.6 : 0,
          }}
        >
          <Box
            sx={(theme) => ({
              minWidth: 28,
              height: 22,
              px: 0.75,
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.16 : 0.28),
              color: getLevelDigitColor(theme),
              fontSize: '0.7rem',
              fontWeight: 800,
              lineHeight: 1,
            })}
          >
            {level}
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
            {isMaxLevel ? t('pets.levelMax', { level }) : `${subLevel}/${subLevelMax}`}
          </Typography>
        </Box>
        {showProgressBar && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: INPUT_BORDER_RADIUS,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { borderRadius: INPUT_BORDER_RADIUS },
            }}
          />
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.75 }}>
      <Box
        sx={(theme) => ({
          width: 56,
          height: 56,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.16 : 0.3),
          color: getLevelDigitColor(theme),
          boxShadow: `inset 0 0 0 2px ${alpha(getLevelDigitColor(theme), 0.38)}`,
        })}
      >
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1 }}>
          {level}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} sx={{ mb: isMaxLevel || showProgressBar ? 0.35 : 0 }}>
          {isMaxLevel ? t('pets.levelMax', { level }) : t('pets.level', { level })}
        </Typography>
        {!isMaxLevel && (
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ display: 'block', mb: showProgressBar ? 0.85 : 0 }}
          >
            {subLevel}/{subLevelMax}
          </Typography>
        )}
        {showProgressBar && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10,
              borderRadius: INPUT_BORDER_RADIUS,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { borderRadius: INPUT_BORDER_RADIUS },
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default PetLevelProgress;
