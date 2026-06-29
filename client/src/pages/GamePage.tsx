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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getGameById } from '../components/Chat/gamesData';
import { getGameRules, getGeoAttributionRules } from '../localization/gameHelpers';
import GameLeaderboard from '../components/Games/GameLeaderboard';
import GeoDailyLimitDialog from '../components/Games/GeoDailyLimitDialog';
import DailyResetBadge from '../components/Games/DailyResetBadge';
import DailyResetInfoDialog from '../components/Games/DailyResetInfoDialog';
import { getChatTabToggleGroupSx } from '../components/Chat/chatListStyles';
import {
  gamePageEnterSx,
  gamePageSectionEnterSx,
  gamePageTabContentEnterSx,
  getGamePageBlockedBannerSx,
  getGamePageContentStackSx,
  getGamePageDescriptionSx,
  getGamePageFooterSx,
  getGamePageHeaderGlowWrapSx,
  getGamePageHeaderIconButtonSx,
  getGamePageHeaderSx,
  getGamePageHeaderTitleSx,
  getGamePageHeroImageSx,
  getGamePageLoadingSx,
  getGamePageRootSx,
  getGamePageRulesCardSx,
  getGamePageRulesTitleSx,
  getGamePageScrollSx,
  getGamePageTabsWrapSx,
  getGameLeaderboardSubtitleSx,
} from '../components/Games/gamePageStyles';
import {
  getGamePlayBlockedCardSx,
  getGamePlayBlockedPanelSx,
  getGamePlayPrimaryButtonSx,
} from '../components/Games/gamePlayPageStyles';
import {
  fetchGameDetails,
  fetchGameLeaderboard,
  fetchGeoGameState,
  type GameDetailsResponse,
  type GeoGameState,
  type LeaderboardEntry,
} from '../services/gamesService';
import { playGamePlayButtonSound, unlockGameAudio } from '../utils/gameSounds';

const getGamePageTabIndex = (tab: string | null | undefined, gameAvailable: boolean) =>
  tab === 'leaderboard' && gameAvailable ? 1 : 0;

type GeoGameInfoLocationState = {
  showDailyLimitDialog?: boolean;
};

const GamePage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
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

    setLoading(true);
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
      <Box sx={getGamePlayBlockedPanelSx(theme)}>
        <Box sx={getGamePlayBlockedCardSx(theme)}>
          <Typography sx={{ mb: 2, fontWeight: 700 }}>{t('games.page.notFound')}</Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/chat?tab=games')}
            sx={getGamePlayPrimaryButtonSx()}
          >
            {t('games.page.backToList')}
          </Button>
        </Box>
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

    unlockGameAudio();
    void playGamePlayButtonSound();
    navigate(`/chat/games/${gameId}/play`);
  };

  const handleTabChange = (_event: React.MouseEvent<HTMLElement>, value: number | null) => {
    if (value === null) {
      return;
    }

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
    <Box key={gameId} sx={getGamePageRootSx(theme)}>
      <Box sx={(muiTheme) => getGamePageHeaderGlowWrapSx(muiTheme)}>
        <Box sx={{ position: 'relative', zIndex: 1, ...gamePageEnterSx }}>
          <Box sx={getGamePageHeaderSx(theme)}>
            <IconButton
              onClick={() => navigate('/chat?tab=games')}
              aria-label={t('games.common.back')}
              size="small"
              sx={getGamePageHeaderIconButtonSx(theme)}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography component="h1" sx={getGamePageHeaderTitleSx()} noWrap>
              {gameName}
            </Typography>
            {showDailyReset && (
              <DailyResetBadge onClick={() => setDailyResetInfoOpen(true)} />
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={getGamePageTabsWrapSx()}>
        <ToggleButtonGroup
          value={tab}
          exclusive
          fullWidth
          onChange={handleTabChange}
          aria-label={t('games.page.tabGame')}
          size="small"
          sx={getChatTabToggleGroupSx}
        >
          <ToggleButton value={0}>
            <SportsEsportsIcon sx={{ fontSize: 18 }} />
            {t('games.page.tabGame')}
          </ToggleButton>
          <ToggleButton value={1} disabled={!game.available}>
            <EmojiEventsIcon sx={{ fontSize: 18 }} />
            {t('games.page.tabLeaderboard')}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={getGamePageScrollSx()}>
        {loading ? (
          <Box sx={getGamePageLoadingSx(theme)}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box key={tab} sx={{ ...gamePageTabContentEnterSx, ...getGamePageContentStackSx() }}>
            {tab === 0 ? (
              <>
                <Box
                  component="img"
                  src={game.imageUrl}
                  alt={gameName}
                  sx={{
                    ...getGamePageHeroImageSx(theme),
                    ...gamePageSectionEnterSx(40),
                  }}
                />

                <Typography sx={{ ...getGamePageDescriptionSx(), ...gamePageSectionEnterSx(90) }}>
                  {gameDescription}
                </Typography>

                {game.rulesImages.length > 0 && (
                  <Stack spacing={1.5} sx={gamePageSectionEnterSx(130)}>
                    {game.rulesImages.map((imageUrl) => (
                      <Box
                        key={imageUrl}
                        component="img"
                        src={imageUrl}
                        alt=""
                        sx={getGamePageHeroImageSx(theme)}
                      />
                    ))}
                  </Stack>
                )}

                <Box sx={{ ...getGamePageRulesCardSx(theme), ...gamePageSectionEnterSx(170) }}>
                  <Typography sx={getGamePageRulesTitleSx()}>
                    {t('games.page.rulesTitle', { defaultValue: 'Правила' })}
                  </Typography>
                  <Box component="ul">
                    {displayRules.map((rule) => (
                      <Typography key={rule} component="li" variant="body2" color="text.secondary">
                        {rule}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </>
            ) : leaderboardLoading ? (
              <Box sx={getGamePageLoadingSx(theme)}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <>
                <Typography color="text.secondary" sx={getGameLeaderboardSubtitleSx()}>
                  {t('games.page.leaderboardSubtitle')}
                </Typography>
                <GameLeaderboard entries={leaderboard} emptyMessage={t('games.leaderboard.empty')} />
              </>
            )}
          </Box>
        )}
      </Box>

      {!loading && tab === 0 && (
        <Box sx={getGamePageFooterSx(theme)}>
          <Stack spacing={1.5} sx={{ maxWidth: 640, mx: 'auto' }}>
            {playBlockedReason && (
              <Box sx={getGamePageBlockedBannerSx(theme)}>
                <LockIcon color="primary" fontSize="small" sx={{ mt: 0.15 }} />
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

            <Button variant="contained" size="large" fullWidth disabled={!canPlay} onClick={handlePlay} sx={getGamePlayPrimaryButtonSx()}>
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
