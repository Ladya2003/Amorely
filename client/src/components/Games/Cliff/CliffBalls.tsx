import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import type { CliffGameState } from '../../../services/gamesService';
import { playCliffHitSound, playCliffMissSound, playCliffThrowSound } from '../../../utils/gameSounds';
import { CLIFF_ASSETS } from './cliffAssets';
import CliffCharacter from './CliffCharacter';
import {
  getCliffBridgePowerFillSx,
  getCliffBridgePowerTrackSx,
  getCliffBridgePowerWrapSx,
  getCliffHubBackdropSx,
  getCliffHubStageSx,
  getCliffModalGhostButtonSx,
  getCliffModalPrimaryButtonSx,
  getCliffParchmentPanelSx,
  getCliffSceneRootSx,
} from './cliffStyles';

type BallPhase = 'briefing' | 'aiming' | 'flying' | 'settled' | 'cleared' | 'failed';

type WorldPuck = {
  id: number;
  owner: 'me' | 'partner';
  x: number;
  y: number;
  vx: number;
  vy: number;
  settled: boolean;
  zoneScore: number | null;
};

type CliffBallsProps = {
  state: CliffGameState;
  onThrow: (zoneScore: number) => void;
  onRetry: () => void;
  onNext: () => void;
};

const VIEW = 0.33;
const START_Y = 0.075;
const BOARD_LEFT = 0.31;
const BOARD_WIDTH = 0.38;
const LANE_INSET = 0.12;
const MAX_AIM = Math.PI * 0.16;
const MIN_POWER = 0.16;
const DEFAULT_POWER = 0.62;
const SPEED = 0.021;
const FRICTION = 0.983;
const STOP_V = 0.00055;
const SIDE_BOUNCE = 0.42;
const ROLL_MS_MIN = 1000;
const ROLL_MS_MAX = 2000;
const AIM_PREVIEW_STEPS = 14;
const CHARGE_RADIANS_PER_FRAME = 0.03;
const CAMERA_LERP = 0.08;
const BG_SCALE = 1.72;
const BG_PARALLAX = 0.72;

const ZONE_BANDS: ReadonlyArray<{ score: 10 | 20 | 30 | 40; start: number; end: number; fill: string }> = [
  { score: 10, start: 0.5, end: 0.62, fill: 'rgba(86, 150, 78, 0.34)' },
  { score: 20, start: 0.62, end: 0.74, fill: 'rgba(62, 140, 168, 0.34)' },
  { score: 30, start: 0.74, end: 0.86, fill: 'rgba(214, 154, 52, 0.36)' },
  { score: 40, start: 0.86, end: 0.97, fill: 'rgba(196, 78, 58, 0.36)' },
];

const VALID_ZONE_SCORES: ReadonlyArray<number> = [0, 10, 20, 30, 40];

const displayName = (user: CliffGameState['me']) => user.firstName || user.username || '';

const randomStartX = () => 0.18 + Math.random() * 0.64;

const clampAim = (angle: number) => Math.min(MAX_AIM, Math.max(-MAX_AIM, angle));

const zoneScoreAt = (x: number, y: number): number => {
  if (x < LANE_INSET || x > 1 - LANE_INSET) {
    return 0;
  }
  const band = ZONE_BANDS.find((item) => y >= item.start && y < item.end);
  return band?.score ?? 0;
};

const zoneTargetY = (score: number) => {
  const band = ZONE_BANDS.find((item) => item.score === score);
  if (!band) {
    return Math.random() < 0.75 ? 0.4 + Math.random() * 0.08 : 0.985;
  }
  return band.start + (band.end - band.start) * (0.25 + Math.random() * 0.5);
};

const projectAim = (originX: number, originY: number, aim: number, power: number, count: number) => {
  const points: Array<{ x: number; y: number }> = [];
  let x = originX;
  let y = originY;
  let vx = Math.sin(aim) * power * SPEED;
  let vy = Math.cos(aim) * power * SPEED;
  for (let i = 0; i < count; i += 1) {
    x += vx;
    y += vy;
    vx *= FRICTION;
    vy *= FRICTION;
    if (x < 0) {
      x = 0;
      vx *= -SIDE_BOUNCE;
    } else if (x > 1) {
      x = 1;
      vx *= -SIDE_BOUNCE;
    }
    points.push({ x, y });
    if (y > 1.05 || Math.hypot(vx, vy) < STOP_V) {
      break;
    }
  }
  return points;
};

