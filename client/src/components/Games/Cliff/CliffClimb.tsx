import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import type { CliffGameState } from '../../../services/gamesService';
import { CLIFF_ASSETS } from './cliffAssets';
import { getCliffSceneRootSx } from './cliffStyles';
import CliffCharacter from './CliffCharacter';

type CliffClimbProps = {
  state: CliffGameState;
};

const CliffClimb: React.FC<CliffClimbProps> = ({ state }) => {
  const { t } = useTranslation();

  return (
    <Box sx={getCliffSceneRootSx()}>
      <Box
        component="img"
        src={CLIFF_ASSETS.climbPath}
        alt=""
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          animation: 'cliffZoom 2.8s ease-out both',
          '@keyframes cliffZoom': {
            from: { transform: 'scale(1)' },
            to: { transform: 'scale(1.18)' },
          },
        }}
      />
      <Typography
        sx={{
          position: 'absolute',
          top: 72,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontWeight: 800,
          color: '#fff8ee',
          textShadow: '0 2px 10px #0008',
        }}
      >
        {t('games.cliff.climb.caption')}
      </Typography>
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '8%',
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          animation: 'cliffWalkUp 2.8s ease-in-out both',
          '@keyframes cliffWalkUp': {
            from: { transform: 'translateY(36px)' },
            to: { transform: 'translateY(-28px)' },
          },
        }}
      >
        <CliffCharacter
          avatar={state.me.avatar}
          name={state.me.firstName || state.me.username}
          walking
          from="left"
          compact
        />
        {state.partnerPresent && (
          <CliffCharacter
            avatar={state.partner.avatar}
            name={state.partner.firstName || state.partner.username}
            walking
            from="right"
            compact
          />
        )}
      </Box>
    </Box>
  );
};

export default CliffClimb;
