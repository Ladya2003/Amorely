import React from 'react';
import { Box } from '@mui/material';
import { getBestBadgesByGame, resolveDisplayBadge, type RelationshipBadge } from '../../utils/gameBadges';
import GameBadgeIcon from './GameBadgeIcon';

export type { RelationshipBadge };

interface GameBadgesProps {
  badges?: RelationshipBadge[];
  /** null/undefined — автоматический выбор лучшей медали. */
  displayGameId?: string | null;
  variant?: 'single' | 'all';
  size?: number;
}

const GameBadges: React.FC<GameBadgesProps> = ({
  badges = [],
  displayGameId,
  variant = 'single',
  size = 16,
}) => {
  if (variant === 'single') {
    const badge = resolveDisplayBadge(badges, displayGameId);
    if (!badge) {
      return null;
    }

    return (
      <Box component="span" sx={{ display: 'inline-flex', ml: 0.5, verticalAlign: 'middle' }}>
        <GameBadgeIcon badge={badge} size={size} />
      </Box>
    );
  }

  const visibleBadges = getBestBadgesByGame(badges);
  if (visibleBadges.length === 0) {
    return null;
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.75,
        verticalAlign: 'middle',
      }}
    >
      {visibleBadges.map((badge) => (
        <GameBadgeIcon key={`${badge.gameId}-${badge.rank}`} badge={badge} size={size + 4} />
      ))}
    </Box>
  );
};

export default GameBadges;
