import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import { CLIFF_ASSETS } from './cliffAssets';
import { CLIFF_CHAR_COMPACT_MAX_WIDTH, getCliffCharacterWrapSx, type CliffCharacterMotion } from './cliffStyles';

type CliffCharacterProps = {
  avatar?: string;
  name: string;
  walking: boolean;
  from: 'left' | 'right';
  speech?: string | null;
  compact?: boolean;
  speechWide?: boolean;
  speechBelow?: boolean;
  motion?: CliffCharacterMotion;
};

const CliffCharacter: React.FC<CliffCharacterProps> = ({
  avatar,
  name,
  walking,
  from,
  speech,
  compact = false,
  speechWide = false,
  speechBelow = false,
  motion = 'idle',
}) => {
  const traveling = motion === 'enter' || motion === 'leave';
  const stepping = walking || traveling;

  return (
    <Box sx={{ ...getCliffCharacterWrapSx(motion, from, compact), maxWidth: 'none', overflow: 'visible' }}>
      {speech && motion !== 'leave' && !speechBelow && (
        <Box
          sx={{
            mb: 0.5,
            px: 1.25,
            py: 0.75,
            boxSizing: 'border-box',
            width: speechWide ? 280 : 160,
            maxWidth: speechWide ? 'min(280px, 76cqw)' : 'min(160px, 72vw)',
            alignSelf: speechWide && from === 'left' ? 'flex-start' : speechWide && from === 'right' ? 'flex-end' : 'center',
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
            animation: 'cliffSpeechIn 0.3s ease-out',
            '@keyframes cliffSpeechIn': {
              from: { transform: 'translateY(6px)', opacity: 0 },
              to: { transform: 'translateY(0)', opacity: 1 },
            },
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
            {speech}
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: compact ? CLIFF_CHAR_COMPACT_MAX_WIDTH : 'none',
          aspectRatio: '1 / 1.15',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: '3%',
            width: '46%',
            height: '9%',
            borderRadius: '50%',
            bgcolor: 'rgba(42, 18, 14, 0.28)',
            transform: 'translateX(-50%)',
            filter: 'blur(3px)',
            animation: stepping ? 'cliffShadowStep 0.36s ease-in-out infinite' : undefined,
            '@keyframes cliffShadowStep': {
              '0%, 100%': { transform: 'translateX(-50%) scaleX(1)', opacity: 0.28 },
              '50%': { transform: 'translateX(-50%) scaleX(0.82)', opacity: 0.18 },
            },
          }}
        />
        <Box
          component="img"
          src={CLIFF_ASSETS.bodyIdle}
          alt=""
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            animation: stepping ? 'cliffStep 0.36s ease-in-out infinite' : undefined,
            '@keyframes cliffStep': {
              '0%, 100%': { transform: 'translateY(0) rotate(-1.5deg)' },
              '50%': { transform: 'translateY(-5px) rotate(1.5deg)' },
            },
          }}
        />
        <Avatar
          src={avatar || undefined}
          alt={name}
          sx={{
            position: 'absolute',
            top: '6%',
            left: '50%',
            width: '34%',
            height: 'auto',
            aspectRatio: '1 / 1',
            transform: 'translateX(-50%)',
            border: '2px solid #fff4e8',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {name.charAt(0).toUpperCase()}
        </Avatar>
      </Box>
      {speech && motion !== 'leave' && speechBelow && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            left: from === 'right' ? 'auto' : 0,
            right: from === 'right' ? 0 : 'auto',
            mt: 0.5,
            px: 1.25,
            py: 0.75,
            boxSizing: 'border-box',
            width: speechWide ? 280 : 160,
            maxWidth: speechWide ? 'min(220px, 68cqw)' : 'min(160px, 72vw)',
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
            zIndex: 2,
            animation: 'cliffSpeechIn 0.3s ease-out',
            '@keyframes cliffSpeechIn': {
              from: { transform: 'translateY(-6px)', opacity: 0 },
              to: { transform: 'translateY(0)', opacity: 1 },
            },
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
            {speech}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CliffCharacter;
