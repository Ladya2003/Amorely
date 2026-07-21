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
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import { alpha } from '@mui/material/styles';
import CustomSnackbar from '../UI/CustomSnackbar';
import CurrencyBadge from './CurrencyBadge';
import PetGiftDialog from './PetGiftDialog';
import PetFeedDialog from './PetFeedDialog';
import PetLevelProgress from './PetLevelProgress';
import PetHatchOverlay from './PetHatchOverlay';
import PetOwnerBlock from './PetOwnerBlock';
import { unlockPetRevealAudio, playPetHeartsSound } from '../../utils/petRevealSound';
import { fetchPet, fetchUserPet, levelUpPet, giftPet, petPet, feedPet } from '../../services/petsService';
import type { Pet } from '../../services/petsService';
import { useAuth } from '../../contexts/AuthContext';
import {
  getNextUpgradeCost,
  getSubLevelMax,
} from '../../config/petCatalogShared';
import { getPublicAssetPath } from '../../utils/publicAssetPath';
import { emitCurrencyUpdated } from '../../utils/currencyEvents';

import {
  getPetSectionPaperSx,
  getPetHeroBackground,
  petViewEnterSx,
  SURFACE_BORDER_RADIUS,
} from '../Feed/feedBannerStyles';
import { getAppGlassSurfaceLightTextSx } from '../../theme/modalStyles';
import { INPUT_BORDER_RADIUS } from '../../theme/appTheme';
import { MOBILE_BOTTOM_NAV_OFFSET } from '../../constants/layout';

const statProgressSx = {
  height: 10,
  borderRadius: 999,
  bgcolor: 'action.hover',
  '& .MuiLinearProgress-bar': { borderRadius: 999 },
} as const;

