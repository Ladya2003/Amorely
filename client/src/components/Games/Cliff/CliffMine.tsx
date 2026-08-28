import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import type { CliffGameState, CliffMetal, CliffPublicBoulder } from '../../../services/gamesService';
import { ArrowBackIcon } from '../../UI/icons';
import { CLIFF_ASSETS, cliffBoulderImage } from './cliffAssets';
import CliffInventoryPack from './CliffInventoryPack';
import {
  CLIFF_BOULDER_BREAK_MS,
  CLIFF_BOULDER_HIT_MS,
  formatCliffCountdown,
  getCliffBoulderBreakSx,
  getCliffBoulderHitSx,
  getCliffBoulderIdleSx,
  getCliffBoulderShardSx,
  getCliffMineBackButtonSx,
  getCliffMineBoulderSpots,
  getCliffMineRefreshSx,
  getCliffMineRippleSx,
  getCliffMineSparkSx,
  getCliffMineTapBadgeSx,
  getCliffMineTapBarSx,
  getCliffMineTapLabelSx,
  getCliffMineTitleSx,
  getCliffMineViewSx,
  getCliffOreAwardSx,
  getCliffOreAwardTextSx,
  getCliffOverlaySx,
} from './cliffStyles';

type CliffMineTapBadgeProps = {
  current: number;
  goal: number;
  metal: 'iron' | 'copper';
  roomy?: boolean;
};

const CliffMineTapBadge: React.FC<CliffMineTapBadgeProps> = ({ current, goal, metal, roomy = false }) => {
  const { t } = useTranslation();
  const progress = goal > 0 ? (current / goal) * 100 : 0;
  return (
    <Box sx={getCliffMineTapBadgeSx(roomy)}>
      <Typography sx={{ ...getCliffMineTapLabelSx(), fontSize: roomy ? '0.95rem' : '0.68rem' }}>
        {t('games.cliff.mine.taps', { current, goal })}
      </Typography>
      <Box sx={getCliffMineTapBarSx(metal, progress)}>
        <Box component="span" />
      </Box>
    </Box>
  );
};

type CliffMineProps = {
  state: CliffGameState;
  activeBoulderId: string | null;
  breakAward: { amount: number; metal: CliffMetal } | null;
  onSelectBoulder: (boulder: CliffPublicBoulder) => void;
  onTapBoulder: () => void;
  onBreakDone: () => void;
  onCloseBoulder: () => void;
  onClose: () => void;
};

