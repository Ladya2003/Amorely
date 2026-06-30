import React from 'react';
import { Box } from '@mui/material';
import { resolveDisplayBadge, type RelationshipBadge } from '../../utils/gameBadges';
import GameRankMedalIcon, { getMedalSizeForAvatar } from './GameRankMedalIcon';
import { getAvatarRankMedalOverlaySx } from './gamePageStyles';

interface AvatarGameRankMedalProps {
  badges?: RelationshipBadge[];
  displayGameId?: string | null;
  avatarSize?: number;
  children: React.ReactNode;
}

const AvatarGameRankMedal: React.FC<AvatarGameRankMedalProps> = ({
  badges = [],
  displayGameId,
  avatarSize,
  children,
}) => {
  const badge = resolveDisplayBadge(badges, displayGameId);
  const medalSize = avatarSize ? getMedalSizeForAvatar(avatarSize) : 26;

  if (!badge) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      {children}
      <Box sx={getAvatarRankMedalOverlaySx()}>
        <GameRankMedalIcon rank={badge.rank} size={medalSize} />
      </Box>
    </Box>
  );
};

export default AvatarGameRankMedal;
