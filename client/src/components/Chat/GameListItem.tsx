import React from 'react';
import { Box, ListItemButton, Typography } from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import type { Game } from './gamesData';

interface GameListItemProps {
  game: Game;
  onClick?: (game: Game) => void;
  reserveTopRightSpace?: boolean;
}

const GameListItem: React.FC<GameListItemProps> = ({ game, onClick, reserveTopRightSpace }) => {
  return (
    <ListItemButton
      onClick={() => onClick?.(game)}
      disabled={!onClick}
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
        color: 'text.primary',
        textAlign: 'left',
        transition: 'background-color 0.2s, border-color 0.2s',
        WebkitAppearance: 'none',
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

      <Box sx={{ minWidth: 0, flex: 1, pt: 0.25, pr: reserveTopRightSpace ? 5.5 : 0 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 0.5, color: 'inherit' }}
          noWrap
        >
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
    </ListItemButton>
  );
};

export default GameListItem;