const CliffMine: React.FC<CliffMineProps> = ({
  state,
  activeBoulderId,
  breakAward,
  onSelectBoulder,
  onTapBoulder,
  onBreakDone,
  onCloseBoulder,
  onClose,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const active = state.boulders.find((boulder) => boulder.id === activeBoulderId) ?? null;
  const boulderKey = state.boulders.map((boulder) => boulder.id).join('|');
  const spots = useMemo(
    () => getCliffMineBoulderSpots(state.relationshipId, boulderKey.split('|')),
    [boulderKey, state.relationshipId]
  );
  const [hitKey, setHitKey] = useState(0);
  const [resetLeftMs, setResetLeftMs] = useState<number | null>(null);
  const breaking = Boolean(breakAward);

  useEffect(() => {
    if (!state.mineResetAt) {
      setResetLeftMs(null);
      return undefined;
    }
    const tick = () => {
      setResetLeftMs(Math.max(0, new Date(state.mineResetAt as string).getTime() - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [state.mineResetAt]);

  const resetLabel =
    resetLeftMs === null ? null : t('games.cliff.mine.refreshIn', { time: formatCliffCountdown(resetLeftMs) });

  useEffect(() => {
    setHitKey(0);
  }, [activeBoulderId]);

  useEffect(() => {
    if (hitKey === 0 || breaking) {
      return undefined;
    }
    const id = window.setTimeout(() => setHitKey(0), CLIFF_BOULDER_HIT_MS);
    return () => window.clearTimeout(id);
  }, [breaking, hitKey]);

  useEffect(() => {
    if (!breakAward) {
      return undefined;
    }
    const id = window.setTimeout(() => onBreakDone(), CLIFF_BOULDER_BREAK_MS);
    return () => window.clearTimeout(id);
  }, [breakAward, onBreakDone]);

  const punchBoulder = () => {
    if (active?.depleted || breaking) {
      return;
    }
    setHitKey((prev) => prev + 1);
    onTapBoulder();
  };

  if (active) {
    return (
      <Box
        sx={{
          ...getCliffOverlaySx(theme),
          ...getCliffMineViewSx(),
          alignItems: 'stretch',
          p: 0,
          backgroundImage: `url(${CLIFF_ASSETS.mineInterior})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          bgcolor: 'transparent',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, flexShrink: 0, pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pb: 0.5 }}>
            <IconButton
              aria-label={t('games.common.back')}
              onClick={onCloseBoulder}
              sx={getCliffMineBackButtonSx()}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={getCliffMineTitleSx()}>
              {t(`games.cliff.mine.${active.metal}Boulder`)}
            </Typography>
          </Box>
          <Box sx={{ px: 2, pb: 0.75 }}>
            <CliffInventoryPack state={state} />
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            py: 3,
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={punchBoulder}
            disabled={active.depleted || breaking}
            aria-label={t('games.cliff.mine.tapVein')}
            sx={{
              position: 'relative',
              border: 'none',
              background: 'transparent',
              width: 'min(100%, 360px)',
              cursor: active.depleted || breaking ? 'default' : 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Box
              key={breaking ? 'break' : `hit-${hitKey}`}
              component="img"
              src={cliffBoulderImage(active.metal)}
              alt=""
              sx={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
                ...(breaking
                  ? getCliffBoulderBreakSx()
                  : hitKey > 0
                    ? getCliffBoulderHitSx()
                    : getCliffBoulderIdleSx()),
              }}
            />
            {breaking &&
              Array.from({ length: 4 }, (_, index) => (
                <Box
                  key={`shard-${index}`}
                  component="img"
                  src={cliffBoulderImage(active.metal)}
                  alt=""
                  sx={getCliffBoulderShardSx(index)}
                />
              ))}
            {hitKey > 0 && !breaking && (
              <>
                <Box key={`ripple-${hitKey}`} sx={getCliffMineRippleSx()} />
                {Array.from({ length: 8 }, (_, index) => (
                  <Box key={`${hitKey}-${index}`} sx={getCliffMineSparkSx(index)} />
                ))}
              </>
            )}
            {breakAward && (
              <Box sx={getCliffOreAwardSx()}>
                <Typography component="span" sx={getCliffOreAwardTextSx()}>
                  +
                </Typography>
                <Box
                  component="img"
                  src={cliffBoulderImage(breakAward.metal)}
                  alt=""
                  sx={{
                    width: 36,
                    height: 36,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                  }}
                />
                <Typography component="span" sx={getCliffOreAwardTextSx()}>
                  {breakAward.amount}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ mt: 1.5, minWidth: 140 }}>
            <CliffMineTapBadge
              current={active.tapsDone}
              goal={active.tapsRequired}
              metal={active.metal}
              roomy
            />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ ...getCliffOverlaySx(theme), ...getCliffMineViewSx(), bgcolor: 'transparent' }}>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: `url(${CLIFF_ASSETS.mineInterior})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, pt: 1.25, pb: 0.5, flexShrink: 0 }}>
          <IconButton aria-label={t('games.common.back')} onClick={onClose} sx={getCliffMineBackButtonSx()}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={getCliffMineTitleSx()}>
            {t('games.cliff.mine.title')}
          </Typography>
          {resetLabel && (
            <Typography component="span" sx={getCliffMineRefreshSx()}>
              {resetLabel}
            </Typography>
          )}
        </Box>
        <Box sx={{ px: 1.25, pb: 0.75 }}>
          <CliffInventoryPack state={state} />
        </Box>
        <Box sx={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'auto' }}>
          {state.boulders.map((boulder, index) => {
            const spot = spots[index];
            if (!spot) {
              return null;
            }
            return (
              <Box
                key={boulder.id}
                component="button"
                type="button"
                onClick={() => onSelectBoulder(boulder)}
                sx={{
                  position: 'absolute',
                  left: spot.left,
                  top: spot.top,
                  width: spot.width,
                  maxWidth: { xs: 96, sm: 96, md: 118 },
                  border: 'none',
                  p: 0,
                  background: 'transparent',
                  cursor: boulder.depleted ? 'default' : 'pointer',
                  opacity: boulder.depleted ? 0.42 : 1,
                }}
              >
                <Box
                  component="img"
                  src={cliffBoulderImage(boulder.metal)}
                  alt=""
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    transform: `rotate(${spot.rotate})`,
                    transformOrigin: 'center bottom',
                  }}
                />
                <CliffMineTapBadge
                  current={boulder.tapsDone}
                  goal={boulder.tapsRequired}
                  metal={boulder.metal}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default CliffMine;
