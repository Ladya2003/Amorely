import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import GameListItem from './GameListItem';
import DailyResetBadge from '../Games/DailyResetBadge';
import DailyResetInfoDialog from '../Games/DailyResetInfoDialog';
import TapGameListBadge from '../Games/TapGameListBadge';
import { GAMES } from './gamesData';
import { getLocalizedGameName } from '../../localization/gameHelpers';
import socketService from '../../services/socketService';
import {
  fetchGamesDailyReset,
  fetchTapGameState,
  type DailyResetGameId,
  type GameDailyResetMap,
  type TapGameState,
} from '../../services/gamesService';
import { getMsUntilUtcMidnight } from '../../utils/dailyReset';
import { getChatListSearchFieldSx } from './chatListStyles';
import {
  getGamesListBadgeWrapSx,
  getGamesListComingSoonChipSx,
  getGamesListEmptyStateSx,
  getGamesListRootSx,
  getGamesListScrollSx,
  getGamesListSearchWrapSx,
  getGamesListStackSx,
} from '../Games/gamesListStyles';

const DAILY_RESET_GAME_IDS = new Set<DailyResetGameId>(['geo', 'draw', 'quiz']);

const Games: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dailyReset, setDailyReset] = useState<GameDailyResetMap | null>(null);
  const [tapState, setTapState] = useState<TapGameState | null>(null);
  const [dailyResetInfo, setDailyResetInfo] = useState<{ open: boolean; gameName?: string }>({
    open: false,
  });

  const loadDailyReset = useCallback(async () => {
    try {
      const data = await fetchGamesDailyReset();
      setDailyReset(data);
    } catch {
      setDailyReset(null);
    }
  }, []);

  const loadTapState = useCallback(async () => {
    try {
      const data = await fetchTapGameState();
      setTapState(data.state);
    } catch {
      setTapState(null);
    }
  }, []);

  useEffect(() => {
    loadDailyReset();
    loadTapState();
  }, [loadDailyReset, loadTapState]);

  useEffect(() => {
    const msUntilReset = getMsUntilUtcMidnight();
    const timerId = window.setTimeout(() => {
      loadDailyReset();
    }, msUntilReset + 1_000);

    return () => window.clearTimeout(timerId);
  }, [dailyReset, loadDailyReset]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDailyReset();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadDailyReset]);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    const socket = socketService.getSocket() || socketService.initialize(user._id);
    socket.emit('tap_game_subscribe');

    const handleTapState = (payload: { state: TapGameState }) => {
      setTapState(payload.state);
    };

    socket.on('tap_game_state', handleTapState);

    return () => {
      socket.off('tap_game_state', handleTapState);
    };
  }, [user?._id]);

  const filteredGames = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return GAMES;
    }
    return GAMES.filter((game) => {
      const name = getLocalizedGameName(t, game.id, game.name);
      return name.toLowerCase().includes(query);
    });
  }, [searchQuery, t]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <Box sx={getGamesListRootSx()}>
      <Box sx={getGamesListSearchWrapSx()}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('games.list.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={getChatListSearchFieldSx(theme)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  aria-label={t('games.list.clearSearch')}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
      </Box>

      <Box sx={getGamesListScrollSx()}>
        {filteredGames.length === 0 ? (
          <Box sx={getGamesListEmptyStateSx(theme)}>
            <SportsEsportsIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2, opacity: 0.75 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
              {searchQuery.trim() ? t('games.list.notFound') : t('games.list.emptyList')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery.trim() ? t('games.list.tryDifferentQuery') : t('games.list.emptyHint')}
            </Typography>
          </Box>
        ) : (
          <Box sx={getGamesListStackSx()}>
            {filteredGames.map((game) => {
              const showDailyReset =
                DAILY_RESET_GAME_IDS.has(game.id as DailyResetGameId) &&
                Boolean(dailyReset?.[game.id as DailyResetGameId]?.hasPlayed);
              const showTapProgress = game.id === 'tap' && tapState?.hasPartner;
              const gameName = getLocalizedGameName(t, game.id, game.name);

              return (
                <Box key={game.id} sx={{ position: 'relative' }}>
                  <GameListItem
                    game={game}
                    onClick={() => navigate(`/chat/games/${game.id}`)}
                    reserveTopRightSpace={showTapProgress || showDailyReset || !game.available}
                  />
                  {showTapProgress && tapState && (
                    <Box sx={getGamesListBadgeWrapSx()}>
                      <TapGameListBadge state={tapState} />
                    </Box>
                  )}
                  {showDailyReset && (
                    <Box sx={getGamesListBadgeWrapSx()}>
                      <DailyResetBadge
                        onClick={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          setDailyResetInfo({ open: true, gameName });
                        }}
                      />
                    </Box>
                  )}
                  {!game.available && (
                    <Chip
                      icon={<LockIcon sx={{ fontSize: '14px !important' }} />}
                      label={t('games.list.comingSoon')}
                      size="small"
                      sx={getGamesListComingSoonChipSx(theme)}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <DailyResetInfoDialog
        open={dailyResetInfo.open}
        onClose={() => setDailyResetInfo({ open: false })}
        gameName={dailyResetInfo.gameName}
      />
    </Box>
  );
};

export default Games;
