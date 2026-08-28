import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import type { CliffGameState } from '../../../services/gamesService';
import {
  playCliffHitSound,
  playCliffMissSound,
  playCliffRopeFallSound,
  playCliffRopeJumpSound,
  playCliffRopeSwingSound,
} from '../../../utils/gameSounds';
import { CLIFF_ASSETS } from './cliffAssets';
import CliffCharacter from './CliffCharacter';
import CliffRopeQte, { type CliffRopeQteHandle } from './CliffRopeQte';
import {
  CLIFF_ROPE_FALL_MS,
  CLIFF_ROPE_JUMP_MS,
  CLIFF_ROPE_QTE_TARGET_DEG,
  CLIFF_ROPE_QTE_TARGET_MIN_DEG,
  getCliffCharacterSlotSx,
  getCliffHotspotSx,
  getCliffHubBackdropSx,
  getCliffHubStageSx,
  getCliffModalPrimaryButtonSx,
  getCliffParchmentPanelSx,
  getCliffRopeFallSx,
  getCliffRopeHangSx,
  getCliffRopeJumpSx,
  getCliffRopeRiderSx,
  getCliffSceneRootSx,
} from './cliffStyles';

type RopePhase = 'idle' | 'swinging' | 'jumping' | 'falling';

type CliffRopesProps = {
  state: CliffGameState;
  onJump: (hit: boolean) => void;
};

const displayName = (user: CliffGameState['me']) => user.firstName || user.username || '';

const SEGMENT_ROPES: readonly number[][] = [
  [0, 1, 2],
  [3, 4, 5, 6, 7],
];

const ROPE_COL_PCT = 14;

const ledgeLeft = (index: number, segment: 0 | 1, together = false, side: 'me' | 'partner' = 'me'): string => {
  const pair = (left: string, right: string) => {
    if (!together) {
      return left;
    }
    return side === 'me' ? left : right;
  };
  if (segment === 0) {
    return index <= 0 ? pair('4%', '22%') : pair('64%', '80%');
  }
  return index <= 3 ? pair('4%', '22%') : pair('70%', '82%');
};

const ledgeCenter = (left: string, onFinish = false) => `calc(${left} + ${onFinish ? 8 : 14}%)`;

const ropeLeft = (rope: number): string => {
  switch (rope) {
    case 0:
      return '24%';
    case 1:
      return '42%';
    case 2:
      return '60%';
    case 3:
      return '18%';
    case 4:
      return '32%';
    case 5:
      return '46%';
    case 6:
      return '60%';
    case 7:
      return '74%';
    default:
      return '42%';
  }
};

const ropeCenter = (rope: number) => `calc(${ropeLeft(rope)} + ${ROPE_COL_PCT / 2}%)`;

const ropeQteTargetDeg = (index: number, total: number) => {
  const last = Math.max(1, total - 1);
  const progress = Math.min(1, Math.max(0, index / last));
  return CLIFF_ROPE_QTE_TARGET_DEG - (CLIFF_ROPE_QTE_TARGET_DEG - CLIFF_ROPE_QTE_TARGET_MIN_DEG) * progress;
};

const hangingOnRope = (index: number) => index >= 1 && index !== 3 && index < 8;
const ropeOfIndex = (index: number) => (hangingOnRope(index) ? index : null);
const segmentOf = (index: number): 0 | 1 => (index >= 3 ? 1 : 0);
const landsOnLedge = (index: number) => index === 3 || index >= 8;

type CliffHangingRopeProps = {
  swinging: boolean;
  hinted: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  rider: React.ReactNode;
};

