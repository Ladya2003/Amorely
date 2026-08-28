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
  getCliffCharacterSlotSx,
  getCliffHubBackdropSx,
  getCliffHubStageSx,
  getCliffModalGhostButtonSx,
  getCliffModalPrimaryButtonSx,
  getCliffParchmentPanelSx,
  getCliffSceneRootSx,
} from './cliffStyles';

type BallPhase = 'briefing' | 'aiming' | 'charging' | 'flying' | 'cleared' | 'failed';

type FlyingBall = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rolling: boolean;
  settled: boolean;
  zoneScore: number | null;
};

type CliffBallsProps = {
  state: CliffGameState;
  onThrow: (zoneScore: number) => void;
  onRetry: () => void;
  onNext: () => void;
};

const ZONE_SCORES = [10, 20, 30, 40] as const;
const ZONE_STARTS = [0.28, 0.44, 0.6, 0.76];
const ZONE_WIDTH = 0.14;
const GROUND_Y_FRAC = 0.72;
const REF_HEIGHT = 600;
const BASE_SPEED = 22;
const BASE_GRAVITY = 0.32;
const ROLL_FRICTION = 0.985;
const ROLL_STOP = 0.18;
const MIN_POWER = 0.12;
const MIN_ANGLE = Math.PI * 0.12;
const MAX_ANGLE = Math.PI * 0.48;
const DEFAULT_ANGLE = Math.PI * 0.3;
const DEFAULT_POWER = 0.68;
const AIM_PREVIEW_STEPS = 12;
const AIM_PREVIEW_RANGE = 0.34;
const CHARGE_RADIANS_PER_FRAME = 0.024;
const ROLL_MS_MIN = 1000;
const ROLL_MS_MAX = 2000;

const displayName = (user: CliffGameState['me']) => user.firstName || user.username || '';

const physicsOf = (height: number) => {
  const scale = Math.max(height, 1) / REF_HEIGHT;
  return { speed: BASE_SPEED * scale, gravity: BASE_GRAVITY * scale };
};

const clampAngle = (angle: number) => Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, angle));

const originOf = (width: number, height: number) => ({
  x: width * 0.12,
  y: height * 0.62,
});

const groundYOf = (height: number) => height * GROUND_Y_FRAC;

const zoneScoreAt = (x: number, width: number): number => {
  if (width <= 0) {
    return 0;
  }
  const frac = x / width;
  for (let i = 0; i < ZONE_SCORES.length; i += 1) {
    const start = ZONE_STARTS[i];
    const end = start + ZONE_WIDTH;
    if (frac >= start && frac < end) {
      return ZONE_SCORES[i];
    }
  }
  return 0;
};

