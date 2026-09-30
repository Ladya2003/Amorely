import React, { useId, useMemo } from 'react';
import { Box } from '@mui/material';
import { FORTUNE_WHEEL_SPIN_DURATION_MS } from '../../utils/fortuneWheelSounds';
import {
  getFortuneWheelColors,
  getWheelLabelFontSize,
  getWheelLabelMaxLength,
  getWheelLabelOuterRadius,
  getWheelLabelRotation,
  truncateWheelLabel,
} from './fortuneWheelColors';

interface FortuneWheelWheelProps {
  tasks: string[];
  rotation: number;
  spinning: boolean;
  size?: number;
  onTransitionEnd?: () => void;
}

const polarToCartesian = (cx: number, cy: number, radius: number, angleDeg: number) => {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
};

const describeArc = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
};

const FortuneWheelWheel: React.FC<FortuneWheelWheelProps> = ({
  tasks,
  rotation,
  spinning,
  size = 320,
  onTransitionEnd,
}) => {
  const idPrefix = useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 14;
  const labelOuterRadius = getWheelLabelOuterRadius(radius);
  const fontSize = getWheelLabelFontSize(tasks.length);
  const labelMaxLength = getWheelLabelMaxLength(tasks.length, radius, fontSize);
  const segmentColors = useMemo(() => getFortuneWheelColors(tasks.length), [tasks.length]);

  const segments = useMemo(() => {
    if (tasks.length === 0) {
      return [];
    }

    const segmentAngle = 360 / tasks.length;

    return tasks.map((task, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = startAngle + segmentAngle;
      const midAngle = startAngle + segmentAngle / 2;
      const labelPos = polarToCartesian(cx, cy, labelOuterRadius, midAngle);
      const path = describeArc(cx, cy, radius, startAngle, endAngle);

      return {
        key: `${index}-${task.slice(0, 12)}`,
        clipId: `${idPrefix}-clip-${index}`,
        path,
        color: segmentColors[index] ?? segmentColors[segmentColors.length - 1],
        label: truncateWheelLabel(task, labelMaxLength),
        labelX: labelPos.x,
        labelY: labelPos.y,
        labelRotate: getWheelLabelRotation(midAngle),
      };
    });
  }, [cx, cy, idPrefix, labelMaxLength, labelOuterRadius, radius, segmentColors, tasks]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        maxWidth: 'min(100vw - 32px, 360px)',
        aspectRatio: '1 / 1',
        mx: 'auto',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '14px solid transparent',
          borderRight: '14px solid transparent',
          borderTop: '26px solid #fff',
          zIndex: 2,
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.28))',
        }}
      />

      <Box
        component="svg"
        viewBox={`0 0 ${size} ${size}`}
        sx={{
          width: '100%',
          height: '100%',
          display: 'block',
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? `transform ${FORTUNE_WHEEL_SPIN_DURATION_MS}ms cubic-bezier(0.15, 0.85, 0.2, 1)`
            : 'none',
          transformOrigin: '50% 50%',
          borderRadius: '50%',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 10px 36px rgba(0,0,0,0.5)'
              : '0 10px 36px rgba(0,0,0,0.22)',
        }}
        onTransitionEnd={(event) => {
          if (event.propertyName === 'transform') {
            onTransitionEnd?.();
          }
        }}
      >
        <defs>
          {segments.map((segment) => (
            <clipPath key={segment.clipId} id={segment.clipId}>
              <path d={segment.path} />
            </clipPath>
          ))}
        </defs>

        <circle cx={cx} cy={cy} r={radius + 10} fill="#fff" />

        {segments.length === 0 ? (
          <circle cx={cx} cy={cy} r={radius} fill="action.hover" />
        ) : (
          segments.map((segment) => (
            <g key={segment.key} clipPath={`url(#${segment.clipId})`}>
              <path d={segment.path} fill={segment.color} stroke="#fff" strokeWidth={2.5} />
              <text
                x={segment.labelX}
                y={segment.labelY}
                fill="#fff"
                fontSize={fontSize}
                fontWeight={800}
                textAnchor="start"
                dominantBaseline="middle"
                transform={`rotate(${segment.labelRotate}, ${segment.labelX}, ${segment.labelY})`}
                style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}
              >
                {segment.label}
              </text>
            </g>
          ))
        )}

        <circle cx={cx} cy={cy} r={radius * 0.14} fill="#fff" stroke="rgba(0,0,0,0.08)" strokeWidth={2} />
      </Box>
    </Box>
  );
};

export default FortuneWheelWheel;
