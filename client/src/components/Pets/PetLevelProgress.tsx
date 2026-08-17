import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, LinearProgress, Typography } from '@mui/material';
import { alpha, lighten, type Theme } from '@mui/material/styles';
import { PET_MAX_LEVEL } from '../../config/petCatalogShared';
import { AutoAwesomeIcon } from '../UI/icons';

import { INPUT_BORDER_RADIUS } from '../../theme/appTheme';

const CELEBRATE_MS = 1650;

const SPARKLES = [
  { left: '-6%', top: '6%', delay: '0ms', size: 13, driftX: -10, driftY: -14 },
  { left: '94%', top: '-4%', delay: '70ms', size: 15, driftX: 12, driftY: -16 },
  { left: '102%', top: '58%', delay: '130ms', size: 11, driftX: 14, driftY: 6 },
  { left: '-8%', top: '68%', delay: '180ms', size: 12, driftX: -12, driftY: 10 },
  { left: '46%', top: '-18%', delay: '40ms', size: 14, driftX: 2, driftY: -18 },
  { left: '70%', top: '104%', delay: '160ms', size: 10, driftX: 8, driftY: 12 },
] as const;

const celebrateKeyframes = {
  '@keyframes petSubLevelBadgePop': {
    '0%': { transform: 'scale(1) rotate(0deg)' },
    '28%': { transform: 'scale(1.22) rotate(-6deg)' },
    '52%': { transform: 'scale(0.94) rotate(4deg)' },
    '74%': { transform: 'scale(1.08) rotate(-2deg)' },
    '100%': { transform: 'scale(1) rotate(0deg)' },
  },
  '@keyframes petSubLevelRing': {
    '0%': { transform: 'scale(0.92)', opacity: 0.72 },
    '100%': { transform: 'scale(1.7)', opacity: 0 },
  },
  '@keyframes petSubLevelCountPop': {
    '0%': { transform: 'translateY(8px) scale(0.7)', opacity: 0.35 },
    '40%': { transform: 'translateY(-2px) scale(1.28)', opacity: 1 },
    '100%': { transform: 'translateY(0) scale(1)', opacity: 1 },
  },
  '@keyframes petSubLevelShine': {
    '0%': { transform: 'translateX(-120%)', opacity: 0 },
    '18%': { opacity: 0.95 },
    '100%': { transform: 'translateX(140%)', opacity: 0 },
  },
  '@keyframes petSubLevelPlusFloat': {
    '0%': { opacity: 0, transform: 'translate(-50%, 6px) scale(0.7)' },
    '18%': { opacity: 1, transform: 'translate(-50%, -2px) scale(1.12)' },
    '70%': { opacity: 1, transform: 'translate(-50%, -18px) scale(1)' },
    '100%': { opacity: 0, transform: 'translate(-50%, -28px) scale(0.92)' },
  },
  '@keyframes petSubLevelGlow': {
    '0%': { boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
    '22%': { boxShadow: '0 0 22px 2px currentColor' },
    '100%': { boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
  },
} as const;

const getLevelDigitColor = (theme: Theme) =>
  theme.palette.mode === 'dark' ? lighten(theme.palette.primary.main, 0.48) : theme.palette.primary.main;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const useSubLevelCelebrate = (level: number, subLevel: number) => {
  const prevRef = useRef<{ level: number; subLevel: number } | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [burstId, setBurstId] = useState(0);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = { level, subLevel };
    if (!prev || level !== prev.level || subLevel <= prev.subLevel) {
      return;
    }

    setBurstId((id) => id + 1);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setBurstId(0);
      timeoutRef.current = null;
    }, CELEBRATE_MS);
  }, [level, subLevel]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  return burstId;
};

const SubLevelSparkles: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <Box
    aria-hidden
    sx={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      overflow: 'visible',
      zIndex: 2,
    }}
  >
    {SPARKLES.map((sparkle, index) => (
      <Box
        key={index}
        sx={{
          position: 'absolute',
          left: sparkle.left,
          top: sparkle.top,
          color: 'primary.main',
          animation: `petSubLevelSparkle${index} 920ms ease-out ${sparkle.delay} both`,
          [`@keyframes petSubLevelSparkle${index}`]: {
            '0%': { opacity: 0, transform: 'scale(0.15) rotate(-20deg)' },
            '28%': { opacity: 1, transform: 'scale(1.2) rotate(8deg)' },
            '100%': {
              opacity: 0,
              transform: `scale(0.45) rotate(18deg) translate(${sparkle.driftX}px, ${sparkle.driftY}px)`,
            },
          },
        }}
      >
        <AutoAwesomeIcon sx={{ fontSize: compact ? sparkle.size * 0.72 : sparkle.size }} />
      </Box>
    ))}
  </Box>
);

