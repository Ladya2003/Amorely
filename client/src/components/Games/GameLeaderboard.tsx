import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Box, Stack, Typography, useTheme } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getUserDisplayName } from '../UI/UserProfileChip';
import type { LeaderboardEntry } from '../../services/gamesService';
import GameRankMedalIcon, { getMedalSizeForAvatar } from './GameRankMedalIcon';
import {
  gameLeaderboardRowEnterSx,
  getAvatarRankMedalOverlaySx,
  getGameLeaderboardAvatarSx,
  getGameLeaderboardEmptySx,
  getGameLeaderboardItemSx,
  getGameLeaderboardRankSlotSx,
  getGameLeaderboardRankSx,
  getGameLeaderboardScoreSx,
} from './gamePageStyles';

interface GameLeaderboardProps {
  entries: LeaderboardEntry[];
  emptyMessage?: string;
}

const getPairLabel = (entry: LeaderboardEntry) =>
  entry.users
    .map((user) => getUserDisplayName(user))
    .join(' & ');

const LEADERBOARD_AVATAR_SIZE = 38;

const GameLeaderboard: React.FC<GameLeaderboardProps> = ({
  entries,
  emptyMessage,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const resolvedEmptyMessage = emptyMessage ?? t('games.leaderboard.empty');
  const medalSize = getMedalSizeForAvatar(LEADERBOARD_AVATAR_SIZE);

  if (entries.length === 0) {
    return (
      <Box sx={getGameLeaderboardEmptySx(theme)}>
        <EmojiEventsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1.5, opacity: 0.75 }} />
        <Typography color="text.secondary">{resolvedEmptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.25}>
      {entries.map((entry, index) => (
        <Box
          key={entry.relationshipId}
          sx={{
            ...getGameLeaderboardItemSx(theme, entry.rank),
            ...gameLeaderboardRowEnterSx(index),
          }}
        >
          <Box sx={getGameLeaderboardRankSlotSx()}>
            <Typography variant="subtitle1" sx={getGameLeaderboardRankSx(theme, entry.rank)}>
              {entry.rank}
            </Typography>
          </Box>

          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {entry.rank <= 3 && (
              <Box sx={getAvatarRankMedalOverlaySx()}>
                <GameRankMedalIcon rank={entry.rank} size={medalSize} />
              </Box>
            )}
            {entry.users.map((user, userIndex) => (
              <Avatar
                key={user.id}
                src={user.avatar}
                alt={getUserDisplayName(user)}
                sx={getGameLeaderboardAvatarSx(userIndex)}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
            ))}
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }} noWrap>
              {getPairLabel(entry)}
            </Typography>
          </Box>

          <Typography variant="body2" sx={getGameLeaderboardScoreSx()}>
            {entry.totalScore}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};

export default GameLeaderboard;