const StatBar: React.FC<{
  label: string;
  value: number;
  valueLabel?: React.ReactNode;
}> = ({ label, value, valueLabel }) => (
  <Box sx={{ mb: 1.75 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700}>
        {valueLabel ?? value}
      </Typography>
    </Box>
    <LinearProgress variant="determinate" value={value} sx={statProgressSx} />
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
const SATIETY_FLOAT_MS = 2200;
const FEED_ANIMATION_MS = 2400;
const SATIETY_HUNGRY_THRESHOLD = 20;

const ANGRY_FACE_POSITIONS = [
  { left: '20%', top: '16%', size: 28, emoji: '😾' },
  { left: '74%', top: '22%', size: 26, emoji: '😡' },
  { left: '46%', top: '40%', size: 30, emoji: '🥺' },
  { left: '28%', top: '56%', size: 24, emoji: '😡' },
  { left: '66%', top: '50%', size: 26, emoji: '🥺' },
] as const;

const FEED_PARTICLE_POSITIONS = [
  { left: '38%', top: '58%', emoji: '🍖', delay: '0ms' },
  { left: '50%', top: '52%', emoji: '🥣', delay: '120ms' },
  { left: '62%', top: '58%', emoji: '✨', delay: '240ms' },
  { left: '44%', top: '48%', emoji: '🍗', delay: '180ms' },
  { left: '56%', top: '48%', emoji: '💫', delay: '300ms' },
] as const;

const PET_HEART_RISE_KEYFRAMES = {
  '0%': { transform: 'translate(-50%, 0) scale(0.65)', opacity: 0 },
  '22%': { opacity: 1 },
  '100%': { transform: 'translate(-50%, -52px) scale(1.15)', opacity: 0 },
} as const;

type AmbientAffectionHeart = {
  id: number;
  left: string;
  top: string;
  size: number;
  durationMs: number;
};

const createAmbientAffectionHeart = (id: number): AmbientAffectionHeart => ({
  id,
  left: `${18 + Math.random() * 64}%`,
  top: `${14 + Math.random() * 58}%`,
  size: 20 + Math.floor(Math.random() * 9),
  durationMs: 920 + Math.floor(Math.random() * 180),
});

const getAmbientHeartSpawnIntervalMs = (affectionDelta: number) =>
  Math.max(1600, 4200 - affectionDelta * 520) + Math.floor(Math.random() * 1200);

export interface PetDetailViewProps {
  petId: string;
  ownerUserId?: string;
  visitOnly?: boolean;
  embedded?: boolean;
  glassSurface?: boolean;
  onBack?: () => void;
  onGifted?: () => void;
}

const PetDetailView: React.FC<PetDetailViewProps> = ({
  petId,
  ownerUserId,
  visitOnly = false,
  embedded = false,
  glassSurface = false,
  onBack,
  onGifted,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [balance, setBalance] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [canFeed, setCanFeed] = useState(false);
  const [canLevelUp, setCanLevelUp] = useState(false);
  const [levelUpCost, setLevelUpCost] = useState<number | null>(null);
  const [isMainLevelUpgrade, setIsMainLevelUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [isFeeding, setIsFeeding] = useState(false);
  const [feedingPending, setFeedingPending] = useState(false);
  const [levelUpReveal, setLevelUpReveal] = useState<{ fromLevel: number; toLevel: number } | null>(
    null
  );
  const [isPetting, setIsPetting] = useState(false);
  const [pettingPending, setPettingPending] = useState(false);
  const [affectionFloat, setAffectionFloat] = useState<{ id: number; amount: number } | null>(null);
  const [satietyFloat, setSatietyFloat] = useState<{ id: number; amount: number } | null>(null);
  const [ambientHearts, setAmbientHearts] = useState<AmbientAffectionHeart[]>([]);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const pettingTimeoutRef = useRef<number | null>(null);
  const affectionFloatTimeoutRef = useRef<number | null>(null);
  const satietyFloatTimeoutRef = useRef<number | null>(null);
  const feedAnimationTimeoutRef = useRef<number | null>(null);
  const affectionFloatIdRef = useRef(0);
  const satietyFloatIdRef = useRef(0);
  const ambientHeartIdRef = useRef(0);
  const ambientHeartTimeoutsRef = useRef<number[]>([]);

  const loadPet = useCallback(async () => {
    if (!petId) return;
    try {
      setLoading(true);
      const data =
        visitOnly && ownerUserId
          ? await fetchUserPet(ownerUserId, petId, { visit: true })
          : await fetchPet(petId, { visit: visitOnly });
      setPet(data.pet);
      setBalance(data.balance);
      setIsOwner(data.isOwner);
      setCanFeed(data.canFeed ?? false);
      setCanLevelUp(data.canLevelUp);
      setLevelUpCost(data.levelUpCost);
      setIsMainLevelUpgrade(data.isMainLevelUpgrade);
    } catch {
      setToast({ message: t('pets.notFound'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [ownerUserId, petId, t, visitOnly]);

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
      if (satietyFloatTimeoutRef.current !== null) {
        window.clearTimeout(satietyFloatTimeoutRef.current);
      }
      if (feedAnimationTimeoutRef.current !== null) {
        window.clearTimeout(feedAnimationTimeoutRef.current);
      }
      ambientHeartTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      ambientHeartTimeoutsRef.current = [];
    },
    []
  );

  const affectionDelta = pet?.affectionDelta ?? 0;
  const satiety = pet?.stats.satiety ?? 60;
  const isHungry = satiety < SATIETY_HUNGRY_THRESHOLD;

  useEffect(() => {
    if (isPetting || isFeeding || affectionDelta <= 0 || isHungry) {
      setAmbientHearts([]);
      return;
    }

    const clearAmbientHeartTimeout = (timeoutId: number) => {
      window.clearTimeout(timeoutId);
      ambientHeartTimeoutsRef.current = ambientHeartTimeoutsRef.current.filter(
        (storedId) => storedId !== timeoutId
      );
    };

    const spawnAmbientHeart = () => {
      const nextId = ambientHeartIdRef.current + 1;
      ambientHeartIdRef.current = nextId;
      const heart = createAmbientAffectionHeart(nextId);

      setAmbientHearts((prev) => {
        const maxHearts = affectionDelta;
        return [...prev, heart].slice(-maxHearts);
      });

      const removeTimeoutId = window.setTimeout(() => {
        setAmbientHearts((prev) => prev.filter((item) => item.id !== nextId));
        clearAmbientHeartTimeout(removeTimeoutId);
      }, heart.durationMs);
      ambientHeartTimeoutsRef.current.push(removeTimeoutId);
    };

    let spawnTimeoutId: number | null = null;
    let cancelled = false;

    const scheduleNextSpawn = () => {
      if (cancelled) {
        return;
      }
      spawnTimeoutId = window.setTimeout(() => {
        if (cancelled) {
          return;
        }
        const spawnCount = affectionDelta >= 4 && Math.random() < 0.35 ? 2 : 1;
        for (let index = 0; index < spawnCount; index += 1) {
          spawnAmbientHeart();
        }
        scheduleNextSpawn();
      }, getAmbientHeartSpawnIntervalMs(affectionDelta));
    };

    scheduleNextSpawn();

    return () => {
      cancelled = true;
      if (spawnTimeoutId !== null) {
        window.clearTimeout(spawnTimeoutId);
      }
      ambientHeartTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      ambientHeartTimeoutsRef.current = [];
      setAmbientHearts([]);
    };
  }, [affectionDelta, isFeeding, isHungry, isPetting]);

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

  const spawnSatietyFloat = useCallback((amount: number) => {
    if (amount <= 0) {
      return;
    }
    const nextId = satietyFloatIdRef.current + 1;
    satietyFloatIdRef.current = nextId;
    setSatietyFloat({ id: nextId, amount });
    if (satietyFloatTimeoutRef.current !== null) {
      window.clearTimeout(satietyFloatTimeoutRef.current);
    }
    satietyFloatTimeoutRef.current = window.setTimeout(() => {
      setSatietyFloat((prev) => (prev?.id === nextId ? null : prev));
      satietyFloatTimeoutRef.current = null;
    }, SATIETY_FLOAT_MS);
  }, []);

  const handleLevelUp = async () => {
    if (!petId || !pet) return;
    const previousLevel = pet.level;
    setUpgrading(true);
    unlockPetRevealAudio();
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

  const handleFeed = async () => {
    if (!petId || feedingPending) {
      return;
    }

    setFeedingPending(true);
    setIsFeeding(true);
    try {
      const result = await feedPet(petId);
      setPet(result.pet);
      setBalance(result.balance);
      emitCurrencyUpdated(result.balance);
      spawnSatietyFloat(result.satietyGain);
      if (result.satietyFullAward > 0) {
        setToast({
          message: t('pets.satietyFullReward', { amount: result.satietyFullAward }),
          severity: 'success',
        });
      }
      if (feedAnimationTimeoutRef.current !== null) {
        window.clearTimeout(feedAnimationTimeoutRef.current);
      }
      feedAnimationTimeoutRef.current = window.setTimeout(() => {
        setIsFeeding(false);
        feedAnimationTimeoutRef.current = null;
      }, FEED_ANIMATION_MS);
    } catch (error: any) {
      setIsFeeding(false);
      setToast({
        message: error?.response?.data?.error || t('pets.feedFailed'),
        severity: 'error',
      });
      throw error;
    } finally {
      setFeedingPending(false);
    }
  };

  const handlePetting = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!petId || pettingPending) {
      return;
    }

    setPettingPending(true);
    setIsPetting(true);
    unlockPetRevealAudio();
    void playPetHeartsSound();
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
  const affectionDeltaText = affectionDelta > 0 ? `+${affectionDelta}` : `${affectionDelta}`;
  const affectionDeltaColor =
    affectionDelta > 0 ? 'success.main' : affectionDelta < 0 ? 'error.main' : 'text.secondary';
  const satietyColor =
    satiety < SATIETY_HUNGRY_THRESHOLD
      ? 'error.main'
      : satiety < 40
        ? 'warning.main'
        : 'success.main';
  const angryFaceCount = isHungry
    ? Math.min(ANGRY_FACE_POSITIONS.length, Math.max(2, 6 - Math.floor(satiety / 4)))
    : 0;
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

      <Box
        sx={{
          py: embedded ? 0 : 2,
          pb: embedded ? 1 : { xs: MOBILE_BOTTOM_NAV_OFFSET, sm: 2 },
          ...petViewEnterSx,
          ...(glassSurface ? (theme) => getAppGlassSurfaceLightTextSx(theme) : {}),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1.5 }}>
          {onBack && (
            <IconButton
              onClick={onBack}
              aria-label={t('common.back')}
              size="small"
              sx={(theme) => ({
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                },
              })}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h2" component="h1" sx={{ flex: 1, fontSize: embedded ? '1.15rem' : '1.35rem' }}>
            {pet.name}
          </Typography>
          {!visitOnly && <CurrencyBadge balance={balance} variant="tinted" size="small" />}
        </Box>

        <Box
          sx={(theme) => ({
            position: 'relative',
            mb: 2.5,
            minHeight: imageMinHeight,
            overflow: 'hidden',
            borderRadius: `${SURFACE_BORDER_RADIUS}px`,
            border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.22)}`,
            boxShadow: `0 10px 32px ${alpha(theme.palette.primary.main, 0.14)}`,
            background: getPetHeroBackground(theme),
            '@keyframes petHeartRiseDetail': PET_HEART_RISE_KEYFRAMES,
            '@keyframes petFeedParticleRise': {
              '0%': { transform: 'translate(-50%, 12px) scale(0.6)', opacity: 0 },
              '20%': { opacity: 1 },
              '100%': { transform: 'translate(-50%, -72px) scale(1.2)', opacity: 0 },
            },
            '@keyframes petFeedGlowPulse': {
              '0%': { opacity: 0, transform: 'scale(0.85)' },
              '18%': { opacity: 1, transform: 'scale(1)' },
              '72%': { opacity: 1, transform: 'scale(1.02)' },
              '100%': { opacity: 0, transform: 'scale(1.08)' },
            },
          })}
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
          <Box
            sx={{
              position: 'absolute',
              top: 14,
              left: 14,
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <IconButton
              aria-label={t('pets.petAction')}
              onClick={handlePetting}
              disabled={pettingPending}
              sx={(theme) => ({
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.dark, 0.88),
                color: theme.palette.primary.contrastText,
                border: `1px solid ${alpha(theme.palette.primary.contrastText, 0.22)}`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
                '&.Mui-disabled': {
                  bgcolor: alpha(theme.palette.primary.dark, 0.55),
                  color: alpha(theme.palette.primary.contrastText, 0.78),
                },
              })}
            >
              <PanToolAltOutlinedIcon sx={{ fontSize: 24 }} />
            </IconButton>
            {canFeed && (
              <IconButton
                aria-label={t('pets.feedAction')}
                onClick={() => setFeedOpen(true)}
                disabled={feedingPending || isFeeding}
                sx={(theme) => ({
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.warning.dark, 0.9),
                  color: theme.palette.warning.contrastText,
                  border: `1px solid ${alpha(theme.palette.warning.contrastText, 0.22)}`,
                  boxShadow: `0 4px 16px ${alpha(theme.palette.warning.main, 0.35)}`,
                  '&:hover': {
                    bgcolor: theme.palette.warning.dark,
                  },
                  '&.Mui-disabled': {
                    bgcolor: alpha(theme.palette.warning.dark, 0.55),
                    color: alpha(theme.palette.warning.contrastText, 0.78),
                  },
                })}
              >
                <RestaurantMenuIcon sx={{ fontSize: 24 }} />
              </IconButton>
            )}
          </Box>
          {isPetting && (
            <Box
              sx={{
                pointerEvents: 'none',
                position: 'absolute',
                top: 16,
                left: 0,
                right: 0,
                zIndex: 2,
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
          {!isPetting && !isFeeding && affectionDelta > 0 && !isHungry && ambientHearts.length > 0 && (
            <Box
              sx={{
                pointerEvents: 'none',
                position: 'absolute',
                inset: 0,
                zIndex: 1,
              }}
            >
              {ambientHearts.map((heart) => (
                <Box
                  key={heart.id}
                  component="span"
                  sx={(theme) => ({
                    position: 'absolute',
                    left: heart.left,
                    top: heart.top,
                    color: alpha(theme.palette.error.main, 0.88),
                    fontSize: heart.size,
                    lineHeight: 1,
                    animationName: 'petHeartRiseDetail',
                    animationDuration: `${heart.durationMs}ms`,
                    animationTimingFunction: 'ease-out',
                    animationIterationCount: 1,
                    animationFillMode: 'forwards',
                  })}
                >
                  ❤
                </Box>
              ))}
            </Box>
          )}
          {!isPetting && !isFeeding && isHungry && (
            <Box
              sx={{
                pointerEvents: 'none',
                position: 'absolute',
                inset: 0,
                zIndex: 1,
              }}
            >
              {ANGRY_FACE_POSITIONS.slice(0, angryFaceCount).map((face) => (
                <Box
                  key={`${face.left}-${face.top}`}
                  component="span"
                  sx={{
                    position: 'absolute',
                    left: face.left,
                    top: face.top,
                    fontSize: face.size,
                    lineHeight: 1,
                    transform: 'translate(-50%, -50%)',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))',
                  }}
                >
                  {face.emoji}
                </Box>
              ))}
            </Box>
          )}
          {isFeeding && (
            <Box
              sx={{
                pointerEvents: 'none',
                position: 'absolute',
                inset: 0,
                zIndex: 3,
              }}
            >
              <Box
                sx={(theme) => ({
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at 50% 62%, ${alpha(theme.palette.warning.main, 0.28)} 0%, transparent 58%)`,
                  animation: `petFeedGlowPulse ${FEED_ANIMATION_MS}ms ease-in-out forwards`,
                })}
              />
              {FEED_PARTICLE_POSITIONS.map((particle) => (
                <Box
                  key={`${particle.emoji}-${particle.left}`}
                  component="span"
                  sx={{
                    position: 'absolute',
                    left: particle.left,
                    top: particle.top,
                    fontSize: 28,
                    lineHeight: 1,
                    animationName: 'petFeedParticleRise',
                    animationDuration: '1100ms',
                    animationTimingFunction: 'ease-out',
                    animationDelay: particle.delay,
                    animationIterationCount: 2,
                  }}
                >
                  {particle.emoji}
                </Box>
              ))}
            </Box>
          )}
          {satietyFloat && (
            <Box
              sx={(theme) => ({
                pointerEvents: 'none',
                position: 'absolute',
                top: '30%',
                left: '50%',
                zIndex: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.75,
                py: 0.9,
                borderRadius: `${INPUT_BORDER_RADIUS}px`,
                bgcolor: alpha(theme.palette.warning.dark, 0.88),
                boxShadow: `0 10px 28px ${alpha(theme.palette.common.black, 0.3)}`,
                border: `1px solid ${alpha(theme.palette.warning.light, 0.35)}`,
                '@keyframes satietyFloatUp': {
                  '0%': {
                    opacity: 0,
                    transform: 'translate(-50%, 12px) scale(0.88)',
                  },
                  '16%': {
                    opacity: 1,
                    transform: 'translate(-50%, 0) scale(1)',
                  },
                  '78%': {
                    opacity: 1,
                    transform: 'translate(-50%, -34px) scale(1.04)',
                  },
                  '100%': {
                    opacity: 0,
                    transform: 'translate(-50%, -48px) scale(1.08)',
                  },
                },
                animation: `satietyFloatUp ${SATIETY_FLOAT_MS}ms ease-in-out forwards`,
              })}
            >
              <Typography
                component="span"
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  lineHeight: 1,
                  textShadow: '0 2px 10px rgba(0,0,0,0.55)',
                }}
              >
                +{satietyFloat.amount}
              </Typography>
              <Typography component="span" sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                {t('pets.statSatiety')}
              </Typography>
              <RestaurantMenuIcon
                sx={{
                  fontSize: 18,
                  color: '#ffd27d',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
                }}
              />
            </Box>
          )}
          {affectionFloat && (
            <Box
              sx={(theme) => ({
                pointerEvents: 'none',
                position: 'absolute',
                top: '24%',
                left: '50%',
                zIndex: 3,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.75,
                borderRadius: `${INPUT_BORDER_RADIUS}px`,
                bgcolor: alpha(theme.palette.primary.dark, 0.82),
                boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.28)}`,
                border: `1px solid ${alpha(theme.palette.primary.light, 0.25)}`,
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
              })}
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

        <Paper
          elevation={0}
          sx={(theme) => ({
            ...getPetSectionPaperSx(theme),
            p: 2.5,
            mb: visitOnly ? 0 : 2.5,
            ...(glassSurface ? getAppGlassSurfaceLightTextSx(theme) : {}),
          })}
        >
          <Typography variant="h2" component="h2" sx={{ fontSize: '1.15rem', mb: 2 }}>
            {t('pets.stats')}
          </Typography>
          <StatBar
            label={t('pets.statSatiety')}
            value={satiety}
            valueLabel={
              <Box component="span" sx={{ color: satietyColor }}>
                {satiety}/100
              </Box>
            }
          />
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
            sx={{ mb: 1.5 }}
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
          >
            {t('pets.gift')}
          </Button>
        )}

        {!visitOnly && (
          <PetGiftDialog open={giftOpen} onClose={() => setGiftOpen(false)} onGift={handleGift} />
        )}

        {canFeed && (
          <PetFeedDialog
            open={feedOpen}
            onClose={() => setFeedOpen(false)}
            onFeed={handleFeed}
            balance={balance}
          />
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
