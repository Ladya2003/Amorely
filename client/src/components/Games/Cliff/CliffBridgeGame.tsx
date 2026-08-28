import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import type { CliffGameState } from '../../../services/gamesService';
import { playCliffBridgeRepairSound } from '../../../utils/gameSounds';
import { CLIFF_ASSETS } from './cliffAssets';
import CliffCharacter from './CliffCharacter';
import {
  CLIFF_CHAR_RECENTER_MS,
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

type FlyingStone = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lodged: boolean;
};

type BridgePhase = 'briefing' | 'aiming' | 'charging' | 'restored' | 'admire';

type CliffBridgeGameProps = {
  state: CliffGameState;
  onThrow: (hit: boolean, angle: number, power: number) => void;
  onSurrender: () => void;
  onFinish: () => void;
};

type HoleRect = {
  x: number;
  y: number;
  size: number;
  cx: number;
  cy: number;
};

const HOLE_SIZE_FRACS = [0.2, 0.138, 0.087];
const REF_HEIGHT = 600;
const BASE_SPEED = 24;
const BASE_GRAVITY = 0.3;
const MIN_POWER = 0.1;
const MIN_ANGLE = Math.PI * 0.1;
const MAX_ANGLE = Math.PI * 0.46;
const DEFAULT_ANGLE = Math.PI * 0.32;
const DEFAULT_POWER = 0.72;
const AIM_PREVIEW_STEPS = 10;
const AIM_PREVIEW_RANGE = 0.32;
const CHARGE_RADIANS_PER_FRAME = 0.024;
const HIT_SUBSTEPS = 4;

const displayName = (user: CliffGameState['me']) => user.firstName || user.username || '';

const physicsOf = (height: number) => {
  const scale = Math.max(height, 1) / REF_HEIGHT;
  return { speed: BASE_SPEED * scale, gravity: BASE_GRAVITY * scale };
};

const stoneRadiusOf = (width: number) => Math.max(10, width * 0.028);

const holeRect = (index: number, areaWidth: number, areaHeight: number): HoleRect => {
  const size = areaWidth * HOLE_SIZE_FRACS[index];
  const x = areaWidth * 0.68;
  const y = areaHeight * (0.22 + index * 0.24);
  return { x, y, size, cx: x + size / 2, cy: y + size / 2 };
};

const stoneHitsHole = (x: number, y: number, stoneRadius: number, hole: HoleRect) => {
  const dx = x - hole.cx;
  const dy = y - hole.cy;
  const limit = hole.size / 2 + stoneRadius;
  return dx * dx + dy * dy <= limit * limit;
};

const segmentHitsHole = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stoneRadius: number,
  hole: HoleRect
) => {
  for (let step = 1; step <= HIT_SUBSTEPS; step += 1) {
    const t = step / HIT_SUBSTEPS;
    if (stoneHitsHole(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, stoneRadius, hole)) {
      return true;
    }
  }
  return false;
};

const clampAngle = (angle: number) => Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, angle));

const originOf = (width: number, height: number) => ({
  x: width * 0.16,
  y: height * 0.76,
});

const projectPoints = (
  originX: number,
  originY: number,
  angle: number,
  power: number,
  speed: number,
  gravity: number,
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
    if (Math.hypot(x - originX, y - originY) > maxDist) {
      break;
    }
    points.push({ x, y });
  }
  return points;
};

const hitsHole = (
  originX: number,
  originY: number,
  angle: number,
  power: number,
  speed: number,
  gravity: number,
  stoneRadius: number,
  hole: HoleRect,
  height: number
) => {
  let x = originX;
  let y = originY;
  let vx = Math.cos(angle) * power * speed;
  let vy = -Math.sin(angle) * power * speed;
  for (let i = 0; i < 160; i += 1) {
    const nextX = x + vx;
    const nextY = y + vy;
    if (segmentHitsHole(x, y, nextX, nextY, stoneRadius, hole)) {
      return true;
    }
    x = nextX;
    y = nextY;
    vy += gravity;
    if (y > height + 20) {
      return false;
    }
  }
  return false;
};

