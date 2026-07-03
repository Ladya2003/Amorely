import React from 'react';
import { Box } from '@mui/material';
import { normalizeMedalRank, resolveDisplayBadge, type RelationshipBadge } from '../../utils/gameBadges';
import GameRankMedalIcon, { getMedalSizeForAvatar } from './GameRankMedalIcon';
import { getAvatarRankMedalOverlaySx } from './gamePageStyles';

interface AvatarGameRankMedalProps {
  badges?: RelationshipBadge[];
  displayGameId?: string | null;
  showBadge?: boolean;
  avatarSize?: number;
  children: React.ReactNode;
}

const AvatarGameRankMedal: React.FC<AvatarGameRankMedalProps> = ({
  badges = [],
  displayGameId,
  showBadge = true,
  avatarSize,
  children,
}) => {
  const badge = resolveDisplayBadge(badges, displayGameId);
  const medalRank = badge ? normalizeMedalRank(badge.rank) : null;
  const medalSize = avatarSize ? getMedalSizeForAvatar(avatarSize) : 26;

  if (!showBadge || !badge || !medalRank) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      {children}
      <Box sx={getAvatarRankMedalOverlaySx()}>
        <GameRankMedalIcon rank={medalRank} size={medalSize} />
      </Box>
    </Box>
  );
};

export default AvatarGameRankMedal;
