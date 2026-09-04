import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography, useTheme } from '@mui/material';
import CurrencyBadge from '../../Pets/CurrencyBadge';
import type { CliffCaveItemId, CliffGameState } from '../../../services/gamesService';
import { CLIFF_ASSETS, cliffBoulderImage, cliffCaveItemImage } from './cliffAssets';
import CliffInventoryInfoModal, { type CliffInventoryTopic } from './CliffInventoryInfoModal';
import CliffModalFrame from './CliffModalFrame';
import {
  formatCliffTime,
  getCliffChipButtonSx,
  getCliffChipSx,
  getCliffHudIconButtonSx,
  getCliffHudRowSx,
  getCliffHudSx,
  getCliffModalBodySx,
  getCliffModalGhostButtonSx,
} from './cliffStyles';

type CliffInventoryBarProps = {
  state: CliffGameState;
  elapsedMs: number;
  resettingGate?: boolean;
  resettingRopes?: boolean;
  resettingBalls?: boolean;
  resettingCaves?: boolean;
  resettingGuides?: boolean;
  onResetGate: () => void;
  onResetRopes: () => void;
  onResetBalls: () => void;
  onResetCaves: () => void;
  onResetGuides: () => void;
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

const ballsChipSx = {
  px: 1.15,
  py: 0.55,
  fontSize: '0.9rem',
  gap: 0.65,
};

const CliffInventoryBar: React.FC<CliffInventoryBarProps> = ({
  state,
  elapsedMs,
  resettingGate = false,
  resettingRopes = false,
  resettingBalls = false,
  resettingCaves = false,
  resettingGuides = false,
  onResetGate,
  onResetRopes,
  onResetBalls,
  onResetCaves,
  onResetGuides,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const chip = getCliffChipButtonSx(theme);
  const row = getCliffHudRowSx();
  const iconButton = getCliffHudIconButtonSx();
  const [topic, setTopic] = useState<CliffInventoryTopic | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const resetting = resettingGate || resettingRopes || resettingBalls || resettingCaves || resettingGuides;

  const runReset = (reset: () => void) => {
    setTestOpen(false);
    reset();
  };

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
            {state.scene !== 'caves' && state.scene !== 'guides' && (
              <>
                <Box component="button" type="button" onClick={() => setTopic('iron')} sx={chip}>
                  <Box component="img" src={cliffBoulderImage('iron')} alt="" sx={oreIconSx} />
                  {state.inventory.iron}
                </Box>
                <Box component="button" type="button" onClick={() => setTopic('copper')} sx={chip}>
                  <Box component="img" src={cliffBoulderImage('copper')} alt="" sx={oreIconSx} />
                  {state.inventory.copper}
                </Box>
              </>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
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
            <Box
              component="button"
              type="button"
              onClick={() => setTestOpen(true)}
              sx={chip}
            >
              {t('games.cliff.inventory.test')}
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
        {state.scene === 'caves' && (
          <Box sx={{ ...row, flexWrap: 'wrap' }}>
            {(
              [
                ['iron', 'iron'],
                ['quartz', 'quartz'],
                ['copper', 'copper'],
                ['resin', 'resin'],
                ['wick_cup', 'wickCup'],
                ['lens_flask', 'lensFlask'],
                ['lamp_body', 'lampBody'],
                ['lantern', 'lantern'],
              ] as Array<[CliffCaveItemId, CliffInventoryTopic]>
            )
              .filter(([itemId]) => state.caves.my[itemId] > 0)
              .map(([itemId, topicId]) => (
                <Box
                  key={itemId}
                  component="button"
                  type="button"
                  onClick={() => setTopic(topicId)}
                  sx={chip}
                >
                  <Box component="img" src={cliffCaveItemImage(itemId)} alt="" sx={oreIconSx} />
                  {state.caves.my[itemId]}
                </Box>
              ))}
          </Box>
        )}
        {state.scene === 'balls' && (
          <Box sx={row}>
            <Box sx={{ ...getCliffChipSx(theme, 'parchment'), ...ballsChipSx }}>
              {t('games.cliff.balls.scoreYou', { score: state.balls.myScore })}
              <Box component="span" sx={{ opacity: 0.4 }}>·</Box>
              {t('games.cliff.balls.ballsLeft', {
                balls: state.balls.each - state.balls.myRemaining,
                each: state.balls.each,
              })}
            </Box>
            <Box sx={{ ...getCliffChipSx(theme, 'parchment'), ...ballsChipSx }}>
              {t('games.cliff.balls.scorePartner', { score: state.balls.partnerScore })}
              <Box component="span" sx={{ opacity: 0.4 }}>·</Box>
              {t('games.cliff.balls.ballsLeft', {
                balls: state.balls.each - state.balls.partnerRemaining,
                each: state.balls.each,
              })}
            </Box>
            <Box sx={{ ...getCliffChipSx(theme, 'parchment'), ...ballsChipSx }}>
              {t('games.cliff.balls.scoreTogether', { score: state.balls.pairScore })}
              <Box component="span" sx={{ opacity: 0.4 }}>/</Box>
              {state.balls.threshold}
            </Box>
          </Box>
        )}
      </Box>
      {topic && <CliffInventoryInfoModal topic={topic} onClose={() => setTopic(null)} />}
      {testOpen &&
        createPortal(
          <CliffModalFrame
            title={t('games.cliff.inventory.testTitle')}
            zIndex={20}
            pinned="fixed"
            actions={
              <Button onClick={() => setTestOpen(false)} sx={getCliffModalGhostButtonSx()}>
                {t('games.common.close')}
              </Button>
            }
          >
            <Typography variant="body2" sx={getCliffModalBodySx()}>
              {t('games.cliff.inventory.testHint')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1, mt: 1.5 }}>
              <Button
                disabled={resetting}
                onClick={() => runReset(onResetGate)}
                sx={getCliffModalGhostButtonSx()}
              >
                {t('games.cliff.inventory.resetGate')}
              </Button>
              <Button
                disabled={resetting}
                onClick={() => runReset(onResetRopes)}
                sx={getCliffModalGhostButtonSx()}
              >
                {t('games.cliff.inventory.resetRopes')}
              </Button>
              <Button
                disabled={resetting}
                onClick={() => runReset(onResetBalls)}
                sx={getCliffModalGhostButtonSx()}
              >
                {t('games.cliff.inventory.resetBalls')}
              </Button>
              <Button
                disabled={resetting}
                onClick={() => runReset(onResetCaves)}
                sx={getCliffModalGhostButtonSx()}
              >
                {t('games.cliff.inventory.resetCaves')}
              </Button>
              <Button
                disabled={resetting}
                onClick={() => runReset(onResetGuides)}
                sx={getCliffModalGhostButtonSx()}
              >
                {t('games.cliff.inventory.resetGuides')}
              </Button>
            </Box>
          </CliffModalFrame>,
          document.body
        )}
    </>
  );
};

export default CliffInventoryBar;
