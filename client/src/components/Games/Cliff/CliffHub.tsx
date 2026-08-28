import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import type { CliffGameState } from '../../../services/gamesService';
import { CLIFF_ASSETS } from './cliffAssets';
import { dismissCliffHotspotHint, readCliffHotspotHints, type CliffHubHotspot } from './cliffHotspotHint';
import {
  CLIFF_CHAR_ENTER_MS,
  CLIFF_CHAR_LEAVE_MS,
  CLIFF_CHAR_RECENTER_MS,
  getCliffCharacterSlotSx,
  getCliffHotspotBadgeSx,
  getCliffHotspotSx,
  getCliffHubBackdropSx,
  getCliffHubStageSx,
  getCliffSceneRootSx,
  type CliffCharacterMotion,
} from './cliffStyles';
import CliffCharacter from './CliffCharacter';

type PartnerMotion = CliffCharacterMotion | 'hidden';

type CliffHubProps = {
  state: CliffGameState;
  myWalking: boolean;
  partnerWalking: boolean;
  mySpeech: string | null;
  partnerSpeech: string | null;
  onOpenShop: () => void;
  onOpenMine: () => void;
  onOpenGate: () => void;
};

const displayName = (user: CliffGameState['me']) =>
  user.firstName || user.username || '';

const CliffHub: React.FC<CliffHubProps> = ({
  state,
  myWalking,
  partnerWalking,
  mySpeech,
  partnerSpeech,
  onOpenShop,
  onOpenMine,
  onOpenGate,
}) => {
  const { t } = useTranslation();
  const myName = displayName(state.me) || t('games.common.you');
  const partnerName = displayName(state.partner) || t('games.common.partner');

  const [myMotion, setMyMotion] = useState<CliffCharacterMotion>('enter');
  const [partnerMotion, setPartnerMotion] = useState<PartnerMotion>(() =>
    state.partnerPresent ? 'enter' : 'hidden'
  );
  const [partnerView, setPartnerView] = useState<{ avatar?: string; name: string } | null>(() =>
    state.partnerPresent ? { avatar: state.partner.avatar, name: partnerName } : null
  );
  const [slotReady, setSlotReady] = useState(false);
  const [recentering, setRecentering] = useState(false);
  const [hotspotHint, setHotspotHint] = useState(() => readCliffHotspotHints(state.userId));
  const showPartnerRef = useRef(false);

  const openHotspot = (id: CliffHubHotspot, open: () => void) => {
    setHotspotHint((prev) => (prev[id] ? dismissCliffHotspotHint(state.userId, id) : prev));
    open();
  };

  useEffect(() => {
    const id = window.setTimeout(() => setMyMotion('idle'), CLIFF_CHAR_ENTER_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (state.partnerPresent) {
      setPartnerView({ avatar: state.partner.avatar, name: partnerName });
      setPartnerMotion((prev) => (prev === 'idle' || prev === 'enter' ? prev : 'enter'));
      return;
    }
    const id = window.setTimeout(() => {
      setPartnerMotion((prev) => (prev === 'hidden' ? 'hidden' : 'leave'));
    }, 450);
    return () => window.clearTimeout(id);
  }, [partnerName, state.partner.avatar, state.partnerPresent]);

  useEffect(() => {
    if (partnerMotion !== 'enter') {
      return;
    }
    const id = window.setTimeout(() => setPartnerMotion('idle'), CLIFF_CHAR_ENTER_MS);
    return () => window.clearTimeout(id);
  }, [partnerMotion]);

  useEffect(() => {
    if (partnerMotion !== 'leave') {
      return;
    }
    const id = window.setTimeout(() => {
      setPartnerMotion('hidden');
      setPartnerView(null);
    }, CLIFF_CHAR_LEAVE_MS);
    return () => window.clearTimeout(id);
  }, [partnerMotion]);

  const showPartner = Boolean(partnerView && partnerMotion !== 'hidden');

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setSlotReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (showPartnerRef.current === showPartner) {
      return;
    }
    const shouldWalk = slotReady && showPartnerRef.current !== showPartner;
    showPartnerRef.current = showPartner;
    if (!shouldWalk) {
      return;
    }
    setRecentering(true);
    const id = window.setTimeout(() => setRecentering(false), CLIFF_CHAR_RECENTER_MS);
    return () => window.clearTimeout(id);
  }, [showPartner, slotReady]);

  return (
    <Box sx={getCliffSceneRootSx()}>
      <Box sx={getCliffHubBackdropSx()} aria-hidden>
        <Box component="img" src={CLIFF_ASSETS.hubBg} alt="" />
      </Box>
      <Box sx={getCliffHubStageSx()}>
        <Box
          component="img"
          src={CLIFF_ASSETS.hubBg}
          alt=""
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
        />

        <Box
          component="button"
          type="button"
          onClick={() => openHotspot('shop', onOpenShop)}
          sx={{ ...getCliffHotspotSx(hotspotHint.shop), left: '2%', top: '67%', width: '31%', zIndex: 1 }}
          aria-label={t('games.cliff.shop.title')}
        >
          <Box component="img" src={CLIFF_ASSETS.shopStall} alt="" sx={{ width: '100%', height: 'auto' }} />
          <Typography sx={getCliffHotspotBadgeSx()}>{t('games.cliff.shop.badge')}</Typography>
        </Box>

        <Box
          component="button"
          type="button"
          onClick={() => openHotspot('mine', onOpenMine)}
          sx={{ ...getCliffHotspotSx(hotspotHint.mine), left: '70%', top: '70%', width: '26%' }}
          aria-label={t('games.cliff.mine.title')}
        >
          <Box component="img" src={CLIFF_ASSETS.mineEntrance} alt="" sx={{ width: '100%', height: 'auto' }} />
          <Typography sx={getCliffHotspotBadgeSx()}>{t('games.cliff.mine.badge')}</Typography>
        </Box>

        <Box
          component="button"
          type="button"
          onClick={() => openHotspot('gate', onOpenGate)}
          sx={{ ...getCliffHotspotSx(hotspotHint.gate), left: '23%', top: '58%', width: '26%', zIndex: 0 }}
          aria-label={t('games.cliff.gate.title')}
        >
          <Box
            component="img"
            src={state.gateDestroyed ? CLIFF_ASSETS.bridgeRepaired : CLIFF_ASSETS.gateClosed}
            alt=""
            sx={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
          <Typography sx={getCliffHotspotBadgeSx()}>{t('games.cliff.gate.badge')}</Typography>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '2.5%',
            height: '28%',
            overflow: 'visible',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <Box sx={getCliffCharacterSlotSx(showPartner ? '25%' : '39%', slotReady)}>
            <CliffCharacter
              avatar={state.me.avatar}
              name={myName}
              walking={myWalking || recentering}
              from="left"
              speech={mySpeech}
              motion={myMotion}
            />
          </Box>
          {showPartner && partnerMotion !== 'hidden' && (
            <Box sx={getCliffCharacterSlotSx('53%', slotReady)}>
              <CliffCharacter
                avatar={partnerView?.avatar}
                name={partnerView?.name || partnerName}
                walking={partnerWalking}
                from="right"
                speech={partnerSpeech}
                motion={partnerMotion}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CliffHub;
