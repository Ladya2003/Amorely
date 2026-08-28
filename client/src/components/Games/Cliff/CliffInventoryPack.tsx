import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, useTheme } from '@mui/material';
import type { CliffGameState } from '../../../services/gamesService';
import { CLIFF_ASSETS, cliffBoulderImage } from './cliffAssets';
import CliffInventoryInfoModal, { type CliffInventoryTopic } from './CliffInventoryInfoModal';
import { getCliffChipButtonSx, getCliffHudRowSx, type CliffChipTone } from './cliffStyles';

type CliffInventoryPackProps = {
  state: CliffGameState;
  tone?: CliffChipTone;
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

const CliffInventoryPack: React.FC<CliffInventoryPackProps> = ({ state, tone = 'hud' }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const chip = getCliffChipButtonSx(theme, tone);
  const row = getCliffHudRowSx();
  const [topic, setTopic] = useState<CliffInventoryTopic | null>(null);
  const hasTools =
    state.inventory.hasIronPickaxe || state.inventory.hasCopperPickaxe || state.inventory.hasAxe;

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={row}>
          <Box component="button" type="button" onClick={() => setTopic('iron')} sx={chip}>
            <Box component="img" src={cliffBoulderImage('iron')} alt="" sx={oreIconSx} />
            {state.inventory.iron}
          </Box>
          <Box component="button" type="button" onClick={() => setTopic('copper')} sx={chip}>
            <Box component="img" src={cliffBoulderImage('copper')} alt="" sx={oreIconSx} />
            {state.inventory.copper}
          </Box>
        </Box>
        {hasTools && (
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
      </Box>
      {topic && <CliffInventoryInfoModal topic={topic} onClose={() => setTopic(null)} />}
    </>
  );
};

export default CliffInventoryPack;
