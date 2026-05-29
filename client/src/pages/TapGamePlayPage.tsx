import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import {
  fetchTapGameState,
  postTapGameTap,
  type TapGameState,
  type TapShopItem,
} from '../services/gamesService';
import TapGameShop from '../components/Games/TapGameShop';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import { fireRoundConfetti } from '../utils/roundConfetti';

interface TapFloatText {
  id: number;
  offsetX: number;
  value: number;
}

const FLOAT_ANIMATION_MS = 750;

const showRoundCompletionToast = (
  setToast: React.Dispatch<
    React.SetStateAction<{ open: boolean; message: string; severity: 'info' | 'error' | 'success' }>
  >,
  roundCompletionBonus?: number
) => {
  if (!roundCompletionBonus || roundCompletionBonus <= 0) {
    return;
  }

  fireRoundConfetti();

  setToast({
    open: true,
    message: `Раунд пройден! +${roundCompletionBonus} баллов`,
    severity: 'success',
  });
};

const TapGamePlayPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<TapGameState | null>(null);
  const [shopItems, setShopItems] = useState<TapShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopOpen, setShopOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' as 'info' | 'error' | 'success' });
  const [floatTexts, setFloatTexts] = useState<TapFloatText[]>([]);
  const floatIdRef = useRef(0);

  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const spawnFloatText = useCallback((value: number) => {
    const id = floatIdRef.current + 1;
    floatIdRef.current = id;
    const offsetX = Math.round((Math.random() - 0.5) * 48);

    setFloatTexts((prev) => [...prev, { id, offsetX, value }]);

    window.setTimeout(() => {
      setFloatTexts((prev) => prev.filter((item) => item.id !== id));
    }, FLOAT_ANIMATION_MS);
  }, []);

  const loadState = useCallback(async () => {
    try {
      const data = await fetchTapGameState();
      setState(data.state);
      setShopItems(data.shopItems);
    } catch (error: any) {
      if (error?.response?.data?.code === 'NO_PARTNER') {
        setBlockedReason(
          error.response.data.error || 'Для игры нужен партнёр. Добавьте его в настройках профиля.'
        );
        return;
      }
      setToast({
        open: true,
        message: 'Не удалось загрузить игру',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    const socket = socketService.getSocket() || socketService.initialize(user._id);
    socket.emit('tap_game_subscribe');

    const handleState = (payload: { state: TapGameState; roundCompletionBonus?: number }) => {
      setState(payload.state);
      showRoundCompletionToast(setToast, payload.roundCompletionBonus);
    };

    const handleError = (payload: { message?: string; code?: string }) => {
      if (payload.code === 'NO_PARTNER') {
        setBlockedReason(payload.message || 'Для игры нужен партнёр. Добавьте его в настройках профиля.');
        return;
      }
      if (payload.message) {
        setToast({ open: true, message: payload.message, severity: 'error' });
      }
    };

    socket.on('tap_game_state', handleState);
    socket.on('tap_game_error', handleError);

    return () => {
      socket.off('tap_game_state', handleState);
      socket.off('tap_game_error', handleError);
    };
  }, [user?._id]);

  const handleTap = async () => {
    if (!state?.isMyTurn) {
      return;
    }

    const progressGain =
      state.activeBoost && state.activeBoost.remainingUses > 0
        ? state.activeBoost.multiplier
        : 1;

    spawnFloatText(progressGain);

    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('tap_game_tap');
      } else {
        const result = await postTapGameTap();
        setState(result.state);
        showRoundCompletionToast(setToast, result.roundCompletionBonus);
      }
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || 'Не удалось нажать',
        severity: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (blockedReason) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', maxWidth: 420, mx: 'auto', mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Нужен партнёр
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {blockedReason}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="contained" onClick={() => navigate('/settings')}>
            Перейти в настройки
          </Button>
          <Button onClick={() => navigate('/chat/games/tap')}>Назад</Button>
        </Stack>
      </Box>
    );
  }

  if (!state) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Не удалось загрузить игру
        </Typography>
        <Button onClick={() => navigate('/chat/games/tap')}>Назад</Button>
      </Box>
    );
  }

  const myProgress = Math.min(100, (state.myTapsThisRound / state.targetTaps) * 100);
  const partnerProgress = Math.min(100, (state.partnerProgressThisRound / state.targetTaps) * 100);

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
        <IconButton onClick={() => navigate('/chat/games/tap')} aria-label="Назад">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Раунд {state.round}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Цель: {state.targetTaps} нажатий · Баллы: {state.points}
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<StorefrontIcon />}
          onClick={() => setShopOpen(true)}
        >
          Магазин
        </Button>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Stack spacing={2} sx={{ width: '100%', maxWidth: 420 }}>
          {state.activeBoost && (
            <Typography variant="body2" color="primary.main" align="center">
              Активно ×{state.activeBoost.multiplier} · осталось {state.activeBoost.remainingUses} наж.
            </Typography>
          )}

          {state.isMyTurn ? (
            <Typography
              variant="body2"
              color="primary.main"
              align="center"
              sx={{ fontWeight: 600 }}
            >
              Нажимайте на розовый блок
            </Typography>
          ) : state.waitingForPartner ? (
            <Typography variant="body2" color="text.secondary" align="center">
              Вы закончили — ждём партнёра
            </Typography>
          ) : null}

          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              overflow: 'visible',
              '@keyframes tapFloatUp': {
                '0%': {
                  opacity: 1,
                  transform: 'translate(-50%, 0) scale(1)',
                },
                '100%': {
                  opacity: 0,
                  transform: 'translate(-50%, -64px) scale(1.15)',
                },
              },
            }}
          >
            {floatTexts.map((floatText) => (
              <Typography
                key={floatText.id}
                component="span"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: `calc(50% + ${floatText.offsetX}px)`,
                  transform: 'translateX(-50%)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  lineHeight: 1,
                  textShadow: '0 2px 8px rgba(0,0,0,0.45)',
                  pointerEvents: 'none',
                  zIndex: 3,
                  animation: `tapFloatUp ${FLOAT_ANIMATION_MS}ms ease-out forwards`,
                }}
              >
                +{floatText.value}
              </Typography>
            ))}

            <Box
              component="button"
              type="button"
              onClick={handleTap}
              disabled={!state.isMyTurn}
              aria-label={
                state.isMyTurn
                  ? 'Нажать на блок'
                  : state.waitingForPartner
                    ? 'Вы уже завершили свою часть раунда'
                    : 'Блок недоступен'
              }
              sx={{
                position: 'relative',
                display: 'block',
                width: '100%',
                maxWidth: 320,
                aspectRatio: '1 / 1',
                flexShrink: 0,
                border: state.isMyTurn ? '3px solid' : '2px solid',
                borderColor: state.isMyTurn ? 'primary.main' : 'divider',
                borderRadius: 4,
                p: 0,
                overflow: 'hidden',
                cursor: state.isMyTurn ? 'pointer' : 'not-allowed',
                opacity: state.isMyTurn ? 1 : 0.55,
                transition: 'transform 0.1s ease, box-shadow 0.2s ease, opacity 0.2s ease',
                boxShadow: state.isMyTurn
                  ? '0 12px 32px rgba(255, 75, 141, 0.45)'
                  : '0 4px 16px rgba(0,0,0,0.12)',
                animation: state.isMyTurn ? 'tapBlockPulse 1.6s ease-in-out infinite' : 'none',
                '@keyframes tapBlockPulse': {
                  '0%, 100%': { boxShadow: '0 12px 32px rgba(255, 75, 141, 0.35)' },
                  '50%': { boxShadow: '0 16px 40px rgba(255, 75, 141, 0.65)' },
                },
                '&:active': state.isMyTurn ? { transform: 'scale(0.94)' } : undefined,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  bgcolor: state.block.color || 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {state.block.imageUrl && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${state.block.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: 0.35,
                    }}
                  />
                )}
                {state.isMyTurn && (
                  <Typography
                    variant="h5"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      color: '#fff',
                      fontWeight: 800,
                      textShadow: '0 2px 8px rgba(0,0,0,0.35)',
                      pointerEvents: 'none',
                    }}
                  >
                    Жми!
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Вы: {state.myTapsThisRound}/{state.targetTaps}
            </Typography>
            <LinearProgress variant="determinate" value={myProgress} sx={{ height: 8, borderRadius: 999 }} />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Партнёр: {state.partnerProgressThisRound}/{state.targetTaps}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={partnerProgress}
              color="secondary"
              sx={{ height: 8, borderRadius: 999 }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary" align="center">
            Всего нажатий пары: {state.totalTaps}
          </Typography>
        </Stack>
      </Box>

      <TapGameShop
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        shopItems={shopItems}
        state={state}
        onPurchased={setState}
        onError={(message: string) => setToast({ open: true, message, severity: 'error' })}
      />

      <CustomSnackbar
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default TapGamePlayPage;
