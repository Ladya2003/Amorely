import React from 'react';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import { getUserDisplayName } from '../UI/UserProfileChip';
import type { LeaderboardEntry } from '../../services/gamesService';

interface GameLeaderboardProps {
  entries: LeaderboardEntry[];
  emptyMessage?: string;
}

const getPairLabel = (entry: LeaderboardEntry) =>
  entry.users
    .map((user) => getUserDisplayName(user))
    .join(' & ');

const GameLeaderboard: React.FC<GameLeaderboardProps> = ({
  entries,
  emptyMessage = 'Пока никто не играл',
}) => {
  if (entries.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {entries.map((entry) => (
        <Box
          key={entry.relationshipId}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: entry.rank <= 3 ? 'primary.main' : 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              width: 28,
              fontWeight: 700,
              color: entry.rank <= 3 ? 'primary.main' : 'text.secondary',
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            {entry.rank}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {entry.users.map((user, index) => (
              <Avatar
                key={user.id}
                src={user.avatar}
                alt={getUserDisplayName(user)}
                sx={{
                  width: 36,
                  height: 36,
                  ml: index === 0 ? 0 : -1,
                  border: '2px solid',
                  borderColor: 'background.paper',
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
            ))}
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {getPairLabel(entry)}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, flexShrink: 0 }}>
            {entry.totalScore}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};

export default GameLeaderboard;
