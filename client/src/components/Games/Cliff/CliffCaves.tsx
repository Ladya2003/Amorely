import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import type {
  CliffCaveItemId,
  CliffCaveResource,
  CliffGameState,
  CliffPublicCaveBoulder,
} from '../../../services/gamesService';
import { CLIFF_ASSETS, cliffCaveItemImage } from './cliffAssets';
import CliffCharacter from './CliffCharacter';
import CliffMine from './CliffMine';
import {
  getCliffCharacterSlotSx,
  getCliffHotspotBadgeSx,
  getCliffHotspotSx,
  getCliffHubBackdropSx,
  getCliffHubStageSx,
  getCliffModalGhostButtonSx,
  getCliffModalPrimaryButtonSx,
  getCliffParchmentPanelSx,
  getCliffSceneRootSx,
} from './cliffStyles';

type CliffCavesProps = {
  state: CliffGameState;
  showMine: boolean;
  activeBoulderId: string | null;
  breakAward: { amount: number; resource: CliffCaveResource } | null;
  projectedBoulders: CliffPublicCaveBoulder[];
  onOpenMine: () => void;
  onCloseMine: () => void;
  onSelectBoulder: (boulder: CliffPublicCaveBoulder) => void;
  onTapBoulder: () => void;
  onBreakDone: () => void;
  onCloseBoulder: () => void;
  onCraft: () => void;
  onGift: (itemId: CliffCaveItemId) => void;
  onOpenPassage: () => void;
  onNext: () => void;
};

const displayName = (user: CliffGameState['me']) => user.firstName || user.username || '';

const CliffCavePack: React.FC<{ state: CliffGameState }> = ({ state }) => {
  const items: CliffCaveItemId[] = [
    'iron',
    'quartz',
    'copper',
    'resin',
    'wick_cup',
    'lens_flask',
    'lamp_body',
    'lantern',
  ];
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {items.map((itemId) => {
        const count = state.caves.my[itemId];
        if (count <= 0) {
          return null;
        }
        return (
          <Box
            key={itemId}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 0.75,
              py: 0.3,
              borderRadius: 999,
              bgcolor: '#fff8ee',
              border: '1px solid rgba(139, 74, 43, 0.35)',
              color: '#5c2618',
              fontWeight: 800,
              fontSize: '0.75rem',
            }}
          >
            <Box component="img" src={cliffCaveItemImage(itemId)} alt="" sx={{ width: 20, height: 20 }} />
            {count}
          </Box>
        );
      })}
    </Box>
  );
};

