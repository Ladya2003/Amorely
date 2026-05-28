import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import { getGameById } from '../components/Chat/gamesData';
import GameLeaderboard from '../components/Games/GameLeaderboard';
import GeoDailyLimitDialog from '../components/Games/GeoDailyLimitDialog';
import {
  fetchGameDetails,
  fetchGameLeaderboard,
  fetchGeoGameState,
  type GameDetailsResponse,
  type GeoGameState,
  type LeaderboardEntry,
} from '../services/gamesService';

const getGamePageTabIndex = (tab: string | null | undefined, gameAvailable: boolean) =>
  tab === 'leaderboard' && gameAvailable ? 1 : 0;

type GeoGameInfoLocationState = {
  showDailyLimitDialog?: boolean;
};

const GamePage: React.FC = () => {
  const { gameId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const staticGame = getGameById(gameId);

  const [tab, setTab] = useState(() =>
    getGamePageTabIndex(searchParams.get('tab'), staticGame?.available ?? false)
  );
  const [details, setDetails] = useState<GameDetailsResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [geoState, setGeoState] = useState<GeoGameState | null>(null);
  const [geoDailyLimitDialogOpen, setGeoDailyLimitDialogOpen] = useState(false);
  const [pendingGeoDailyLimitDialog, setPendingGeoDailyLimitDialog] = useState(false);

  useEffect(() => {
    if (!staticGame) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const gameDetails = await fetchGameDetails(gameId);
        setDetails(gameDetails);
      } catch {
        setDetails({
          game: staticGame,
          hasPartner: false,
          partner: null,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [gameId, staticGame]);

  useEffect(() => {
    setTab(getGamePageTabIndex(searchParams.get('tab'), staticGame?.available ?? false));
  }, [searchParams, staticGame?.available]);

  useEffect(() => {
    if (tab !== 1 || !staticGame?.available) {
      return;
    }

    const loadLeaderboard = async () => {
      setLeaderboardLoading(true);
      try {
        const entries = await fetchGameLeaderboard(gameId);
        setLeaderboard(entries);
      } catch {
        setLeaderboard([]);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    loadLeaderboard();
  }, [tab, gameId, staticGame?.available]);

  const hasPartner = details?.hasPartner ?? false;

  const refreshGeoState = useCallback(async () => {
    if (gameId !== 'geo' || !hasPartner) {
      setGeoState(null);
      return;
    }

    try {
      const data = await fetchGeoGameState();
      setGeoState(data.state);
    } catch {
      setGeoState(null);
    }
  }, [gameId, hasPartner]);

  useEffect(() => {
    refreshGeoState();
  }, [refreshGeoState]);

  useEffect(() => {
    const navState = location.state as GeoGameInfoLocationState | null;
    if (gameId !== 'geo' || !navState?.showDailyLimitDialog) {
      return;
    }

    setPendingGeoDailyLimitDialog(true);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [gameId, location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if (!pendingGeoDailyLimitDialog || !geoState?.dailyLimitReached) {
      return;
    }
    setGeoDailyLimitDialogOpen(true);
    setPendingGeoDailyLimitDialog(false);
  }, [pendingGeoDailyLimitDialog, geoState]);

  if (!staticGame) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ mb: 2 }}>Игра не найдена</Typography>
        <Button onClick={() => navigate('/chat?tab=games')}>К списку игр</Button>
      </Box>
    );
  }

  const game = details?.game || staticGame;
  const canPlay = game.available && (!game.requiresPartner || hasPartner);
  const geoDailyLimitReached = gameId === 'geo' && Boolean(geoState?.dailyLimitReached);
  const playBlockedReason = !game.available
    ? 'Игра скоро появится'
    : game.requiresPartner && !hasPartner
      ? 'Добавьте партнёра в настройках, чтобы играть вместе'
      : null;

  const handleCloseGeoDailyLimitDialog = () => {
    setGeoDailyLimitDialogOpen(false);
    refreshGeoState();
  };

  const handlePlay = () => {
    if (!canPlay) {
      return;
    }

    if (geoDailyLimitReached && geoState) {
      setGeoDailyLimitDialogOpen(true);
      return;
    }

    navigate(`/chat/games/${gameId}/play`);
  };

  const handleTabChange = (_event: React.SyntheticEvent, value: number) => {
    setTab(value);

    const nextParams = new URLSearchParams(searchParams);
    if (value === 1) {
      nextParams.set('tab', 'leaderboard');
    } else {
      nextParams.delete('tab');
    }
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box
        sx={{
          px: 1,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
        <IconButton onClick={() => navigate('/chat?tab=games')} aria-label="Назад">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }} noWrap>
          {game.name}
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Игра" />
        <Tab label="Рейтинг" disabled={!game.available} />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : tab === 0 ? (
          <Stack spacing={2} sx={{ maxWidth: 640, mx: 'auto' }}>
            <Box
              component="img"
              src={game.imageUrl}
              alt={game.name}
              sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 2 }}
            />

            <Typography variant="body1" color="text.secondary">
              {game.description}
            </Typography>

            {game.rulesImages.length > 0 && (
              <Stack spacing={1.5}>
                {game.rulesImages.map((imageUrl) => (
                  <Box
                    key={imageUrl}
                    component="img"
                    src={imageUrl}
                    alt=""
                    sx={{ width: '100%', borderRadius: 2, objectFit: 'cover' }}
                  />
                ))}
              </Stack>
            )}

            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {game.rules.map((rule) => (
                <Typography key={rule} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {rule}
                </Typography>
              ))}
            </Box>

            {playBlockedReason && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 75, 141, 0.08)',
                }}
              >
                <LockIcon color="primary" fontSize="small" />
                <Typography variant="body2">
                  {playBlockedReason}
                  {game.requiresPartner && !hasPartner && (
                    <>
                      {' '}
                      <Link component={RouterLink} to="/settings">
                        Перейти в настройки
                      </Link>
                    </>
                  )}
                </Typography>
              </Box>
            )}

            {geoDailyLimitReached && geoState && (
              <Typography variant="body2" color="text.secondary">
                Сегодня вы угадали все {geoState.maxRoundsPerDay} мест. Новые раунды откроются позже.
              </Typography>
            )}

            <Button variant="contained" size="large" disabled={!canPlay} onClick={handlePlay}>
              Играть
            </Button>
          </Stack>
        ) : leaderboardLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ maxWidth: 640, mx: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Глобальный рейтинг пар по общему счёту
            </Typography>
            <GameLeaderboard entries={leaderboard} />
          </Box>
        )}
      </Box>

      {gameId === 'geo' && geoState && (
        <GeoDailyLimitDialog
          open={geoDailyLimitDialogOpen}
          onClose={handleCloseGeoDailyLimitDialog}
          maxRoundsPerDay={geoState.maxRoundsPerDay}
          secondsUntilNextRounds={geoState.secondsUntilNextRounds}
        />
      )}
    </Box>
  );
};

export default GamePage;
