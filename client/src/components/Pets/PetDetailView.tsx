import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  IconButton,
  Button,
  LinearProgress,
  Paper,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import PanToolAltOutlinedIcon from '@mui/icons-material/PanToolAltOutlined';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import { alpha } from '@mui/material/styles';
import CustomSnackbar from '../UI/CustomSnackbar';
import CurrencyBadge from './CurrencyBadge';
import PetGiftDialog from './PetGiftDialog';
import PetLevelProgress from './PetLevelProgress';
import PetHatchOverlay from './PetHatchOverlay';
import PetOwnerBlock from './PetOwnerBlock';
import { fetchPet, levelUpPet, giftPet, petPet } from '../../services/petsService';
import type { Pet } from '../../services/petsService';
import { useAuth } from '../../contexts/AuthContext';
import {
  getNextUpgradeCost,
  getSubLevelMax,
} from '../../config/petCatalogShared';
import { getPublicAssetPath } from '../../utils/publicAssetPath';
import { emitCurrencyUpdated } from '../../utils/currencyEvents';

const StatBar: React.FC<{
  label: string;
  value: number;
  valueLabel?: React.ReactNode;
}> = ({ label, value, valueLabel }) => (
  <Box sx={{ mb: 1.5 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>
        {valueLabel ?? value}
      </Typography>
    </Box>
    <LinearProgress variant="determinate" value={value} sx={{ height: 8, borderRadius: 4 }} />
  </Box>
);

const HEART_POSITIONS = [
  { left: '44%', delay: '0ms', duration: '980ms', size: 30 },
  { left: '50%', delay: '140ms', duration: '1020ms', size: 26 },
  { left: '56%', delay: '280ms', duration: '960ms', size: 28 },
  { left: '47%', delay: '460ms', duration: '1080ms', size: 27 },
  { left: '53%', delay: '620ms', duration: '940ms', size: 25 },
  { left: '41%', delay: '820ms', duration: '1000ms', size: 28 },
  { left: '59%', delay: '980ms', duration: '1020ms', size: 26 },
] as const;
const AFFECTION_FLOAT_MS = 1800;

export interface PetDetailViewProps {
  petId: string;
  visitOnly?: boolean;
  embedded?: boolean;
  onBack?: () => void;
  onGifted?: () => void;
}

const PetDetailView: React.FC<PetDetailViewProps> = ({
  petId,
  visitOnly = false,
  embedded = false,
  onBack,
  onGifted,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [balance, setBalance] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [canLevelUp, setCanLevelUp] = useState(false);
  const [levelUpCost, setLevelUpCost] = useState<number | null>(null);
  const [isMainLevelUpgrade, setIsMainLevelUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [levelUpReveal, setLevelUpReveal] = useState<{ fromLevel: number; toLevel: number } | null>(
    null
  );
  const [isPetting, setIsPetting] = useState(false);
  const [pettingPending, setPettingPending] = useState(false);
  const [affectionFloat, setAffectionFloat] = useState<{ id: number; amount: number } | null>(null);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const pettingTimeoutRef = useRef<number | null>(null);
  const affectionFloatTimeoutRef = useRef<number | null>(null);
  const affectionFloatIdRef = useRef(0);

  const loadPet = useCallback(async () => {
    if (!petId) return;
    try {
      setLoading(true);
      const data = await fetchPet(petId, { visit: visitOnly });
      setPet(data.pet);
      setBalance(data.balance);
      setIsOwner(data.isOwner);
      setCanLevelUp(data.canLevelUp);
      setLevelUpCost(data.levelUpCost);
      setIsMainLevelUpgrade(data.isMainLevelUpgrade);
    } catch {
      setToast({ message: t('pets.notFound'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [petId, t, visitOnly]);

  useEffect(() => {
    void loadPet();
  }, [loadPet]);

  useEffect(
    () => () => {
      if (pettingTimeoutRef.current !== null) {
        window.clearTimeout(pettingTimeoutRef.current);
      }
      if (affectionFloatTimeoutRef.current !== null) {
        window.clearTimeout(affectionFloatTimeoutRef.current);
      }
    },
    []
  );

  const spawnAffectionFloat = useCallback((amount: number) => {
    if (amount <= 0) {
      return;
    }
    const nextId = affectionFloatIdRef.current + 1;
    affectionFloatIdRef.current = nextId;
    setAffectionFloat({ id: nextId, amount });
    if (affectionFloatTimeoutRef.current !== null) {
      window.clearTimeout(affectionFloatTimeoutRef.current);
    }
    affectionFloatTimeoutRef.current = window.setTimeout(() => {
      setAffectionFloat((prev) => (prev?.id === nextId ? null : prev));
      affectionFloatTimeoutRef.current = null;
    }, AFFECTION_FLOAT_MS);
  }, []);

  const handleLevelUp = async () => {
    if (!petId || !pet) return;
    const previousLevel = pet.level;
    setUpgrading(true);
    try {
      const result = await levelUpPet(petId);
      setPet(result.pet);
      setBalance(result.balance);
      setLevelUpCost(result.levelUpCost);
      setIsMainLevelUpgrade(result.isMainLevelUpgrade);
      setCanLevelUp(result.levelUpCost !== null);
      emitCurrencyUpdated(result.balance);
      if (result.mainLevelReached) {
        setLevelUpReveal({ fromLevel: previousLevel, toLevel: result.pet.level });
      } else {
        setToast({ message: t('pets.subLevelUpSuccess'), severity: 'success' });
      }
    } catch (err: any) {
      setToast({
        message: err.response?.data?.error || t('pets.levelUpFailed'),
        severity: 'error',
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleGift = async (recipientUserId: string) => {
    if (!petId) return;
    await giftPet(petId, recipientUserId);
    setToast({ message: t('pets.giftSuccess'), severity: 'success' });
    onGifted?.();
  };

  const handlePetting = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!petId || pettingPending) {
      return;
    }

    setPettingPending(true);
    setIsPetting(true);
    pettingTimeoutRef.current = window.setTimeout(() => {
      setIsPetting(false);
      void petPet(petId, { visitOnly })
        .then((result) => {
          const previousAffection = pet?.stats.affection ?? 0;
          const affectionGain = Math.max(0, result.pet.stats.affection - previousAffection);
          setPet(result.pet);
          setBalance(result.balance);
          spawnAffectionFloat(affectionGain);
          if (!visitOnly && result.awardedAmount > 0) {
            setToast({
              message: t('pets.petSuccess', { amount: result.awardedAmount }),
              severity: 'success',
            });
          }
        })
        .catch((error: any) => {
          const status = error?.response?.status;
          if (status === 429) {
            return;
          }
          setToast({
            message: error?.response?.data?.error || t('pets.petFailed'),
            severity: 'error',
          });
        })
        .finally(() => {
          setPettingPending(false);
          pettingTimeoutRef.current = null;
        });
    }, 3000);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: embedded ? 4 : 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!pet) {
    return (
      <Box sx={{ py: embedded ? 2 : 4, textAlign: 'center' }}>
        <Typography>{t('pets.notFound')}</Typography>
        {onBack && (
          <Button onClick={onBack} sx={{ mt: 2 }}>
            {t('common.back')}
          </Button>
        )}
      </Box>
    );
  }

  const subLevel = pet.subLevel ?? 0;
  const subLevelMax = pet.subLevelMax ?? getSubLevelMax(pet.level);
  const nextCost = levelUpCost ?? getNextUpgradeCost(pet.level, subLevel);
  const canAffordUpgrade = nextCost !== null && balance >= nextCost;
  const nextMainLevel = pet.level + 1;
  const ownerUsername = isOwner ? user?.username ?? pet.ownerUsername : pet.ownerUsername;
  const ownerAvatar = isOwner ? user?.avatar ?? pet.ownerAvatar : pet.ownerAvatar;
  const affectionDelta = pet.affectionDelta ?? 0;
  const affectionDeltaText = affectionDelta > 0 ? `+${affectionDelta}` : `${affectionDelta}`;
  const affectionDeltaColor =
    affectionDelta > 0 ? 'success.main' : affectionDelta < 0 ? 'error.main' : 'text.secondary';
  const imageMinHeight = embedded ? '36vh' : '50vh';

  return (
    <>
      {levelUpReveal && (
        <PetHatchOverlay
          species={pet.species}
          variant={pet.variant}
          petName={pet.name}
          fromLevel={levelUpReveal.fromLevel}
          toLevel={levelUpReveal.toLevel}
          onContinue={() => setLevelUpReveal(null)}
        />
      )}

      <Box sx={{ py: embedded ? 0 : 2, pb: embedded ? 1 : 10 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          {onBack && (
            <IconButton onClick={onBack} aria-label={t('common.back')} size="small">
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant={embedded ? 'h6' : 'h5'} fontWeight={700} sx={{ flex: 1 }}>
            {pet.name}
          </Typography>
          {!visitOnly && <CurrencyBadge balance={balance} size="small" />}
        </Box>

        <Box
          sx={{
            position: 'relative',
            bgcolor: '#FFF5F8',
            borderRadius: 3,
            mb: 2,
            minHeight: imageMinHeight,
            overflow: 'hidden',
          }}
        >
          <Box
            component="img"
            src={getPublicAssetPath(pet.imageUrl)}
            alt={pet.name}
            sx={{
              width: '100%',
              height: '100%',
              minHeight: imageMinHeight,
              objectFit: 'cover',
              objectPosition: 'center center',
              transform: 'scale(1.35)',
              display: 'block',
            }}
          />
          <IconButton
            aria-label={t('pets.petAction')}
            onClick={handlePetting}
            disabled={pettingPending}
            sx={(theme) => ({
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 2,
              width: 44,
              height: 44,
              bgcolor: alpha(theme.palette.primary.dark, 0.84),
              color: theme.palette.primary.contrastText,
              border: `1px solid ${alpha(theme.palette.primary.contrastText, 0.2)}`,
              boxShadow: `0 3px 12px ${alpha(theme.palette.common.black, 0.25)}`,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.dark, 0.95),
              },
              '&.Mui-disabled': {
                bgcolor: alpha(theme.palette.primary.dark, 0.55),
                color: alpha(theme.palette.primary.contrastText, 0.78),
              },
            })}
          >
            <PanToolAltOutlinedIcon sx={{ fontSize: 24 }} />
          </IconButton>
          {isPetting && (
            <Box
              sx={{
                pointerEvents: 'none',
                position: 'absolute',
                top: 16,
                left: 0,
                right: 0,
                zIndex: 2,
                '@keyframes petHeartRiseDetail': {
                  '0%': { transform: 'translate(-50%, 0) scale(0.65)', opacity: 0 },
                  '22%': { opacity: 1 },
                  '100%': { transform: 'translate(-50%, -52px) scale(1.15)', opacity: 0 },
                },
              }}
            >
              {HEART_POSITIONS.map((heart) => (
                <Box
                  key={`${heart.left}-${heart.delay}`}
                  component="span"
                  sx={(theme) => ({
                    position: 'absolute',
                    left: heart.left,
                    top: 0,
                    color: alpha(theme.palette.error.main, 0.92),
                    fontSize: heart.size,
                    lineHeight: 1,
                    animationName: 'petHeartRiseDetail',
                    animationDuration: heart.duration,
                    animationTimingFunction: 'ease-out',
                    animationDelay: heart.delay,
                    animationIterationCount: 'infinite',
                  })}
                >
                  ❤
                </Box>
              ))}
            </Box>
          )}
          {affectionFloat && (
            <Box
              sx={{
                pointerEvents: 'none',
                position: 'absolute',
                top: '24%',
                left: '50%',
                zIndex: 3,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.25,
                py: 0.55,
                borderRadius: 2.5,
                bgcolor: 'rgba(20, 20, 24, 0.82)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.38)',
                '@keyframes affectionFloatUp': {
                  '0%': {
                    opacity: 0,
                    transform: 'translate(-50%, 10px) scale(0.9)',
                  },
                  '18%': {
                    opacity: 1,
                    transform: 'translate(-50%, 0) scale(1)',
                  },
                  '76%': {
                    opacity: 1,
                    transform: 'translate(-50%, -28px) scale(1)',
                  },
                  '100%': {
                    opacity: 0,
                    transform: 'translate(-50%, -38px) scale(1.04)',
                  },
                },
                animation: `affectionFloatUp ${AFFECTION_FLOAT_MS}ms ease-in-out forwards`,
              }}
            >
              <Typography
                component="span"
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1rem',
                  lineHeight: 1,
                  textShadow: '0 2px 10px rgba(0,0,0,0.6)',
                }}
              >
                +{affectionFloat.amount}
              </Typography>
              <FavoriteRoundedIcon
                sx={{
                  fontSize: 18,
                  color: '#ff6b8a',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
                }}
              />
            </Box>
          )}
          <Box
            sx={{
              position: 'absolute',
              left: 12,
              bottom: 12,
              zIndex: 1,
              maxWidth: 'calc(100% - 24px)',
            }}
          >
            <PetOwnerBlock overlay username={ownerUsername} avatar={ownerAvatar} />
          </Box>
          {pet.giftedByUsername && (
            <Box
              sx={{
                position: 'absolute',
                right: 12,
                bottom: 12,
                zIndex: 1,
                maxWidth: 'calc(100% - 24px)',
              }}
            >
              <PetOwnerBlock
                overlay
                labelKey="pets.giftedByLabel"
                username={pet.giftedByUsername}
                avatar={pet.giftedByAvatar}
              />
            </Box>
          )}
        </Box>

        <Paper sx={{ p: 2, borderRadius: 3, mb: visitOnly ? 0 : 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {t('pets.stats')}
          </Typography>
          <StatBar
            label={t('pets.statAffection')}
            value={pet.stats.affection}
            valueLabel={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <Box component="span" sx={{ color: affectionDeltaColor }}>
                  ({affectionDeltaText})
                </Box>
                <Box component="span">
                  {pet.stats.affection}/{pet.affectionBase}
                </Box>
              </Box>
            }
          />
          <StatBar label={t('pets.statPlayfulness')} value={pet.stats.playfulness} />
          <StatBar label={t('pets.statCharm')} value={pet.stats.charm} />
          <Box sx={{ mt: 2 }}>
            <PetLevelProgress
              level={pet.level}
              subLevel={subLevel}
              subLevelMax={subLevelMax}
              levelProgressPercent={pet.levelProgressPercent}
            />
          </Box>
        </Paper>

        {!visitOnly && canLevelUp && nextCost !== null && (
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => void handleLevelUp()}
            disabled={upgrading || !canAffordUpgrade}
            sx={{ mb: 1.5, borderRadius: 2 }}
          >
            {upgrading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isMainLevelUpgrade ? (
              t('pets.upgradeMain', { level: nextMainLevel, cost: nextCost })
            ) : (
              t('pets.levelUp', { cost: nextCost })
            )}
          </Button>
        )}

        {!visitOnly && !isOwner && canLevelUp && (
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mb: 1 }}>
            {t('pets.upgradingPartnerPet')}
          </Typography>
        )}

        {!visitOnly && isOwner && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CardGiftcardIcon />}
            onClick={() => setGiftOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            {t('pets.gift')}
          </Button>
        )}

        {!visitOnly && (
          <PetGiftDialog open={giftOpen} onClose={() => setGiftOpen(false)} onGift={handleGift} />
        )}

        <CustomSnackbar
          open={!!toast}
          message={toast?.message ?? null}
          severity={toast?.severity ?? 'success'}
          onClose={() => setToast(null)}
        />
      </Box>
    </>
  );
};

export default PetDetailView;