const ProgressWithShine: React.FC<{
  value: number;
  height: number;
  celebrating: boolean;
}> = ({ value, height, celebrating }) => (
  <Box
    sx={(theme) => ({
      position: 'relative',
      overflow: 'hidden',
      borderRadius: INPUT_BORDER_RADIUS,
      ...(celebrating
        ? {
            boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.35)}, 0 0 14px ${alpha(
              theme.palette.primary.main,
              0.38
            )}`,
          }
        : {}),
    })}
  >
    <LinearProgress
      variant="determinate"
      value={value}
      sx={(theme) => ({
        height,
        borderRadius: INPUT_BORDER_RADIUS,
        bgcolor: 'action.hover',
        '& .MuiLinearProgress-bar': {
          borderRadius: INPUT_BORDER_RADIUS,
          transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          ...(celebrating
            ? {
                boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.7)}`,
              }
            : {}),
        },
      })}
    />
    {celebrating && (
      <Box
        sx={(theme) => ({
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `linear-gradient(90deg, transparent 0%, ${alpha(
            theme.palette.common.white,
            theme.palette.mode === 'light' ? 0.72 : 0.42
          )} 48%, transparent 100%)`,
          animation: 'petSubLevelShine 780ms ease-out',
        })}
      />
    )}
  </Box>
);

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
  const burstId = useSubLevelCelebrate(level, subLevel);
  const celebrating = burstId > 0 && !prefersReducedMotion();
  const isMaxLevel = level >= PET_MAX_LEVEL;
  const progress =
    levelProgressPercent ?? (subLevelMax > 0 ? Math.round((subLevel / subLevelMax) * 100) : 100);
  const showProgressBar = showBar && !isMaxLevel;

  if (compact) {
    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          overflow: 'visible',
          ...celebrateKeyframes,
          ...(celebrating
            ? {
                color: 'primary.main',
                animation: 'petSubLevelGlow 1.2s ease-out',
              }
            : {}),
        }}
      >
        {celebrating && <SubLevelSparkles compact />}
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
              animation: celebrating ? 'petSubLevelBadgePop 620ms cubic-bezier(0.22, 1.4, 0.36, 1)' : undefined,
            })}
          >
            {level}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            noWrap
            sx={{ position: 'relative' }}
          >
            {isMaxLevel ? (
              t('pets.levelMax', { level })
            ) : (
              <>
                <Box
                  key={celebrating ? `sub-${burstId}` : 'sub'}
                  component="span"
                  sx={{
                    display: 'inline-block',
                    color: celebrating ? 'primary.main' : 'inherit',
                    animation: celebrating ? 'petSubLevelCountPop 520ms cubic-bezier(0.22, 1, 0.36, 1)' : undefined,
                  }}
                >
                  {subLevel}
                </Box>
                /{subLevelMax}
              </>
            )}
          </Typography>
        </Box>
        {showProgressBar && <ProgressWithShine value={progress} height={6} celebrating={celebrating} />}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1.75,
        overflow: 'visible',
        ...celebrateKeyframes,
        ...(celebrating
          ? {
              color: 'primary.main',
              animation: 'petSubLevelGlow 1.25s ease-out',
            }
          : {}),
      }}
    >
      {celebrating && <SubLevelSparkles />}
      <Box sx={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
        {celebrating && (
          <>
            <Box
              sx={(theme) => ({
                position: 'absolute',
                inset: -5,
                borderRadius: '50%',
                border: `2px solid ${alpha(getLevelDigitColor(theme), 0.7)}`,
                animation: 'petSubLevelRing 720ms ease-out forwards',
                pointerEvents: 'none',
              })}
            />
            <Box
              sx={(theme) => ({
                position: 'absolute',
                inset: -5,
                borderRadius: '50%',
                border: `2px solid ${alpha(getLevelDigitColor(theme), 0.45)}`,
                animation: 'petSubLevelRing 860ms 90ms ease-out forwards',
                pointerEvents: 'none',
              })}
            />
          </>
        )}
        <Box
          sx={(theme) => ({
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.16 : 0.3),
            color: getLevelDigitColor(theme),
            boxShadow: celebrating
              ? `inset 0 0 0 2px ${alpha(getLevelDigitColor(theme), 0.55)}, 0 0 18px ${alpha(
                  theme.palette.primary.main,
                  0.45
                )}`
              : `inset 0 0 0 2px ${alpha(getLevelDigitColor(theme), 0.38)}`,
            animation: celebrating ? 'petSubLevelBadgePop 680ms cubic-bezier(0.22, 1.4, 0.36, 1)' : undefined,
          })}
        >
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1 }}>{level}</Typography>
        </Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} sx={{ mb: isMaxLevel || showProgressBar ? 0.35 : 0 }}>
          {isMaxLevel ? t('pets.levelMax', { level }) : t('pets.level', { level })}
        </Typography>
        {!isMaxLevel && (
          <Box sx={{ position: 'relative', display: 'inline-block', mb: showProgressBar ? 0.85 : 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              sx={{ display: 'block' }}
            >
              <Box
                key={celebrating ? `sub-${burstId}` : 'sub'}
                component="span"
                sx={{
                  display: 'inline-block',
                  color: celebrating ? 'primary.main' : 'inherit',
                  fontWeight: celebrating ? 800 : 600,
                  animation: celebrating ? 'petSubLevelCountPop 520ms cubic-bezier(0.22, 1, 0.36, 1)' : undefined,
                }}
              >
                {subLevel}
              </Box>
              /{subLevelMax}
            </Typography>
            {celebrating && (
              <Typography
                key={`plus-${burstId}`}
                variant="caption"
                fontWeight={800}
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top: -2,
                  color: 'primary.main',
                  pointerEvents: 'none',
                  animation: 'petSubLevelPlusFloat 1100ms ease-out forwards',
                }}
              >
                +1
              </Typography>
            )}
          </Box>
        )}
        {showProgressBar && <ProgressWithShine value={progress} height={10} celebrating={celebrating} />}
      </Box>
    </Box>
  );
};

export default PetLevelProgress;