const CliffCaves: React.FC<CliffCavesProps> = ({
  state,
  showMine,
  activeBoulderId,
  breakAward,
  projectedBoulders,
  onOpenMine,
  onCloseMine,
  onSelectBoulder,
  onTapBoulder,
  onBreakDone,
  onCloseBoulder,
  onCraft,
  onGift,
  onOpenPassage,
  onNext,
}) => {
  const { t } = useTranslation();
  const [showWindow, setShowWindow] = useState(false);
  const caves = state.caves;
  const myName = displayName(state.me) || t('games.common.you');

  const stepKey =
    caves.action === 'done' ? 'cleared' : `steps.${caves.step}.${caves.action}.${caves.role}`;

  if (showMine) {
    return (
      <CliffMine
        state={state}
        activeBoulderId={activeBoulderId}
        breakAward={breakAward}
        veins={projectedBoulders}
        onSelectVein={onSelectBoulder}
        onSelectBoulder={() => undefined}
        onTapBoulder={onTapBoulder}
        onBreakDone={onBreakDone}
        onCloseBoulder={onCloseBoulder}
        onClose={onCloseMine}
        title={t('games.cliff.caves.myMine')}
        pack={<CliffCavePack state={state} />}
        hideRefresh
      />
    );
  }

  return (
    <Box sx={getCliffSceneRootSx()}>
      <Box sx={getCliffHubBackdropSx()} aria-hidden>
        <Box component="img" src={CLIFF_ASSETS.cavesCorridor} alt="" />
      </Box>
      <Box sx={getCliffHubStageSx()}>
        <Box
          component="img"
          src={CLIFF_ASSETS.cavesCorridor}
          alt=""
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
        />

        <Box
          component="button"
          type="button"
          onClick={onOpenPassage}
          sx={{
            ...getCliffHotspotSx(),
            left: '29%',
            top: '15%',
            width: '44%',
            height: '32%',
            zIndex: 2,
          }}
          aria-label={t('games.cliff.caves.darkPassage')}
        >
          <Typography sx={{ ...getCliffHotspotBadgeSx(), mt: 'auto' }}>
            {t('games.cliff.caves.darkPassage')}
          </Typography>
        </Box>

        <Box
          component="button"
          type="button"
          onClick={() => {
            if (caves.cleared) {
              return;
            }
            setShowWindow(true);
          }}
          sx={{
            ...getCliffHotspotSx(),
            left: '5%',
            top: '28%',
            width: '16%',
            height: '34%',
            zIndex: 2,
          }}
          aria-label={t('games.cliff.caves.window')}
        >
          <Typography sx={{ ...getCliffHotspotBadgeSx(), mt: 'auto' }}>{t('games.cliff.caves.window')}</Typography>
        </Box>

        <Box
          component="button"
          type="button"
          onClick={onOpenMine}
          sx={{
            ...getCliffHotspotSx(),
            left: '62%',
            top: '36%',
            width: '40%',
            height: '38%',
            zIndex: 2,
          }}
          aria-label={t('games.cliff.caves.myMine')}
        >
          <Typography sx={{ ...getCliffHotspotBadgeSx(), mt: 'auto' }}>{t('games.cliff.caves.myMine')}</Typography>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '2%',
            height: '26%',
            overflow: 'visible',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          <Box sx={getCliffCharacterSlotSx('22%', true)}>
            <CliffCharacter
              avatar={state.me.avatar}
              name={myName}
              walking={false}
              from="left"
              compact
              motion="idle"
            />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          ...getCliffParchmentPanelSx(),
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#5c2618' }}>
          {caves.action === 'done'
            ? t('games.cliff.caves.cleared')
            : t('games.cliff.caves.step', { step: caves.step })}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6a3a24' }}>
          {caves.action === 'done' ? t('games.cliff.caves.hintDone') : t(`games.cliff.caves.${stepKey}`)}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
          {caves.canCraft && (
            <Button onClick={onCraft} sx={getCliffModalPrimaryButtonSx()}>
              {t('games.cliff.caves.craft')}
            </Button>
          )}
          {caves.canGift && (
            <Button onClick={() => setShowWindow(true)} sx={getCliffModalGhostButtonSx()}>
              {t('games.cliff.caves.gift')}
            </Button>
          )}
          {caves.cleared &&
            (state.partnerPresent ? (
              <Button onClick={onNext} sx={getCliffModalPrimaryButtonSx()}>
                {t('games.cliff.caves.next')}
              </Button>
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#8a3d28' }}>
                {t('games.cliff.waitPartner')}
              </Typography>
            ))}
        </Box>
      </Box>

      {showWindow && !caves.cleared && (
        <Box
          sx={{
            ...getCliffParchmentPanelSx(),
            bottom: 8,
            zIndex: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#5c2618' }}>
            {t('games.cliff.caves.giftPick')}
          </Typography>
          {caves.giftables.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#6a3a24' }}>
              {t('games.cliff.caves.nothingToGift')}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {caves.giftables.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => {
                    onGift(item.id);
                    setShowWindow(false);
                  }}
                  sx={{ ...getCliffModalGhostButtonSx(), minWidth: 0, px: 1.25 }}
                >
                  <Box component="img" src={cliffCaveItemImage(item.id)} alt="" sx={{ width: 22, height: 22, mr: 0.75 }} />
                  {t(`games.cliff.caves.items.${item.id}`)} · {item.count}
                </Button>
              ))}
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowWindow(false)} sx={getCliffModalGhostButtonSx()}>
              {t('games.common.close')}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CliffCaves;
