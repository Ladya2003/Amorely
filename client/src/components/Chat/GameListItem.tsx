import React from 'react';
import { Box, Typography } from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import type { Game } from './gamesData';

interface GameListItemProps {
  game: Game;
  onClick?: (game: Game) => void;
}

const GameListItem: React.FC<GameListItemProps> = ({ game, onClick }) => {
  return (
    <Box
      component="button"
      type="button"
      onClick={() => onClick?.(game)}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        width: '100%',
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left',
        transition: 'background-color 0.2s, border-color 0.2s',
        '&:hover': onClick
          ? {
              bgcolor: 'action.hover',
              borderColor: 'primary.main',
            }
          : undefined,
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          flexShrink: 0,
          borderRadius: 1.5,
          overflow: 'hidden',
          bgcolor: 'rgba(255, 75, 141, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {game.imageUrl ? (
          <Box
            component="img"
            src={game.imageUrl}
            alt={game.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <SportsEsportsIcon sx={{ fontSize: 32, color: 'primary.main', opacity: 0.7 }} />
        )}
      </Box>

      <Box sx={{ minWidth: 0, flex: 1, pt: 0.25 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
          {game.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.45,
          }}
        >
          {game.description}
        </Typography>
      </Box>
    </Box>
  );
};

export default GameListItem;
