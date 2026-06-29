import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, ListItemButton, Typography, useTheme } from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import type { Game } from './gamesData';
import {
  getGamesListDescriptionSx,
  getGamesListItemSx,
  getGamesListThumbSx,
  getGamesListTitleSx,
} from '../Games/gamesListStyles';

interface GameListItemProps {
  game: Game;
  onClick?: (game: Game) => void;
  reserveTopRightSpace?: boolean;
}

const GameListItem: React.FC<GameListItemProps> = ({ game, onClick, reserveTopRightSpace }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const gameName = t(`games.${game.id}.name`, { defaultValue: game.name });
  const gameDescription = t(`games.${game.id}.description`, { defaultValue: game.description });

  return (
    <ListItemButton
      onClick={() => onClick?.(game)}
      disabled={!onClick}
      sx={getGamesListItemSx(theme, { available: game.available })}
    >
      <Box sx={getGamesListThumbSx(theme)}>
        {game.imageUrl ? (
          <Box
            component="img"
            src={game.imageUrl}
            alt={gameName}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: game.available ? 1 : 0.72,
            }}
          />
        ) : (
          <SportsEsportsIcon sx={{ fontSize: 32, color: 'primary.main', opacity: 0.75 }} />
        )}
      </Box>

      <Box sx={{ minWidth: 0, flex: 1, pt: 0.25, pr: reserveTopRightSpace ? 5.5 : 0 }}>
        <Typography variant="subtitle1" sx={getGamesListTitleSx()} noWrap>
          {gameName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={getGamesListDescriptionSx()}>
          {gameDescription}
        </Typography>
      </Box>
    </ListItemButton>
  );
};

export default GameListItem;
