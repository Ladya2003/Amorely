import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, useTheme } from '@mui/material';
import CurrencyBadge from '../../Pets/CurrencyBadge';
import type { CliffGameState } from '../../../services/gamesService';
import { CLIFF_ASSETS, cliffBoulderImage } from './cliffAssets';
import CliffInventoryInfoModal, { type CliffInventoryTopic } from './CliffInventoryInfoModal';
import {
  formatCliffTime,
  getCliffChipButtonSx,
  getCliffHudIconButtonSx,
  getCliffHudRowSx,
  getCliffHudSx,
} from './cliffStyles';

type CliffInventoryBarProps = {
  state: CliffGameState;
  elapsedMs: number;
  resettingGate?: boolean;
  resettingRopes?: boolean;
  resettingBalls?: boolean;
  onResetGate: () => void;
  onResetRopes: () => void;
  onResetBalls: () => void;
};

const oreIconSx = {
  width: 22,
  height: 22,
  objectFit: 'contain' as const,
};

const toolIconSx = {
  width: 28,
  height: 28,
  objectFit: 'contain' as const,
};

const CliffInventoryBar: React.FC<CliffInventoryBarProps> = ({
  state,
  elapsedMs,
  resettingGate = false,
  resettingRopes = false,
  resettingBalls = false,
  onResetGate,
  onResetRopes,
  onResetBalls,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const chip = getCliffChipButtonSx(theme);
  const row = getCliffHudRowSx();
  const iconButton = getCliffHudIconButtonSx();
  const [topic, setTopic] = useState<CliffInventoryTopic | null>(null);

  return (
    <>
      <Box sx={getCliffHudSx(theme)}>
        <Box sx={getCliffHudRowSx('between')}>
          <Box sx={row}>
            <Box
              component="button"
              type="button"
              onClick={() => setTopic('coins')}
              aria-label={t('games.cliff.inventory.coins.title')}
              sx={{ ...iconButton, display: 'inline-flex' }}
            >
              <CurrencyBadge balance={state.amoreCoins} size="small" showGuideOnClick={false} />
            </Box>
            <Box component="button" type="button" onClick={() => setTopic('iron')} sx={chip}>
              <Box component="img" src={cliffBoulderImage('iron')} alt="" sx={oreIconSx} />
              {state.inventory.iron}
            </Box>
            <Box component="button" type="button" onClick={() => setTopic('copper')} sx={chip}>
              <Box component="img" src={cliffBoulderImage('copper')} alt="" sx={oreIconSx} />
              {state.inventory.copper}
            </Box>
          </Box>
          <Box sx={row}>
            <Box component="button" type="button" onClick={() => setTopic('altitude')} sx={chip}>
              <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 800 }}>
                {state.altitudeM}m
              </Typography>
            </Box>
            <Box component="button" type="button" onClick={() => setTopic('time')} sx={chip}>
              {formatCliffTime(elapsedMs)}
            </Box>
          </Box>
        </Box>
        {(state.inventory.hasIronPickaxe || state.inventory.hasCopperPickaxe || state.inventory.hasAxe) && (
          <Box sx={row}>
            {state.inventory.hasIronPickaxe && (
              <Box
                component="button"
                type="button"
                onClick={() => setTopic('ironPickaxe')}
                aria-label={t('games.cliff.inventory.ironPickaxe.title')}
                sx={chip}
              >
                <Box component="img" src={CLIFF_ASSETS.pickaxeIron} alt="" sx={toolIconSx} />
              </Box>
            )}
            {state.inventory.hasCopperPickaxe && (
              <Box
                component="button"
                type="button"
                onClick={() => setTopic('copperPickaxe')}
                aria-label={t('games.cliff.inventory.copperPickaxe.title')}
                sx={chip}
              >
                <Box component="img" src={CLIFF_ASSETS.pickaxeCopper} alt="" sx={toolIconSx} />
              </Box>
            )}
            {state.inventory.hasAxe && (
              <Box
                component="button"
                type="button"
                onClick={() => setTopic('axe')}
                aria-label={t('games.cliff.inventory.axe.title')}
                sx={chip}
              >
                <Box component="img" src={CLIFF_ASSETS.axe} alt="" sx={toolIconSx} />
              </Box>
            )}
          </Box>
        )}
        <Box sx={{ ...row, flexWrap: 'wrap' }}>
          <Box
            component="button"
            type="button"
            disabled={resettingGate}
            onClick={onResetGate}
            sx={{ ...chip, opacity: resettingGate ? 0.6 : 1 }}
          >
            {t('games.cliff.inventory.resetGate')}
          </Box>
          <Box
            component="button"
            type="button"
            disabled={resettingRopes}
            onClick={onResetRopes}
            sx={{ ...chip, opacity: resettingRopes ? 0.6 : 1 }}
          >
            {t('games.cliff.inventory.resetRopes')}
          </Box>
          <Box
            component="button"
            type="button"
            disabled={resettingBalls}
            onClick={onResetBalls}
            sx={{ ...chip, opacity: resettingBalls ? 0.6 : 1 }}
          >
            {t('games.cliff.inventory.resetBalls')}
          </Box>
        </Box>
      </Box>
      {topic && <CliffInventoryInfoModal topic={topic} onClose={() => setTopic(null)} />}
    </>
  );
};

export default CliffInventoryBar;