const projectPoints = (
  originX: number,
  originY: number,
  angle: number,
  power: number,
  speed: number,
  gravity: number,
  groundY: number,
  count: number,
  maxDist: number
) => {
  const points: Array<{ x: number; y: number }> = [];
  let x = originX;
  let y = originY;
  let vx = Math.cos(angle) * power * speed;
  let vy = -Math.sin(angle) * power * speed;
  for (let i = 0; i < count; i += 1) {
    x += vx;
    y += vy;
    vy += gravity;
    if (y >= groundY) {
      y = groundY;
      points.push({ x, y });
      break;
    }
    if (Math.hypot(x - originX, y - originY) > maxDist) {
      break;
    }
    points.push({ x, y });
  }
  return points;
};

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
  const [angle, setAngle] = useState(DEFAULT_ANGLE);
  const [power, setPower] = useState(DEFAULT_POWER);
  const [ball, setBall] = useState<FlyingBall | null>(null);
  const [slotReady, setSlotReady] = useState(false);
  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });
  const [lastZone, setLastZone] = useState<number | null>(null);

  const myName = displayName(state.me) || t('games.common.you');
  const partnerName = displayName(state.partner) || t('games.common.partner');
  const showPartner = state.partnerPresent;
  const playable =
    (phase === 'aiming' || phase === 'charging') &&
    balls.myRemaining > 0 &&
    !balls.cleared &&
    !balls.canRetry;
  const physics = physicsOf(areaSize.height);
  const groundY = groundYOf(Math.max(areaSize.height, 1));
  const ballSize = Math.max(18, areaSize.width * 0.04);

  useEffect(() => {
    const id = window.setTimeout(() => setSlotReady(true), 40);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (balls.cleared) {
      setPhase('cleared');
      return;
    }
    if (balls.canRetry) {
      setPhase('failed');
      return;
    }
    setPhase((current) => {
      if (current === 'flying' || current === 'briefing' || current === 'charging') {
        return current;
      }
      if (balls.myRemaining <= 0) {
        return current === 'aiming' ? current : 'aiming';
      }
      return current === 'failed' || current === 'cleared' ? 'aiming' : current;
    });
  }, [balls.canRetry, balls.cleared, balls.myRemaining]);

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

  const ballRef = useRef(ball);
  ballRef.current = ball;

  useEffect(() => {
    if (!ball || ball.settled) {
      return undefined;
    }
    let frame = 0;
    const step = () => {
      const current = ballRef.current;
      if (!current || current.settled) {
        return;
      }
      let { x, y, vx, vy, rolling } = current;
      if (!rolling) {
        x += vx;
        y += vy;
        vy += physics.gravity;
        if (y >= groundY) {
          y = groundY;
          rolling = true;
          vy = 0;
          vx *= 0.72;
          rollStartedAtRef.current = performance.now();
        }
      } else {
        x += vx;
        vx *= ROLL_FRICTION;
        const rolledMs = performance.now() - rollStartedAtRef.current;
        const minRollDone = rolledMs >= ROLL_MS_MIN;
        const maxRollDone = rolledMs >= ROLL_MS_MAX;
        if ((minRollDone && Math.abs(vx) < ROLL_STOP) || maxRollDone || x < 0 || x > areaSize.width) {
          const zoneScore = zoneScoreAt(Math.min(Math.max(x, 0), areaSize.width), areaSize.width);
          const settled: FlyingBall = {
            ...current,
            x: Math.min(Math.max(x, 0), areaSize.width),
            y: groundY,
            vx: 0,
            vy: 0,
            rolling: true,
            settled: true,
            zoneScore,
          };
          ballRef.current = settled;
          setBall(settled);
          setLastZone(zoneScore);
          throwLockRef.current = false;
          if (zoneScore > 0) {
            void playCliffHitSound();
          } else {
            void playCliffMissSound();
          }
          onThrowRef.current(zoneScore);
          setPhase('aiming');
          window.setTimeout(() => {
            setBall(null);
          }, 700);
          return;
        }
      }
      const next: FlyingBall = { ...current, x, y, vx, vy, rolling };
      ballRef.current = next;
      setBall(next);
      frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [areaSize.width, ball?.id, ball?.settled, groundY, physics.gravity]);

  const preview = useMemo(() => {
    if (!playable || areaSize.width <= 0) {
      return [] as Array<{ x: number; y: number }>;
    }
    const origin = originOf(areaSize.width, areaSize.height);
    return projectPoints(
      origin.x,
      origin.y,
      angle,
      power,
      physics.speed,
      physics.gravity,
      groundY,
      AIM_PREVIEW_STEPS,
      Math.max(areaSize.width, areaSize.height) * AIM_PREVIEW_RANGE
    );
  }, [angle, areaSize.height, areaSize.width, groundY, physics.gravity, physics.speed, playable, power]);

  useEffect(() => {
    if (phase !== 'charging') {
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

  const aimFromPointer = (clientX: number, clientY: number) => {
    if (!areaRef.current || phase !== 'aiming') {
      return;
    }
    const rect = areaRef.current.getBoundingClientRect();
    const origin = originOf(rect.width, rect.height);
    const dx = clientX - rect.left - origin.x;
    const dy = origin.y - (clientY - rect.top);
    setAngle(clampAngle(Math.atan2(Math.max(dy, 1), Math.max(dx, 1))));
  };

  const startCharge = () => {
    if (!playable || phase !== 'aiming') {
      return;
    }
    chargePhaseRef.current = 0;
    setPhase('charging');
  };

  const releaseThrow = () => {
    if (phase !== 'charging' || throwLockRef.current || areaSize.width <= 0) {
      return;
    }
    throwLockRef.current = true;
    const origin = originOf(areaSize.width, areaSize.height);
    const next: FlyingBall = {
      id: Date.now(),
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * power * physics.speed,
      vy: -Math.sin(angle) * power * physics.speed,
      rolling: false,
      settled: false,
      zoneScore: null,
    };
    setBall(next);
    setPhase('flying');
    void playCliffThrowSound();
  };

  const finishBriefing = () => setPhase('aiming');

  const speech = (() => {
    switch (phase) {
      case 'briefing':
        return t('games.cliff.balls.hint');
      case 'cleared':
        return t('games.cliff.balls.cleared');
      case 'failed':
        return t('games.cliff.balls.failed');
      case 'aiming':
      case 'charging':
      case 'flying':
        return lastZone === null
          ? null
          : lastZone > 0
            ? t('games.cliff.balls.scored', { score: lastZone })
            : t('games.cliff.balls.miss');
      default: {
        const exhaustive: never = phase;
        return exhaustive;
      }
    }
  })();

  const powerAction = () => {
    switch (phase) {
      case 'aiming':
        startCharge();
        return;
      case 'charging':
        releaseThrow();
        return;
      case 'briefing':
      case 'flying':
      case 'cleared':
      case 'failed':
        return;
      default: {
        const exhaustive: never = phase;
        return exhaustive;
      }
    }
  };

  return (
    <Box sx={getCliffSceneRootSx()}>
      <Box sx={getCliffHubBackdropSx()} aria-hidden>
        <Box component="img" src={CLIFF_ASSETS.climbPath} alt="" />
      </Box>
      <Box sx={getCliffHubStageSx()}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, #7eb7d8 0%, #c9e4f2 38%, #d8b07a 58%, #8a5a32 100%)',
          }}
        />
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
          sx={{ position: 'absolute', inset: 0, touchAction: 'none' }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: '4%',
              right: '4%',
              top: `${GROUND_Y_FRAC * 100}%`,
              height: '18%',
              borderRadius: '40% 40% 8px 8px',
              background:
                'linear-gradient(180deg, #c49a62 0%, #9a6a38 45%, #6f4524 100%)',
              boxShadow: 'inset 0 8px 0 rgba(255,230,180,0.18)',
            }}
          />
          {ZONE_SCORES.map((score, index) => {
            const left = `${ZONE_STARTS[index] * 100}%`;
            return (
              <Box
                key={score}
                sx={{
                  position: 'absolute',
                  left,
                  width: `${ZONE_WIDTH * 100}%`,
                  top: `${GROUND_Y_FRAC * 100 - 2}%`,
                  height: '14%',
                  borderRadius: 1,
                  bgcolor:
                    score === 10
                      ? 'rgba(120, 160, 90, 0.55)'
                      : score === 20
                        ? 'rgba(90, 150, 170, 0.55)'
                        : score === 30
                          ? 'rgba(200, 150, 70, 0.55)'
                          : 'rgba(180, 90, 70, 0.55)',
                  border: '2px solid rgba(255, 236, 200, 0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ fontWeight: 900, color: '#3a160e', fontSize: { xs: 12, sm: 14 } }}>
                  {score}
                </Typography>
              </Box>
            );
          })}
          {playable && preview.length > 0 && (
            <Box
              component="svg"
              viewBox={`0 0 ${areaSize.width} ${areaSize.height}`}
              sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            >
              <polyline
                points={preview.map((point) => `${point.x},${point.y}`).join(' ')}
                fill="none"
                stroke="#3a160e"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.55"
              />
              <polyline
                points={preview.map((point) => `${point.x},${point.y}`).join(' ')}
                fill="none"
                stroke="#ffe08a"
                strokeWidth="4"
                strokeDasharray="11 8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Box>
          )}
          {ball && (
            <Box
              sx={{
                position: 'absolute',
                left: ball.x,
                top: ball.y,
                width: ballSize,
                height: ballSize,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle at 30% 28%, #fff2d2 0%, #d2a24a 42%, #7a4318 100%)',
                boxShadow: '0 3px 6px rgba(40,16,12,0.4)',
                border: '2px solid #5a3018',
              }}
            />
          )}
        </Box>

        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '4%',
            height: '28%',
            overflow: 'visible',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          <Box sx={getCliffCharacterSlotSx(showPartner ? '6%' : '10%', slotReady)}>
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
            <Box sx={getCliffCharacterSlotSx('22%', slotReady)}>
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
      </Box>

      {playable && (
        <Box sx={getCliffBridgePowerWrapSx()} onPointerDown={(event) => event.stopPropagation()}>
          <Box sx={getCliffBridgePowerTrackSx()}>
            <Box sx={getCliffBridgePowerFillSx(power, phase === 'charging')} />
          </Box>
          <Button onClick={powerAction} sx={{ ...getCliffModalPrimaryButtonSx(), minWidth: 96 }}>
            {phase === 'charging' ? t('games.cliff.balls.throw') : t('games.cliff.balls.choose')}
          </Button>
        </Box>
      )}

      <Box
        sx={{
          ...getCliffParchmentPanelSx(),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {phase === 'briefing' ? (
          <Button onClick={finishBriefing} sx={getCliffModalPrimaryButtonSx()}>
            {t('games.cliff.balls.start')}
          </Button>
        ) : (
          <>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#5c2618', minWidth: 0 }}>
              {t('games.cliff.balls.progress', {
                balls: balls.myRemaining,
                each: balls.each,
                myScore: balls.myScore,
                partnerBalls: balls.partnerRemaining,
                partnerScore: balls.partnerScore,
                pairScore: balls.pairScore,
                threshold: balls.threshold,
              })}
            </Typography>
            {balls.cleared &&
              (state.partnerPresent ? (
                <Button
                  onClick={onNext}
                  sx={{ ...getCliffModalPrimaryButtonSx(), flexShrink: 0, py: 0.75, ml: 'auto' }}
                >
                  {t('games.cliff.balls.next')}
                </Button>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: '#8a3d28', ml: 'auto', maxWidth: 220 }}
                >
                  {t('games.cliff.waitPartner')}
                </Typography>
              ))}
            {balls.canRetry && (
              <Button
                onClick={onRetry}
                sx={{ ...getCliffModalGhostButtonSx(), flexShrink: 0, py: 0.75, ml: 'auto' }}
              >
                {t('games.cliff.balls.retry')}
              </Button>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default CliffBalls;
