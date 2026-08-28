import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Box } from '@mui/material';
import {
  CLIFF_ROPE_QTE_PERIOD_MS,
  CLIFF_ROPE_QTE_TARGET_DEG,
  getCliffRopeQteWrapSx,
} from './cliffStyles';

export type CliffRopeQteHandle = {
  attempt: () => boolean;
};

type CliffRopeQteProps = {
  label: string;
  onJump: () => void;
  periodMs?: number;
  targetDeg?: number;
};

const SIZE = 160;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 58;

const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

const arcPoint = (deg: number, radius = RADIUS) => {
  const rad = toRad(deg);
  return { x: CX + Math.cos(rad) * radius, y: CY + Math.sin(rad) * radius };
};

const normalizeDeg = (deg: number) => ((deg % 360) + 360) % 360;

const isInTarget = (angle: number, center: number, width: number) => {
  const delta = Math.abs(normalizeDeg(angle - center) - 180) - 180;
  return Math.abs(delta) <= width / 2;
};

const pickTargetCenter = (width: number) => {
  const clear = width / 2 + 28;
  const span = Math.max(90, 360 - clear * 2);
  return normalizeDeg(clear + Math.random() * span);
};

const CliffRopeQte = forwardRef<CliffRopeQteHandle, CliffRopeQteProps>(
  ({ label, onJump, periodMs = CLIFF_ROPE_QTE_PERIOD_MS, targetDeg = CLIFF_ROPE_QTE_TARGET_DEG }, ref) => {
    const angleRef = useRef(0);
    const tickRef = useRef<SVGRectElement | null>(null);
    const frameRef = useRef(0);
    const targetCenterRef = useRef<number | null>(null);
    if (targetCenterRef.current === null) {
      targetCenterRef.current = pickTargetCenter(targetDeg);
    }
    const targetCenterDeg = targetCenterRef.current;

    useImperativeHandle(ref, () => ({
      attempt: () => isInTarget(angleRef.current, targetCenterRef.current ?? targetCenterDeg, targetDeg),
    }));

    useEffect(() => {
      const started = performance.now();
      const prefersReduce =
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = prefersReduce ? periodMs * 1.6 : periodMs;

      const tick = (now: number) => {
        const elapsed = now - started;
        const angle = normalizeDeg((elapsed / duration) * 360);
        angleRef.current = angle;
        if (tickRef.current) {
          tickRef.current.setAttribute('transform', `rotate(${angle} ${CX} ${CY})`);
        }
        frameRef.current = window.requestAnimationFrame(tick);
      };

      frameRef.current = window.requestAnimationFrame(tick);
      return () => window.cancelAnimationFrame(frameRef.current);
    }, [periodMs]);

    const targetLen = Math.max(18, RADIUS * ((targetDeg * Math.PI) / 180));
    const tick = arcPoint(0, RADIUS);

    return (
      <Box sx={getCliffRopeQteWrapSx()}>
        <Box
          component="svg"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          sx={{ width: '100%', height: '100%', display: 'block', overflow: 'visible', pointerEvents: 'none' }}
        >
          <defs>
            <linearGradient id="cliffQteRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5a3018" />
              <stop offset="48%" stopColor="#2a140e" />
              <stop offset="100%" stopColor="#6a3a22" />
            </linearGradient>
            <linearGradient id="cliffQteTarget" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff3dc" />
              <stop offset="42%" stopColor="#e2c08a" />
              <stop offset="100%" stopColor="#c49254" />
            </linearGradient>
          </defs>
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            fill="none"
            stroke="url(#cliffQteRing)"
            strokeWidth="7"
            strokeLinecap="butt"
          />
          <rect
            x={CX - targetLen / 2}
            y={CY - RADIUS - 9}
            width={targetLen}
            height="18"
            rx="3"
            fill="url(#cliffQteTarget)"
            stroke="#8b4a2b"
            strokeWidth="1.8"
            transform={`rotate(${targetCenterDeg} ${CX} ${CY})`}
          />
          <rect
            ref={tickRef}
            x={tick.x - 4.5}
            y={tick.y - 12}
            width="9"
            height="24"
            rx="3"
            fill="#fff8ee"
            stroke="#5c2618"
            strokeWidth="1.4"
            transform={`rotate(0 ${CX} ${CY})`}
          />
        </Box>
        <Box
          component="button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onJump();
          }}
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            px: 1.35,
            py: 0.65,
            borderRadius: '10px',
            bgcolor: '#8a3d28',
            border: '1.5px solid #6e2f1e',
            boxShadow: 'inset 0 1px 0 rgba(255, 232, 200, 0.22)',
            minWidth: 76,
            color: '#ffe8c8',
            fontWeight: 800,
            fontSize: '0.78rem',
            letterSpacing: 0.4,
            lineHeight: 1.15,
            font: 'inherit',
            cursor: 'pointer',
            appearance: 'none',
            WebkitTapHighlightColor: 'transparent',
            '&:hover': {
              bgcolor: '#6e2f1e',
            },
            '&:focus-visible': {
              outline: '2px solid #ffe8c8',
            },
          }}
        >
          {label}
        </Box>
      </Box>
    );
  }
);

CliffRopeQte.displayName = 'CliffRopeQte';

export default CliffRopeQte;