const puckFill = (owner: 'me' | 'partner') =>
  owner === 'me'
    ? 'radial-gradient(circle at 30% 28%, #fff2d2 0%, #d2a24a 42%, #7a4318 100%)'
    : 'radial-gradient(circle at 30% 28%, #ffe4ea 0%, #c46a78 46%, #6a2434 100%)';

const CliffBalls: React.FC<CliffBallsProps> = ({ state, onThrow, onRetry, onNext }) => {
  const { t } = useTranslation();
  const areaRef = useRef<HTMLDivElement | null>(null);
  const throwLockRef = useRef(false);
  const chargePhaseRef = useRef(0);
  const rollStartedAtRef = useRef(0);
  const onThrowRef = useRef(onThrow);
  onThrowRef.current = onThrow;
  const balls = state.balls;
  const started = balls.myRemaining < balls.each || balls.myScore > 0;
  const [phase, setPhase] = useState<BallPhase>(() => {
    if (balls.cleared) {
      return 'cleared';
    }
    if (balls.canRetry) {
      return 'failed';
    }
    return started ? 'aiming' : 'briefing';
  });
  const [aim, setAim] = useState(0);
  const [power, setPower] = useState(DEFAULT_POWER);
  const [startX, setStartX] = useState(randomStartX);
  const [myPuck, setMyPuck] = useState<WorldPuck | null>(null);
  const [restPucks, setRestPucks] = useState<WorldPuck[]>([]);
  const [partnerPucks, setPartnerPucks] = useState<WorldPuck[]>([]);
  const [camTop, setCamTop] = useState(0);
  const [lastZone, setLastZone] = useState<number | null>(null);
  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });

  const myName = displayName(state.me) || t('games.common.you');
  const partnerName = displayName(state.partner) || t('games.common.partner');
  const showPartner = state.partnerPresent;
  const playable = phase === 'aiming' && balls.myRemaining > 0 && !balls.cleared && !balls.canRetry;
  const puckSize = Math.max(16, areaSize.width * 0.045);

  const myPuckRef = useRef(myPuck);
  myPuckRef.current = myPuck;
  const camTopRef = useRef(camTop);
  camTopRef.current = camTop;
  const partnerTrackRef = useRef({ remaining: balls.partnerRemaining, score: balls.partnerScore });

  useEffect(() => {
    setPhase((current) => {
      if (current === 'flying' || current === 'briefing' || current === 'settled') {
        return current;
      }
      if (balls.cleared) {
        return 'cleared';
      }
      if (balls.canRetry) {
        return 'failed';
      }
      return current;
    });
  }, [balls.canRetry, balls.cleared]);

  useEffect(() => {
    const node = areaRef.current;
    if (!node) {
      return undefined;
    }
    const update = () => {
      const rect = node.getBoundingClientRect();
      setAreaSize({ width: rect.width, height: rect.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const prev = partnerTrackRef.current;
    partnerTrackRef.current = { remaining: balls.partnerRemaining, score: balls.partnerScore };
    if (balls.partnerRemaining >= prev.remaining) {
      return undefined;
    }
    const zoneScore = Math.max(0, balls.partnerScore - prev.score);
    const safeScore = VALID_ZONE_SCORES.includes(zoneScore) ? zoneScore : 0;
    const id = Date.now();
    const fromX = randomStartX();
    const fromY = START_Y;
    const targetX = 0.16 + Math.random() * 0.68;
    const targetY = zoneTargetY(safeScore);
    setPartnerPucks((current) => [
      ...current.slice(-4),
      {
        id,
        owner: 'partner',
        x: fromX,
        y: fromY,
        vx: 0,
        vy: 0,
        settled: false,
        zoneScore: safeScore,
      },
    ]);
    const startedAt = performance.now();
    const duration = ROLL_MS_MIN + Math.random() * (ROLL_MS_MAX - ROLL_MS_MIN);
    let frame = 0;
    let cancelled = false;
    const tick = (now: number) => {
      if (cancelled) {
        return;
      }
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      const settled = t >= 1;
      setPartnerPucks((current) =>
        current.map((puck) =>
          puck.id === id
            ? {
                ...puck,
                x: fromX + (targetX - fromX) * eased,
                y: fromY + (targetY - fromY) * eased,
                settled,
                zoneScore: safeScore,
              }
            : puck
        )
      );
      if (!settled) {
        frame = window.requestAnimationFrame(tick);
      }
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [balls.partnerRemaining, balls.partnerScore]);

  const flyingId = myPuck && !myPuck.settled ? myPuck.id : null;

  useEffect(() => {
    if (flyingId === null) {
      return undefined;
    }
    let frame = 0;
    const step = () => {
      const current = myPuckRef.current;
      if (!current || current.settled) {
        return;
      }
      let { x, y, vx, vy } = current;
      x += vx;
      y += vy;
      vx *= FRICTION;
      vy *= FRICTION;
      if (x < 0) {
        x = 0;
        vx *= -SIDE_BOUNCE;
      } else if (x > 1) {
        x = 1;
        vx *= -SIDE_BOUNCE;
      }
      const rolledMs = performance.now() - rollStartedAtRef.current;
      const stopped =
        (rolledMs >= ROLL_MS_MIN && Math.hypot(vx, vy) < STOP_V) ||
        rolledMs >= ROLL_MS_MAX ||
        y < 0 ||
        y > 1.04;
      if (stopped) {
        const zoneScore = zoneScoreAt(x, y);
        const settled: WorldPuck = {
          ...current,
          x: Math.min(Math.max(x, 0), 1),
          y: Math.min(Math.max(y, 0), 1.02),
          vx: 0,
          vy: 0,
          settled: true,
          zoneScore,
        };
        myPuckRef.current = settled;
        setMyPuck(settled);
        setLastZone(zoneScore);
        throwLockRef.current = false;
        if (zoneScore > 0) {
          void playCliffHitSound();
        } else {
          void playCliffMissSound();
        }
        onThrowRef.current(zoneScore);
        setPhase('settled');
        return;
      }
      const next: WorldPuck = { ...current, x, y, vx, vy };
      myPuckRef.current = next;
      setMyPuck(next);
      frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [flyingId]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const follow =
        (phase === 'flying' || phase === 'settled') && myPuckRef.current
          ? myPuckRef.current.y
          : START_Y;
      const target = Math.min(Math.max(follow - VIEW * 0.42, 0), 1 - VIEW);
      const next = camTopRef.current + (target - camTopRef.current) * CAMERA_LERP;
      camTopRef.current = Math.abs(next - target) < 0.001 ? target : next;
      setCamTop(camTopRef.current);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'aiming') {
      return undefined;
    }
    let frame = 0;
    const tick = () => {
      chargePhaseRef.current += CHARGE_RADIANS_PER_FRAME;
      const wave = (Math.sin(chargePhaseRef.current) + 1) / 2;
      setPower(MIN_POWER + (1 - MIN_POWER) * wave);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  const preview = useMemo(() => {
    if (!playable) {
      return [] as Array<{ x: number; y: number }>;
    }
    return projectAim(startX, START_Y, aim, power, AIM_PREVIEW_STEPS);
  }, [aim, playable, power, startX]);

  const worldToLeft = (x: number) => `${BOARD_LEFT * 100 + x * BOARD_WIDTH * 100}%`;
  const worldToBottom = (y: number) => `${y * 100}%`;

  const pointerToWorld = (clientX: number, clientY: number) => {
    const node = areaRef.current;
    if (!node) {
      return null;
    }
    const rect = node.getBoundingClientRect();
    const worldY = camTopRef.current + ((rect.bottom - clientY) / Math.max(rect.height, 1)) * VIEW;
    const worldX = (clientX - rect.left) / Math.max(rect.width, 1);
    const boardX = (worldX - BOARD_LEFT) / BOARD_WIDTH;
    return { x: boardX, y: worldY };
  };

  const aimFromPointer = (clientX: number, clientY: number) => {
    if (phase !== 'aiming') {
      return;
    }
    const world = pointerToWorld(clientX, clientY);
    if (!world) {
      return;
    }
    setAim(clampAim(Math.atan2(world.x - startX, Math.max(world.y - START_Y, 0.02))));
  };

  const releaseThrow = () => {
    if (!playable || throwLockRef.current) {
      return;
    }
    throwLockRef.current = true;
    const next: WorldPuck = {
      id: Date.now(),
      owner: 'me',
      x: startX,
      y: START_Y,
      vx: Math.sin(aim) * power * SPEED,
      vy: Math.cos(aim) * power * SPEED,
      settled: false,
      zoneScore: null,
    };
    rollStartedAtRef.current = performance.now();
    myPuckRef.current = next;
    setMyPuck(next);
    setLastZone(null);
    setPhase('flying');
    void playCliffThrowSound();
  };

  const finishBriefing = () => {
    setStartX(randomStartX());
    setAim(0);
    setPhase('aiming');
  };

  const resumeAfterThrow = () => {
    if (myPuck) {
      setRestPucks((current) => [...current.slice(-4), { ...myPuck, settled: true }]);
    }
    setMyPuck(null);
    myPuckRef.current = null;
    setStartX(randomStartX());
    setAim(0);
    setLastZone(null);
    setPhase(balls.cleared ? 'cleared' : balls.canRetry ? 'failed' : 'aiming');
  };

  const speech = (() => {
    switch (phase) {
      case 'briefing':
        return t('games.cliff.balls.hint');
      case 'cleared':
        return t('games.cliff.balls.cleared');
      case 'failed':
        return t('games.cliff.balls.failed');
      case 'aiming':
      case 'flying':
      case 'settled':
        return null;
      default: {
        const exhaustive: never = phase;
        return exhaustive;
      }
    }
  })();

  const allPucks = [...restPucks, ...partnerPucks, ...(myPuck ? [myPuck] : [])];
  const showStartActors = phase === 'briefing' || phase === 'aiming' || phase === 'cleared' || phase === 'failed';
  const waitingForPartner =
    phase === 'aiming' &&
    balls.myRemaining <= 0 &&
    balls.partnerRemaining > 0 &&
    !balls.cleared &&
    !balls.canRetry;
  const showPanel =
    phase === 'briefing' ||
    phase === 'settled' ||
    phase === 'cleared' ||
    phase === 'failed' ||
    waitingForPartner;
  const camTravel = Math.min(Math.max(camTop / (1 - VIEW), 0), 1);
  const bgShift = camTravel * BG_PARALLAX * (1 - 1 / BG_SCALE) * 100;

  return (
    <Box sx={getCliffSceneRootSx()}>
      <Box sx={getCliffHubBackdropSx()} aria-hidden>
        <Box component="img" src={CLIFF_ASSETS.ballsBg} alt="" />
      </Box>
      <Box sx={getCliffHubStageSx()}>
        <Box
          ref={areaRef}
          onPointerDown={(event) => {
            if (!playable) {
              return;
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            aimFromPointer(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            if (!playable || event.buttons === 0) {
              return;
            }
            aimFromPointer(event.clientX, event.clientY);
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            touchAction: 'none',
            background: '#2a1818',
          }}
        >
          <Box
            component="img"
            src={CLIFF_ASSETS.ballsBg}
            alt=""
            sx={{
              position: 'absolute',
              left: '50%',
              bottom: 0,
              width: `${BG_SCALE * 100}%`,
              height: `${BG_SCALE * 100}%`,
              objectFit: 'cover',
              objectPosition: 'center bottom',
              transform: `translate(-50%, ${bgShift}%)`,
              willChange: 'transform',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: `${100 / VIEW}%`,
              transform: `translateY(${camTop * 100}%)`,
              willChange: 'transform',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: `${BOARD_LEFT * 100}%`,
                width: `${BOARD_WIDTH * 100}%`,
                top: 0,
                bottom: 0,
                backgroundImage: `url(${CLIFF_ASSETS.ballsLane})`,
                backgroundRepeat: 'repeat-y',
                backgroundSize: '100% auto',
                backgroundPosition: 'center bottom',
                pointerEvents: 'none',
              }}
            />
            {ZONE_BANDS.map((band) => (
              <Box
                key={band.score}
                sx={{
                  position: 'absolute',
                  left: `${(BOARD_LEFT + BOARD_WIDTH * LANE_INSET) * 100}%`,
                  width: `${BOARD_WIDTH * (1 - LANE_INSET * 2) * 100}%`,
                  bottom: `${band.start * 100}%`,
                  height: `${(band.end - band.start) * 100}%`,
                  bgcolor: band.fill,
                  borderTop: '2px solid rgba(255, 244, 214, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Typography sx={{ fontWeight: 900, color: '#fff6e8', fontSize: { xs: 15, sm: 20 }, textShadow: '0 1px 3px rgba(40,16,12,0.8)' }}>
                  {band.score}
                </Typography>
              </Box>
            ))}
            {playable && preview.length > 0 && areaSize.width > 0 && (
              <Box
                component="svg"
                viewBox={`0 0 ${areaSize.width} ${areaSize.height / VIEW}`}
                preserveAspectRatio="none"
                sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              >
                <polyline
                  points={preview
                    .map((point) => {
                      const x = (BOARD_LEFT + point.x * BOARD_WIDTH) * areaSize.width;
                      const y = (1 - point.y) * (areaSize.height / VIEW);
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#3a160e"
                  strokeWidth="7"
                  strokeLinecap="round"
                  opacity="0.45"
                />
                <polyline
                  points={preview
                    .map((point) => {
                      const x = (BOARD_LEFT + point.x * BOARD_WIDTH) * areaSize.width;
                      const y = (1 - point.y) * (areaSize.height / VIEW);
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#ffe08a"
                  strokeWidth="4"
                  strokeDasharray="11 8"
                  strokeLinecap="round"
                />
              </Box>
            )}
            {allPucks.map((puck) => (
              <Box
                key={`${puck.owner}-${puck.id}`}
                sx={{
                  position: 'absolute',
                  left: worldToLeft(puck.x),
                  bottom: worldToBottom(puck.y),
                  width: puckSize,
                  height: puckSize,
                  borderRadius: '50%',
                  transform: 'translate(-50%, 50%)',
                  background: puckFill(puck.owner),
                  boxShadow: '0 2px 5px rgba(40,16,12,0.45)',
                  border: '2px solid #5a3018',
                  zIndex: 4,
                }}
              />
            ))}
            {phase === 'settled' && lastZone !== null && myPuck && (
              <Box
                sx={{
                  position: 'absolute',
                  left: worldToLeft(myPuck.x),
                  bottom: `calc(${worldToBottom(myPuck.y)} + ${puckSize + 8}px)`,
                  transform: 'translateX(-50%)',
                  px: 1,
                  py: 0.35,
                  borderRadius: 1,
                  bgcolor: '#fff6e8',
                  border: '1px solid #8b4a2b',
                  zIndex: 5,
                }}
              >
                <Typography sx={{ fontWeight: 900, color: '#5c2618', fontSize: 13 }}>
                  {lastZone > 0 ? t('games.cliff.balls.scored', { score: lastZone }) : t('games.cliff.balls.miss')}
                </Typography>
              </Box>
            )}
            {showStartActors && (
              <>
                <Box
                  sx={{
                    position: 'absolute',
                    left: worldToLeft(showPartner ? 0.28 : 0.5),
                    bottom: worldToBottom(0.01),
                    width: { xs: '22%', sm: '18%' },
                    transform: 'translateX(-50%)',
                    zIndex: 3,
                    pointerEvents: 'none',
                  }}
                >
                  <CliffCharacter
                    avatar={state.me.avatar}
                    name={myName}
                    walking={false}
                    from="left"
                    compact
                    speechWide
                    speech={speech}
                    motion="idle"
                  />
                </Box>
                {showPartner && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: worldToLeft(0.72),
                      bottom: worldToBottom(0.01),
                      width: { xs: '22%', sm: '18%' },
                      transform: 'translateX(-50%)',
                      zIndex: 3,
                      pointerEvents: 'none',
                    }}
                  >
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
            )}
          </Box>
        </Box>
      </Box>

      {playable && (
        <Box sx={getCliffBridgePowerWrapSx()} onPointerDown={(event) => event.stopPropagation()}>
          <Box sx={getCliffBridgePowerTrackSx()}>
            <Box sx={getCliffBridgePowerFillSx(power, true)} />
          </Box>
          <Button onClick={releaseThrow} sx={{ ...getCliffModalPrimaryButtonSx(), minWidth: 96 }}>
            {t('games.cliff.balls.throw')}
          </Button>
        </Box>
      )}

      {showPanel && (
        <Box
          sx={{
            ...getCliffParchmentPanelSx(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: waitingForPartner || (balls.cleared && !state.partnerPresent) ? 'flex-start' : 'flex-end',
            gap: 1,
            flexWrap: 'wrap',
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {phase === 'briefing' && (
            <Button onClick={finishBriefing} sx={getCliffModalPrimaryButtonSx()}>
              {t('games.cliff.balls.start')}
            </Button>
          )}
          {phase === 'settled' && (
            <Button onClick={resumeAfterThrow} sx={getCliffModalPrimaryButtonSx()}>
              {t('games.cliff.balls.resume')}
            </Button>
          )}
          {waitingForPartner && (
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#8a3d28' }}>
              {t('games.cliff.waitPartner')}
            </Typography>
          )}
          {phase !== 'settled' &&
            balls.cleared &&
            (state.partnerPresent ? (
              <Button onClick={onNext} sx={getCliffModalPrimaryButtonSx()}>
                {t('games.cliff.balls.next')}
              </Button>
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#8a3d28', maxWidth: 220 }}>
                {t('games.cliff.waitPartner')}
              </Typography>
            ))}
          {phase !== 'settled' && balls.canRetry && (
            <Button onClick={onRetry} sx={getCliffModalGhostButtonSx()}>
              {t('games.cliff.balls.retry')}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CliffBalls;