const CliffBridgeGame: React.FC<CliffBridgeGameProps> = ({
  state,
  onThrow,
  onSurrender,
  onFinish,
}) => {
  const { t } = useTranslation();
  const areaRef = useRef<HTMLDivElement | null>(null);
  const throwLockRef = useRef(false);
  const chargePhaseRef = useRef(0);
  const started = state.bridge.myHolesCompleted > 0 || state.bridge.myStones < 20;
  const [phase, setPhase] = useState<BridgePhase>(started ? 'aiming' : 'briefing');
  const [angle, setAngle] = useState(DEFAULT_ANGLE);
  const [power, setPower] = useState(DEFAULT_POWER);
  const [stones, setStones] = useState<FlyingStone[]>([]);
  const [slotReady, setSlotReady] = useState(false);
  const [walking, setWalking] = useState(false);
  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });
  const [pendingHitHole, setPendingHitHole] = useState<number | null>(null);

  const holesCompleted =
    pendingHitHole === null
      ? state.bridge.myHolesCompleted
      : Math.min(state.bridge.myHolesCompleted, pendingHitHole);
  const currentHole = Math.min(holesCompleted, 2);
  const bothDone = state.bridge.myHolesCompleted >= 3 && state.bridge.partnerHolesCompleted >= 3;
  const done = state.bridge.myHolesCompleted >= 3 && pendingHitHole === null;
  const playable = phase !== 'briefing' && !done && !bothDone && state.bridge.myStones > 0;
  const myName = displayName(state.me) || t('games.common.you');
  const partnerName = displayName(state.partner) || t('games.common.partner');
  const showPartner = state.partnerPresent;
  const leftReady = phase !== 'briefing';
  const celebrating = phase === 'restored' || phase === 'admire';
  const mySlotLeft = (() => {
    if (phase === 'briefing') {
      return showPartner ? '24%' : '38%';
    }
    if (celebrating) {
      return showPartner ? '12%' : '16%';
    }
    return showPartner ? '2%' : '8%';
  })();
  const partnerSlotLeft = celebrating ? '32%' : leftReady ? '18%' : '50%';
  const physics = physicsOf(areaSize.height);
  const stoneRadius = stoneRadiusOf(areaSize.width);
  const stoneSize = stoneRadius * 2;
  const showRepairedBg = phase === 'admire';
  const bg = showRepairedBg ? CLIFF_ASSETS.bridgeRepaired : CLIFF_ASSETS.climbPath;

  useEffect(() => {
    const id = window.setTimeout(() => setSlotReady(true), 40);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!bothDone) {
      return;
    }
    setPhase((current) => {
      if (current === 'restored' || current === 'admire') {
        return current;
      }
      return 'restored';
    });
  }, [bothDone]);

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

  const stonesRef = useRef(stones);
  stonesRef.current = stones;

  useEffect(() => {
    if (stones.length === 0 || stones.every((stone) => stone.lodged)) {
      return undefined;
    }
    const holes = [0, 1, 2].map((index) => holeRect(index, areaSize.width, areaSize.height));
    let frame = 0;
    const step = () => {
      const next = stonesRef.current
        .map((stone) => {
          if (stone.lodged) {
            return stone;
          }
          const nextX = stone.x + stone.vx;
          const nextY = stone.y + stone.vy;
          const hit = holes.find((hole) =>
            segmentHitsHole(stone.x, stone.y, nextX, nextY, stoneRadius, hole)
          );
          if (hit) {
            return { ...stone, x: hit.cx, y: hit.cy, vx: 0, vy: 0, lodged: true };
          }
          return {
            ...stone,
            x: nextX,
            y: nextY,
            vy: stone.vy + physics.gravity,
          };
        })
        .filter(
          (stone) =>
            stone.lodged ||
            (stone.x < areaSize.width + 40 && stone.y < areaSize.height + 40 && stone.x > -40)
        );
      const stillFlying = next.some((stone) => !stone.lodged);
      const wasFlying = stonesRef.current.some((stone) => !stone.lodged);
      stonesRef.current = next;
      setStones(next);
      if (wasFlying && !stillFlying) {
        setPendingHitHole(null);
      }
      if (stillFlying) {
        frame = window.requestAnimationFrame(step);
      }
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [areaSize.height, areaSize.width, physics.gravity, stoneRadius, stones.length]);

  useEffect(() => {
    if (phase !== 'charging') {
      return undefined;
    }
    chargePhaseRef.current = 0;
    let frame = 0;
    const tick = () => {
      chargePhaseRef.current += CHARGE_RADIANS_PER_FRAME;
      const wave = (1 - Math.cos(chargePhaseRef.current)) / 2;
      setPower(MIN_POWER + (1 - MIN_POWER) * wave);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  const preview = useMemo(() => {
    if (areaSize.width <= 0) {
      return [];
    }
    const origin = originOf(areaSize.width, areaSize.height);
    return projectPoints(
      origin.x,
      origin.y,
      angle,
      DEFAULT_POWER,
      physics.speed,
      physics.gravity,
      AIM_PREVIEW_STEPS,
      Math.min(areaSize.width, areaSize.height) * AIM_PREVIEW_RANGE
    );
  }, [angle, areaSize.height, areaSize.width, physics.gravity, physics.speed]);

  const aimFromPointer = (clientX: number, clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const origin = originOf(rect.width, rect.height);
    const dx = clientX - rect.left - origin.x;
    const dy = origin.y - (clientY - rect.top);
    setAngle(clampAngle(Math.atan2(dy, dx)));
  };

  const startCharge = () => {
    if (!playable || phase === 'charging') {
      return;
    }
    setPower(MIN_POWER);
    setPhase('charging');
  };

  const releaseThrow = () => {
    if (!playable || phase !== 'charging' || throwLockRef.current || areaSize.width <= 0) {
      return;
    }
    const origin = originOf(areaSize.width, areaSize.height);
    const hole = holeRect(currentHole, areaSize.width, areaSize.height);
    const hit = hitsHole(
      origin.x,
      origin.y,
      angle,
      power,
      physics.speed,
      physics.gravity,
      stoneRadius,
      hole,
      areaSize.height
    );
    if (hit) {
      setPendingHitHole(currentHole);
    }
    throwLockRef.current = true;
    setStones((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * power * physics.speed,
        vy: -Math.sin(angle) * power * physics.speed,
        lodged: false,
      },
    ]);
    onThrow(hit, angle, power);
    setPhase('aiming');
    window.setTimeout(() => {
      throwLockRef.current = false;
    }, 700);
  };

  const finishBriefing = () => {
    setWalking(true);
    setPhase('aiming');
    window.setTimeout(() => setWalking(false), CLIFF_CHAR_RECENTER_MS);
  };

  const continueAfterBridge = () => {
    switch (phase) {
      case 'restored':
        setPhase('admire');
        void playCliffBridgeRepairSound();
        return;
      case 'admire':
        onFinish();
        return;
      case 'briefing':
      case 'aiming':
      case 'charging':
        return;
      default: {
        const exhaustive: never = phase;
        return exhaustive;
      }
    }
  };

  const characterSpeech = () => {
    switch (phase) {
      case 'briefing':
        return t('games.cliff.bridge.hint');
      case 'restored':
        return t('games.cliff.bridge.restored');
      case 'admire':
        return t('games.cliff.bridge.beautiful');
      case 'aiming':
      case 'charging':
        return null;
      default: {
        const exhaustive: never = phase;
        return exhaustive;
      }
    }
  };

  const powerAction = () => {
    switch (phase) {
      case 'briefing':
      case 'restored':
      case 'admire':
        return;
      case 'aiming':
        startCharge();
        return;
      case 'charging':
        releaseThrow();
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
        <Box component="img" src={bg} alt="" />
      </Box>
      <Box sx={getCliffHubStageSx()}>
        <Box
          component="img"
          src={bg}
          alt=""
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
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
          {phase !== 'admire' && [0, 1, 2].map((index) => {
            const hole = holeRect(index, Math.max(areaSize.width, 1), Math.max(areaSize.height, 1));
            return (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  left: hole.x,
                  top: hole.y,
                  width: hole.size,
                  height: hole.size,
                  borderRadius: '50%',
                  bgcolor: index < holesCompleted ? '#7cbc6a' : 'rgba(40,20,16,0.82)',
                  border: '3px solid #d8a878',
                  boxShadow: 'inset 0 -10px 0 rgba(0,0,0,0.35)',
                  opacity: index === currentHole || index < holesCompleted ? 1 : 0.45,
                }}
              />
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
          {phase !== 'admire' && stones.map((stone) => (
            <Box
              key={stone.id}
              component="img"
              src={CLIFF_ASSETS.oresPebble}
              alt=""
              sx={{
                position: 'absolute',
                left: stone.x,
                top: stone.y,
                width: stoneSize,
                height: stoneSize,
                objectFit: 'contain',
                transform: 'translate(-50%, -50%)',
                filter: 'drop-shadow(0 2px 3px rgba(40, 16, 12, 0.35))',
              }}
            />
          ))}
        </Box>

        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '4%',
            height: '30%',
            overflow: 'visible',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          <Box sx={getCliffCharacterSlotSx(mySlotLeft, slotReady)}>
            <CliffCharacter
              avatar={state.me.avatar}
              name={myName}
              walking={walking}
              from="left"
              compact
              speechWide
              speech={characterSpeech()}
              motion="idle"
            />
          </Box>
          {showPartner && (
            <Box sx={getCliffCharacterSlotSx(partnerSlotLeft, slotReady)}>
              <CliffCharacter
                avatar={state.partner.avatar}
                name={partnerName}
                walking={walking}
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
            {phase === 'charging' ? t('games.cliff.bridge.throw') : t('games.cliff.bridge.choose')}
          </Button>
        </Box>
      )}

      <Box sx={getCliffParchmentPanelSx()}>
        {phase === 'briefing' ? (
          <Button onClick={finishBriefing} sx={getCliffModalPrimaryButtonSx()}>
            {t('games.cliff.bridge.next')}
          </Button>
        ) : (
          <>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#5c2618' }}>
              {t('games.cliff.bridge.progress', {
                holes: state.bridge.myHolesCompleted,
                stones: state.bridge.myStones,
                partnerHoles: state.bridge.partnerHolesCompleted,
                partnerStones: state.bridge.partnerStones,
              })}
            </Typography>
            {(phase === 'restored' || phase === 'admire') && (
              <Button onClick={continueAfterBridge} sx={{ ...getCliffModalPrimaryButtonSx(), mt: 1 }}>
                {t('games.cliff.bridge.next')}
              </Button>
            )}
            {state.bridge.canSurrender && (
              <Button onClick={onSurrender} sx={{ ...getCliffModalGhostButtonSx(), mt: 1 }}>
                {t('games.cliff.bridge.surrender')}
              </Button>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default CliffBridgeGame;
