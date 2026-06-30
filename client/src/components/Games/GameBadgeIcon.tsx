import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Tooltip } from '@mui/material';
import { getGameName, type RelationshipBadge } from '../../utils/gameBadges';
import GameRankMedalIcon from './GameRankMedalIcon';

interface GameBadgeIconProps {
  badge: RelationshipBadge;
  size?: number;
  showTooltip?: boolean;
}

const GameBadgeIcon: React.FC<GameBadgeIconProps> = ({ badge, size = 16, showTooltip = true }) => {
  const { t } = useTranslation();

  const content = (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    >
      <GameRankMedalIcon rank={badge.rank} size={size} />
    </Box>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <Tooltip title={t('games.badge.tooltip', { rank: badge.rank, game: getGameName(badge.gameId) })}>
      {content}
    </Tooltip>
  );
};

export default GameBadgeIcon;