const CliffHangingRope: React.FC<CliffHangingRopeProps> = ({
  swinging,
  hinted,
  disabled,
  onClick,
  label,
  rider,
}) => (
  <Box
    component="button"
    type="button"
    disabled={disabled}
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    aria-label={label}
    sx={{
      ...getCliffHotspotSx(hinted && !disabled),
      position: 'absolute',
      inset: 0,
      top: '-2%',
      height: '58%',
      zIndex: 3,
      alignItems: 'stretch',
      pointerEvents: disabled ? 'none' : 'auto',
    }}
  >
    <Box
      sx={{
        ...getCliffRopeHangSx(swinging),
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 48 220"
        sx={{
          position: 'relative',
          zIndex: 3,
          width: '72%',
          height: '100%',
          display: 'block',
          filter: 'drop-shadow(0 8px 10px rgba(40,16,12,0.35))',
        }}
      >
        <path
          d="M24 0 C22 28 26 52 23 78 C21 104 27 128 24 154 C22 176 26 196 24 214"
          fill="none"
          stroke="#6a3a22"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M24 0 C26 30 22 56 25 80 C27 106 21 130 24 156 C26 178 22 198 24 214"
          fill="none"
          stroke="#c48a4a"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <ellipse cx="24" cy="208" rx="9" ry="7" fill="#5a3018" />
        <ellipse cx="24" cy="206" rx="6.5" ry="4.5" fill="#d2a36a" />
      </Box>
      {rider}
    </Box>
  </Box>
);

const CliffRopes: React.FC<CliffRopesProps> = ({ state, onJump }) => {
  const { t } = useTranslation();
  const myName = displayName(state.me) || t('games.common.you');
  const partnerName = displayName(state.partner) || t('games.common.partner');
  const total = state.ropes.total;
  const checkpoint = state.ropes.checkpointIndex;

  const [viewIndex, setViewIndex] = useState(state.ropes.myIndex);
  const [phase, setPhase] = useState<RopePhase>('idle');
  const [activeRope, setActiveRope] = useState<number | null>(ropeOfIndex(state.ropes.myIndex));
  const [jumpFrom, setJumpFrom] = useState('8%');
  const [jumpTo, setJumpTo] = useState('8%');
  const [fallFrom, setFallFrom] = useState('8%');
  const [entered, setEntered] = useState(false);
  const [qteArmed, setQteArmed] = useState(false);
  const qteRef = useRef<CliffRopeQteHandle>(null);
  const busyRef = useRef(false);
  const pendingIndexRef = useRef<number | null>(null);
  const viewIndexRef = useRef(viewIndex);
  const phaseRef = useRef<RopePhase>('idle');
  const qteArmedRef = useRef(false);
  const activeRopeRef = useRef<number | null>(activeRope);
  const resolveAttemptRef = useRef<() => void>(() => undefined);
  viewIndexRef.current = viewIndex;
  phaseRef.current = phase;
  qteArmedRef.current = qteArmed;
  activeRopeRef.current = activeRope;

  const segment = segmentOf(viewIndex);
  const grabRope = viewIndex < total && !hangingOnRope(viewIndex) ? viewIndex : null;
  const ropes = SEGMENT_ROPES[segment];

  const armSwing = (rope: number) => {
    setActiveRope(rope);
    activeRopeRef.current = rope;
    setQteArmed(false);
    qteArmedRef.current = false;
    setPhase('swinging');
    void playCliffRopeSwingSound();
    window.setTimeout(() => {
      setQteArmed(true);
      qteArmedRef.current = true;
    }, 280);
  };

  useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (phase !== 'idle') {
      return;
    }
    if (pendingIndexRef.current !== null) {
      if (state.ropes.myIndex === pendingIndexRef.current) {
        pendingIndexRef.current = null;
      }
      return;
    }
    setViewIndex(state.ropes.myIndex);
    setActiveRope(ropeOfIndex(state.ropes.myIndex));
  }, [phase, state.ropes.myIndex]);

  useEffect(() => {
    if (phase !== 'idle' || busyRef.current || state.ropes.cleared) {
      return;
    }
    const rope = ropeOfIndex(viewIndex);
    if (rope === null) {
      return;
    }
    busyRef.current = true;
    armSwing(rope);
  }, [phase, state.ropes.cleared, viewIndex]);

  const startSwing = (rope: number) => {
    if (busyRef.current || phase !== 'idle' || grabRope !== rope || state.ropes.cleared) {
      return;
    }
    busyRef.current = true;
    armSwing(rope);
  };

  const resolveAttempt = () => {
    if (phaseRef.current !== 'swinging' || !qteArmedRef.current || !qteRef.current) {
      return;
    }
    const current = viewIndexRef.current;
    const currentSegment = segmentOf(current);
    const hit = qteRef.current.attempt();
    const from =
      activeRopeRef.current !== null
        ? ropeCenter(activeRopeRef.current)
        : ledgeCenter(ledgeLeft(current, currentSegment));
    setQteArmed(false);
    qteArmedRef.current = false;
    if (hit) {
      const next = Math.min(total, current + 1);
      const crossingToSecond = currentSegment === 0 && next === checkpoint;
      const nextSegment: 0 | 1 = segmentOf(next);
      pendingIndexRef.current = next;
      if (crossingToSecond) {
        setViewIndex(next);
        viewIndexRef.current = next;
      }
      const to = landsOnLedge(next)
        ? ledgeCenter(ledgeLeft(next, nextSegment), next >= total)
        : ropeCenter(next);
      setJumpFrom(crossingToSecond ? '-10%' : from);
      setJumpTo(to);
      setPhase('jumping');
      onJump(true);
      void playCliffHitSound();
      void playCliffRopeJumpSound();
      window.setTimeout(() => {
        setViewIndex(next);
        viewIndexRef.current = next;
        if (landsOnLedge(next) || next >= total) {
          setActiveRope(null);
          setPhase('idle');
          busyRef.current = false;
          return;
        }
        armSwing(next);
      }, CLIFF_ROPE_JUMP_MS);
      return;
    }

    const resetTo = current >= checkpoint ? checkpoint : 0;
    pendingIndexRef.current = resetTo;
    setFallFrom(from);
    setPhase('falling');
    onJump(false);
    void playCliffMissSound();
    void playCliffRopeFallSound();
    window.setTimeout(() => {
      setViewIndex(resetTo);
      viewIndexRef.current = resetTo;
      setActiveRope(null);
      setPhase('idle');
      busyRef.current = false;
    }, CLIFF_ROPE_FALL_MS);
  };
  resolveAttemptRef.current = resolveAttempt;

  useEffect(() => {
    if (phase !== 'swinging') {
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      resolveAttemptRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const partnerSegment = segmentOf(state.ropes.partnerIndex);
  const partnerRope = ropeOfIndex(state.ropes.partnerIndex);
  const showPartnerOnLedge =
    state.partnerPresent &&
    partnerRope === null &&
    (partnerSegment === segment || state.ropes.partnerIndex === 3);

  const speech = useMemo(() => {
    if (state.ropes.cleared) {
      return t('games.cliff.ropes.cleared');
    }
    if (viewIndex === checkpoint && phase === 'idle') {
      return t('games.cliff.ropes.checkpoint');
    }
    if (viewIndex === 0 && phase === 'idle') {
      return t('games.cliff.ropes.hint');
    }
    return null;
  }, [checkpoint, phase, state.ropes.cleared, t, viewIndex]);

  const standingOnLedge = phase === 'idle' && !hangingOnRope(viewIndex);
  const togetherOnLedge = showPartnerOnLedge;
  const sceneBg = segment === 1 ? CLIFF_ASSETS.ropesBg2 : CLIFF_ASSETS.ropesBg;
  const myOnFinish = viewIndex >= total;
  const partnerOnFinish = state.ropes.partnerIndex >= total;
  const finishSpeech = state.ropes.cleared ? speech : null;
  const characterSpeech = finishSpeech ? null : speech;
  const myLedgeLeft = ledgeLeft(viewIndex, segment, togetherOnLedge, 'me');
  const partnerLedgeLeft = ledgeLeft(
    state.ropes.partnerIndex === 3 ? 3 : state.ropes.partnerIndex,
    segment,
    togetherOnLedge,
    'partner'
  );
  const standSlotSx = (left: string, onFinish: boolean) => ({
    ...getCliffCharacterSlotSx(left, entered),
    bottom: onFinish ? { xs: '46%', sm: '48%' } : '28%',
    width: onFinish ? { xs: '18%', sm: '15%', md: '14%' } : { xs: '32%', sm: '26%', md: '28%' },
    display: 'flex',
    alignItems: 'flex-end',
  });

  return (
    <Box sx={getCliffSceneRootSx()}>
      <Box sx={getCliffHubBackdropSx()} aria-hidden>
        <Box component="img" src={sceneBg} alt="" />
      </Box>
      <Box sx={getCliffHubStageSx()}>
        <Box
          component="img"
          src={sceneBg}
          alt=""
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
        />

        {ropes.map((rope) => {
          const mineHere =
            (phase === 'swinging' && activeRope === rope) ||
            (phase === 'idle' && ropeOfIndex(viewIndex) === rope);
          const partnerHere =
            state.partnerPresent && partnerRope === rope && partnerSegment === segment;
          const riderSlot = mineHere && partnerHere ? 'split' : 'solo';
          return (
            <Box
              key={rope}
              sx={{ position: 'absolute', left: ropeLeft(rope), top: 0, width: `${ROPE_COL_PCT}%`, height: '100%' }}
            >
              <CliffHangingRope
                swinging={activeRope === rope && (phase === 'swinging' || phase === 'idle')}
                hinted={grabRope === rope && phase === 'idle'}
                disabled={phase !== 'idle' || grabRope !== rope}
                onClick={() => startSwing(rope)}
                label={t('games.cliff.ropes.badge')}
                rider={
                  <>
                    {mineHere && (
                      <Box sx={getCliffRopeRiderSx(riderSlot === 'split' ? 'left' : 'solo')}>
                        <CliffCharacter
                          avatar={state.me.avatar}
                          name={myName}
                          walking={false}
                          from="left"
                          compact
                          motion="idle"
                        />
                      </Box>
                    )}
                    {partnerHere && (
                      <Box sx={getCliffRopeRiderSx(riderSlot === 'split' ? 'right' : 'solo')}>
                        <CliffCharacter
                          avatar={state.partner.avatar}
                          name={partnerName}
                          walking={false}
                          from="right"
                          compact
                          motion="idle"
                        />
                      </Box>
                    )}
                  </>
                }
              />
            </Box>
          );
        })}

        {phase === 'jumping' && (
          <Box sx={getCliffRopeJumpSx(jumpFrom, jumpTo)}>
            <CliffCharacter avatar={state.me.avatar} name={myName} walking={false} from="left" compact motion="idle" />
          </Box>
        )}
        {phase === 'falling' && (
          <Box sx={getCliffRopeFallSx(fallFrom)}>
            <CliffCharacter avatar={state.me.avatar} name={myName} walking={false} from="left" compact motion="idle" />
          </Box>
        )}

        {(standingOnLedge || showPartnerOnLedge) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              overflow: 'visible',
              zIndex: 4,
              pointerEvents: 'none',
            }}
          >
            {standingOnLedge && (
              <Box sx={standSlotSx(myLedgeLeft, myOnFinish)}>
                <CliffCharacter
                  avatar={state.me.avatar}
                  name={myName}
                  walking={false}
                  from="left"
                  compact
                  speech={characterSpeech}
                  speechWide={Boolean(characterSpeech)}
                  speechBelow
                  motion={entered ? 'idle' : 'enter'}
                />
              </Box>
            )}
            {showPartnerOnLedge && (
              <Box sx={standSlotSx(partnerLedgeLeft, partnerOnFinish)}>
                <CliffCharacter
                  avatar={state.partner.avatar}
                  name={partnerName}
                  walking={false}
                  from="right"
                  compact
                  motion="idle"
                />
              </Box>
            )}
          </Box>
        )}

        {finishSpeech && (
          <Box
            sx={{
              position: 'absolute',
              left: 'auto',
              right: { xs: '3%', sm: '4%' },
              bottom: { xs: '30%', sm: '32%' },
              width: 'min(220px, 56%)',
              maxWidth: '56%',
              px: 1.25,
              py: 0.75,
              boxSizing: 'border-box',
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: 1,
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
              {finishSpeech}
            </Typography>
          </Box>
        )}

        {phase === 'swinging' && (
          <CliffRopeQte
            key={`${viewIndex}-${activeRope}`}
            ref={qteRef}
            label={t('games.cliff.ropes.jump')}
            targetDeg={ropeQteTargetDeg(viewIndex, total)}
            onJump={resolveAttempt}
          />
        )}
      </Box>

      <Box
        sx={{
          ...getCliffParchmentPanelSx(),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#5c2618', minWidth: 0 }}>
          {t('games.cliff.ropes.progress', {
            current: state.ropes.myIndex,
            total,
            partnerCurrent: state.ropes.partnerIndex,
          })}
        </Typography>
        {state.ropes.cleared && (
          <Button
            onClick={() => undefined}
            sx={{ ...getCliffModalPrimaryButtonSx(), flexShrink: 0, py: 0.75, ml: 'auto' }}
          >
            {t('games.cliff.ropes.next')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default CliffRopes;
