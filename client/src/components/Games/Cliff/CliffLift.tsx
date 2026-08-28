import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import type { CliffGameState } from '../../../services/gamesService';
import { playCliffLiftRiseSound } from '../../../utils/gameSounds';
import { CLIFF_ASSETS } from './cliffAssets';
import { dismissCliffHotspotHint, readCliffHotspotHints } from './cliffHotspotHint';
import {
  CLIFF_CHAR_ENTER_MS,
  CLIFF_CHAR_LEAVE_MS,
  CLIFF_CHAR_RECENTER_MS,
  CLIFF_LIFT_RISE_MS,
  getCliffCharacterSlotSx,
  getCliffHotspotBadgeSx,
  getCliffHotspotSx,
  getCliffHubBackdropSx,
  getCliffLiftPetSx,
  getCliffLiftStageSx,
  getCliffModalPrimaryButtonSx,
  getCliffParchmentPanelSx,
  getCliffSceneRootSx,
  type CliffCharacterMotion,
} from './cliffStyles';
import CliffCharacter from './CliffCharacter';

type PartnerMotion = CliffCharacterMotion | 'hidden';

type CliffLiftProps = {
  state: CliffGameState;
  onOpenPlate: () => void;
  onContinue: () => void;
};

const displayName = (user: CliffGameState['me']) => user.firstName || user.username || '';

const CliffLift: React.FC<CliffLiftProps> = ({ state, onOpenPlate, onContinue }) => {
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
  const [raisedView, setRaisedView] = useState(state.lift.raised);
  const [animateRise, setAnimateRise] = useState(false);
  const [petsArriving, setPetsArriving] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const showPartnerRef = useRef(false);
  const sawRaisedRef = useRef(state.lift.raised);

  const openPlate = () => {
    setHotspotHint((prev) => (prev.plate ? dismissCliffHotspotHint(state.userId, 'plate') : prev));
    onOpenPlate();
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

  useEffect(() => {
    if (!state.lift.raised || sawRaisedRef.current) {
      return undefined;
    }
    sawRaisedRef.current = true;
    setPetsArriving(true);
    setSpeech(t('games.cliff.lift.rising'));
    void playCliffLiftRiseSound();
    const riseId = window.setTimeout(() => {
      setAnimateRise(true);
      setRaisedView(true);
    }, 520);
    const speechId = window.setTimeout(() => setSpeech(null), 4200);
    const arriveId = window.setTimeout(() => setPetsArriving(false), CLIFF_CHAR_ENTER_MS);
    return () => {
      window.clearTimeout(riseId);
      window.clearTimeout(speechId);
      window.clearTimeout(arriveId);
    };
  }, [state.lift.raised, t]);

  useEffect(() => {
    if (!animateRise) {
      return undefined;
    }
    const id = window.setTimeout(() => setAnimateRise(false), CLIFF_LIFT_RISE_MS);
    return () => window.clearTimeout(id);
  }, [animateRise]);

  const standingPets = state.lift.standingPets;

  return (
    <Box sx={getCliffSceneRootSx()}>
      <Box sx={getCliffHubBackdropSx()} aria-hidden>
        <Box component="img" src={CLIFF_ASSETS.liftBg} alt="" />
      </Box>
      <Box sx={getCliffLiftStageSx(raisedView, animateRise)}>
        <Box
          component="img"
          src={CLIFF_ASSETS.liftBg}
          alt=""
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
        />

        <Box
          component="button"
          type="button"
          onClick={openPlate}
          sx={{ ...getCliffHotspotSx(hotspotHint.plate && !state.lift.raised), left: '22%', top: '58%', width: '23%', zIndex: 2 }}
          aria-label={t('games.cliff.lift.title')}
        >
          <Box component="img" src={CLIFF_ASSETS.pressurePlate} alt="" sx={{ width: '100%', height: 'auto' }} />
          <Typography sx={getCliffHotspotBadgeSx()}>{t('games.cliff.lift.badge')}</Typography>
        </Box>

        {standingPets.map((pet, index) => (
          <Box key={pet.id} sx={getCliffLiftPetSx(index, petsArriving)}>
            <Box component="img" src={pet.imageUrl} alt={pet.name} />
          </Box>
        ))}

        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '26%',
            height: '24%',
            overflow: 'visible',
            zIndex: 4,
            pointerEvents: 'none',
          }}
        >
          <Box sx={getCliffCharacterSlotSx(showPartner ? '42%' : '50%', slotReady)}>
            <CliffCharacter
              avatar={state.me.avatar}
              name={myName}
              walking={recentering}
              from="left"
              speech={speech}
              motion={myMotion}
            />
          </Box>
          {showPartner && partnerMotion !== 'hidden' && (
            <Box sx={getCliffCharacterSlotSx('58%', slotReady)}>
              <CliffCharacter
                avatar={partnerView?.avatar}
                name={partnerView?.name || partnerName}
                walking={false}
                from="right"
                motion={partnerMotion}
              />
            </Box>
          )}
        </Box>
      </Box>
      {raisedView && (
        <Box sx={getCliffParchmentPanelSx()}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#5c2618' }}>
            {t('games.cliff.lift.raised')}
          </Typography>
          <Button onClick={onContinue} sx={{ ...getCliffModalPrimaryButtonSx(), mt: 1 }}>
            {t('games.cliff.lift.next')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CliffLift;
