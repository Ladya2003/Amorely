import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import GameListItem from './GameListItem';
import DailyResetBadge from '../Games/DailyResetBadge';
import { GAMES } from './gamesData';
import {
  fetchGamesDailyReset,
  type DailyResetGameId,
  type GameDailyResetMap,
} from '../../services/gamesService';

const DAILY_RESET_GAME_IDS = new Set<DailyResetGameId>(['geo', 'draw', 'quiz']);

const Games: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dailyReset, setDailyReset] = useState<GameDailyResetMap | null>(null);

  useEffect(() => {
    const loadDailyReset = async () => {
      try {
        const data = await fetchGamesDailyReset();
        setDailyReset(data);
      } catch {
        setDailyReset(null);
      }
    };

    loadDailyReset();
  }, []);

  const filteredGames = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return GAMES;
    }
    return GAMES.filter((game) => game.name.toLowerCase().includes(query));
  }, [searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          px: 2,
          pb: 1,
          pt: 1,
          flexShrink: 0,
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Поиск по названию игры"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch} aria-label="Очистить поиск">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          px: 2,
          py: 2,
        }}
      >
        {filteredGames.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              minHeight: 240,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 2,
            }}
          >
            <SportsEsportsIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.6 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 0.5 }}>
              {searchQuery.trim() ? 'Игры не найдены' : 'Нет игр в списке'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery.trim()
                ? 'Попробуйте изменить запрос'
                : 'Здесь будет список игр для вас и вашей пары'}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {filteredGames.map((game) => {
              const showDailyReset =
                DAILY_RESET_GAME_IDS.has(game.id as DailyResetGameId) &&
                Boolean(dailyReset?.[game.id as DailyResetGameId]?.hasPlayed);

              return (
              <Box key={game.id} sx={{ position: 'relative' }}>
                <GameListItem
                  game={game}
                  onClick={() => navigate(`/chat/games/${game.id}`)}
                />
                {showDailyReset && (
                  <Box sx={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'none' }}>
                    <DailyResetBadge />
                  </Box>
                )}
                {!game.available && (
                  <Chip
                    icon={<LockIcon sx={{ fontSize: '14px !important' }} />}
                    label="Скоро"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: 'background.paper',
                    }}
                  />
                )}
              </Box>
            );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default Games;
