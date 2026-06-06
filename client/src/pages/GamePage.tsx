import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { getGameRules, getGeoAttributionRules } from '../localization/gameHelpers';
import GameLeaderboard from '../components/Games/GameLeaderboard';
import GeoDailyLimitDialog from '../components/Games/GeoDailyLimitDialog';
import DailyResetBadge from '../components/Games/DailyResetBadge';
import DailyResetInfoDialog from '../components/Games/DailyResetInfoDialog';
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
  const { t } = useTranslation();
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
  const [dailyResetInfoOpen, setDailyResetInfoOpen] = useState(false);

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
          dailyReset: null,
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
        <Typography sx={{ mb: 2 }}>{t('games.page.notFound')}</Typography>
        <Button onClick={() => navigate('/chat?tab=games')}>{t('games.page.backToList')}</Button>
      </Box>
    );
  }

  const game = details?.game || staticGame;
  const gameName = t(`games.${game.id}.name`, { defaultValue: game.name });
  const gameDescription = t(`games.${game.id}.description`, { defaultValue: game.description });
  const canPlay = game.available && (!game.requiresPartner || hasPartner);
  const geoDailyLimitReached = gameId === 'geo' && Boolean(geoState?.dailyLimitReached);
  const showDailyReset = Boolean(details?.dailyReset?.hasPlayed);
  const playBlockedReason = !game.available
    ? t('games.page.comingSoon')
    : game.requiresPartner && !hasPartner
      ? t('games.page.addPartner')
      : null;
  const displayRules =
    game.id === 'geo'
      ? [...getGameRules(t, game.id, game.rules), ...getGeoAttributionRules(t)]
      : getGameRules(t, game.id, game.rules);

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
        <IconButton onClick={() => navigate('/chat?tab=games')} aria-label={t('games.common.back')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1, color: 'text.primary' }} noWrap>
          {gameName}
        </Typography>
        {showDailyReset && (
          <DailyResetBadge onClick={() => setDailyResetInfoOpen(true)} />
        )}
      </Box>

      <Tabs
        value={tab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={t('games.page.tabGame')} />
        <Tab label={t('games.page.tabLeaderboard')} disabled={!game.available} />
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
              alt={gameName}
              sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 2 }}
            />

            <Typography variant="body1" color="text.secondary">
              {gameDescription}
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
              {displayRules.map((rule) => (
                <Typography key={rule} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {rule}
                </Typography>
              ))}
            </Box>
          </Stack>
        ) : leaderboardLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ maxWidth: 640, mx: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('games.page.leaderboardSubtitle')}
            </Typography>
            <GameLeaderboard entries={leaderboard} emptyMessage={t('games.leaderboard.empty')} />
          </Box>
        )}
      </Box>

      {!loading && tab === 0 && (
        <Box
          sx={{
            flexShrink: 0,
            px: 2,
            pt: 1.5,
            pb: 'max(16px, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <Stack spacing={1.5} sx={{ maxWidth: 640, mx: 'auto' }}>
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
                        {t('games.common.goToSettings')}
                      </Link>
                    </>
                  )}
                </Typography>
              </Box>
            )}

            {geoDailyLimitReached && geoState && (
              <Typography variant="body2" color="text.secondary">
                {t('games.page.geoDailyLimitHint', { count: geoState.maxRoundsPerDay })}
              </Typography>
            )}

            <Button variant="contained" size="large" fullWidth disabled={!canPlay} onClick={handlePlay}>
              {t('games.page.play')}
            </Button>
          </Stack>
        </Box>
      )}

      {gameId === 'geo' && geoState && (
        <GeoDailyLimitDialog
          open={geoDailyLimitDialogOpen}
          onClose={handleCloseGeoDailyLimitDialog}
          maxRoundsPerDay={geoState.maxRoundsPerDay}
          secondsUntilNextRounds={geoState.secondsUntilNextRounds}
        />
      )}

      <DailyResetInfoDialog
        open={dailyResetInfoOpen}
        onClose={() => setDailyResetInfoOpen(false)}
        gameName={gameName}
      />
    </Box>
  );
};

export default GamePage;
