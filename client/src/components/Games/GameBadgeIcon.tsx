import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { GAME_BADGE_ICONS } from '../Chat/gamesData';
import { getGameName, type RelationshipBadge } from '../../utils/gameBadges';

interface GameBadgeIconProps {
  badge: RelationshipBadge;
  size?: number;
  showTooltip?: boolean;
}

const GameBadgeIcon: React.FC<GameBadgeIconProps> = ({ badge, size = 16, showTooltip = true }) => {
  const iconUrl = GAME_BADGE_ICONS[badge.gameId];
  const showRank = badge.rank >= 1 && badge.rank <= 3;
  const rankSize = Math.max(8, Math.round(size * 0.55));

  const content = (
    <Box
      component="span"
      sx={{
        position: 'relative',
        display: 'inline-flex',
        width: size,
        height: size,
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    >
      {iconUrl ? (
        <Box
          component="img"
          src={iconUrl}
          alt=""
          sx={{
            width: size,
            height: size,
            borderRadius: 0.5,
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: 0.5,
            bgcolor: 'rgba(255, 75, 141, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.65,
          }}
        >
          🏆
        </Box>
      )}
      {showRank && (
        <Box
          component="span"
          sx={{
            position: 'absolute',
            right: -1,
            bottom: -1,
            minWidth: rankSize,
            height: rankSize,
            px: 0.25,
            borderRadius: 999,
            bgcolor: '#ff4b8d',
            color: '#fff',
            border: '1px solid #fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            boxSizing: 'border-box',
          }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: Math.max(7, Math.round(rankSize * 0.72)),
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {badge.rank}
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <Tooltip title={`Топ-${badge.rank} · ${getGameName(badge.gameId)}`}>
      {content}
    </Tooltip>
  );
};

export default GameBadgeIcon;
