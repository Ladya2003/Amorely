import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button } from '@mui/material';
import type { CliffGameState } from '../../../services/gamesService';
import { CLIFF_ASSETS } from './cliffAssets';
import CliffCharacter from './CliffCharacter';
import {
  getCliffHubBackdropSx,
  getCliffHubStageSx,
  getCliffModalPrimaryButtonSx,
  getCliffParchmentPanelSx,
  getCliffSceneRootSx,
} from './cliffStyles';

const CLIFF_CAVE_FALL_MS = 2800;

type CliffCaveFallProps = {
  state: CliffGameState;
  onContinue: () => void;
};

const displayName = (user: CliffGameState['me']) => user.firstName || user.username || '';

const CliffCaveFall: React.FC<CliffCaveFallProps> = ({ state, onContinue }) => {
  const { t } = useTranslation();
  const [landed, setLanded] = useState(false);
  const myName = displayName(state.me) || t('games.common.you');
  const partnerName = displayName(state.partner) || t('games.common.partner');
  const showPartner = state.partnerPresent;

  useEffect(() => {
    const id = window.setTimeout(() => setLanded(true), CLIFF_CAVE_FALL_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <Box sx={{ ...getCliffSceneRootSx(), zIndex: 6 }}>
      <Box sx={getCliffHubBackdropSx()} aria-hidden>
        <Box component="img" src={CLIFF_ASSETS.cavesFall} alt="" />
      </Box>
      <Box sx={getCliffHubStageSx()}>
        <Box
          component="img"
          src={CLIFF_ASSETS.cavesFall}
          alt=""
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: { xs: '28%', sm: '24%' },
            zIndex: 3,
            animation: `cliffCaveSlideMe ${CLIFF_CAVE_FALL_MS}ms cubic-bezier(0.45, 0.05, 0.85, 0.35) both`,
            '@keyframes cliffCaveSlideMe': {
              '0%': { left: '38%', top: '8%', transform: 'rotate(-22deg)' },
              '48%': { left: '46%', top: '42%', transform: 'rotate(-10deg)' },
              '100%': { left: '14%', top: '68%', transform: 'rotate(-28deg)' },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              left: '14%',
              top: '68%',
              transform: 'rotate(-28deg)',
            },
          }}
        >
          <CliffCharacter
            avatar={state.me.avatar}
            name={myName}
            walking={false}
            from="left"
            compact
            speechWide
            speech={t('games.cliff.caves.fallingMe')}
            motion="idle"
          />
        </Box>
        {showPartner && (
          <Box
            sx={{
              position: 'absolute',
              width: { xs: '28%', sm: '24%' },
              zIndex: 3,
              animation: `cliffCaveSlidePartner ${CLIFF_CAVE_FALL_MS}ms cubic-bezier(0.45, 0.05, 0.85, 0.35) both`,
              '@keyframes cliffCaveSlidePartner': {
                '0%': { left: '46%', top: '6%', transform: 'rotate(-8deg)' },
                '48%': { left: '54%', top: '40%', transform: 'rotate(6deg)' },
                '100%': { left: '62%', top: '70%', transform: 'rotate(20deg)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
                left: '62%',
                top: '70%',
                transform: 'rotate(20deg)',
              },
            }}
          >
            <CliffCharacter
              avatar={state.partner.avatar}
              name={partnerName}
              walking={false}
              from="right"
              compact
              speech={t('games.cliff.caves.fallingPartner')}
              motion="idle"
            />
          </Box>
        )}
      </Box>
      {landed && (
        <Box
          sx={{
            ...getCliffParchmentPanelSx(),
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button onClick={onContinue} sx={getCliffModalPrimaryButtonSx()}>
            {t('games.cliff.caves.fallingContinue')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CliffCaveFall;
