import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Fade,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import CustomSnackbar from '../UI/CustomSnackbar';
import CurrencyBadge from './CurrencyBadge';
import CurrencyCoinIcon from './CurrencyCoinIcon';
import PetCard from './PetCard';
import PetCreateDialog from './PetCreateDialog';
import { fetchMyPets, fetchPartnerPets, fetchUserPets, type Pet } from '../../services/petsService';
import { PET_PURCHASE_COST } from '../../config/petCatalogShared';
import { CURRENCY_UPDATED_EVENT } from '../../utils/currencyEvents';
import { usePartnerId } from '../../hooks/usePartnerId';
import { PARTNER_CHANGED_EVENT } from '../../hooks/useRelationship';
import {
  getPetHintSurfaceSx,
  getPetSectionPaperSx,
  petCardEnterAnimation,
  petHorizontalScrollSx,
  petScrollItemSx,
  petViewEnterSx,
  SURFACE_BORDER_RADIUS,
} from '../Feed/feedBannerStyles';

interface PetSectionProps {
  onBalanceChange?: (balance: number) => void;
  variant?: 'default' | 'readonly';
  userId?: string;
  onPetSelect?: (pet: Pet) => void;
  embedded?: boolean;
  compact?: boolean;
}

type PetView = 'mine' | 'partner';

const petViewToggleGroupSx = {
  mb: 2,
  p: 0.5,
  borderRadius: '20px',
  bgcolor: (theme: { palette: { primary: { main: string } } }) =>
    alpha(theme.palette.primary.main, 0.14),
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: '16px !important',
    flex: 1,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: 'text.primary',
    transition: 'background-color 0.25s ease, color 0.25s ease, transform 0.2s ease',
    '&.Mui-selected': {
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      '&:hover': {
        bgcolor: 'primary.dark',
      },
    },
    '&:hover': {
      bgcolor: (theme: { palette: { primary: { main: string } } }) =>
        alpha(theme.palette.primary.main, 0.24),
    },
  },
  '& .MuiToggleButtonGroup-grouped:not(:first-of-type)': {
    borderLeft: 'none',
    marginLeft: 0,
  },
} as const;

interface PetScrollRowProps {
  children: React.ReactNode;
}

const PetScrollRow: React.FC<PetScrollRowProps> = ({ children }) => (
  <Box sx={petHorizontalScrollSx}>{children}</Box>
);

interface PetHintCardProps {
  children: React.ReactNode;
  sx?: object;
}

const PetHintCard: React.FC<PetHintCardProps> = ({ children, sx }) => (
  <Box sx={(theme) => ({ ...getPetHintSurfaceSx(theme), ...sx })}>{children}</Box>
);

interface AddPetCardProps {
  canAfford: boolean;
  cost: number;
  onClick: () => void;
  animationIndex: number;
}

const AddPetCard: React.FC<AddPetCardProps> = ({ canAfford, cost, onClick, animationIndex }) => {
  const { t } = useTranslation();

  const handleActivate = () => {
    if (canAfford) {
      onClick();
    }
  };

  return (
    <Box sx={{ ...petScrollItemSx, ...petCardEnterAnimation(animationIndex) }}>
      <Box
        onClick={handleActivate}
        role="button"
        tabIndex={canAfford ? 0 : -1}
        aria-label={t('pets.addPet')}
        aria-disabled={!canAfford}
        onKeyDown={(event) => {
          if (!canAfford) {
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        }}
        sx={(theme) => ({
          width: '100%',
          height: '100%',
          minHeight: 220,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.25,
          px: 1.5,
          borderRadius: `${SURFACE_BORDER_RADIUS}px`,
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.16),
          cursor: canAfford ? 'pointer' : 'default',
          opacity: canAfford ? 1 : 0.55,
          transition: 'transform 0.22s ease, box-shadow 0.22s ease, opacity 0.2s',
          ...(canAfford && {
            '&:hover': {
              transform: 'scale(1.02)',
              boxShadow: `0 8px 22px ${alpha(theme.palette.primary.main, 0.24)}`,
            },
          }),
        })}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: canAfford ? 'primary.main' : 'action.disabledBackground',
            color: canAfford ? 'primary.contrastText' : 'text.disabled',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AddIcon />
        </Box>
        <Typography
          variant="body2"
          fontWeight={600}
          align="center"
          color={canAfford ? 'text.primary' : 'text.disabled'}
        >
          {t('pets.addPet')}
        </Typography>
        <Box
          sx={(theme) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.25,
            py: 0.4,
            borderRadius: 999,
            bgcolor: alpha(
              theme.palette.primary.main,
              canAfford
                ? theme.palette.mode === 'light'
                  ? 0.14
                  : 0.22
                : theme.palette.mode === 'light'
                  ? 0.08
                  : 0.12
            ),
          })}
        >
          <CurrencyCoinIcon size={18} />
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{
              fontSize: '0.95rem',
              color: canAfford ? 'primary.main' : 'text.disabled',
            }}
          >
            {cost}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const PetSection: React.FC<PetSectionProps> = ({
  onBalanceChange,
  variant = 'default',
  userId,
  onPetSelect,
  embedded = false,
  compact = false,
}) => {
  const { t } = useTranslation();
  const partnerId = usePartnerId();
  const isReadonly = variant === 'readonly';
  const [view, setView] = useState<PetView>('mine');
  const [pets, setPets] = useState<Pet[]>([]);
  const [partnerPets, setPartnerPets] = useState<Pet[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [moodLoading, setMoodLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const loadPets = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    try {
      if (!silent) {
        setLoading(true);
      }
      setMoodLoading(true);

      if (isReadonly && userId) {
        const userData = await fetchUserPets(userId);
        setPets(userData.pets);
        setPartnerPets([]);
        return;
      }

      const [myData, partnerData] = await Promise.all([
        fetchMyPets(),
        partnerId
          ? fetchPartnerPets().catch(() => ({ pets: [] as Pet[], partnerId: null }))
          : Promise.resolve({ pets: [] as Pet[], partnerId: null }),
      ]);
      setPets(myData.pets);
      setPartnerPets(partnerData.pets);
      setBalance(myData.balance);
      onBalanceChange?.(myData.balance);
    } catch (error) {
      console.error('Failed to load pets:', error);
      setToast({ message: t('pets.loadFailed'), severity: 'error' });
    } finally {
      setMoodLoading(false);
      if (!silent) {
        setLoading(false);
      }
    }
  }, [isReadonly, onBalanceChange, partnerId, t, userId]);

  useEffect(() => {
    void loadPets();
  }, [loadPets]);

  useEffect(() => {
    if (!partnerId) {
      setView('mine');
    }
  }, [partnerId]);

  useEffect(() => {
    if (isReadonly) {
      return;
    }
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ balance?: number; awardedAmount?: number }>).detail;
      if (detail?.balance !== undefined) {
        setBalance(detail.balance);
        onBalanceChange?.(detail.balance);
        return;
      }
      void loadPets({ silent: true });
    };
    const handlePartnerChanged = () => {
      void loadPets();
    };
    window.addEventListener(CURRENCY_UPDATED_EVENT, handler);
    window.addEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
    return () => {
      window.removeEventListener(CURRENCY_UPDATED_EVENT, handler);
      window.removeEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
    };
  }, [loadPets, isReadonly, onBalanceChange]);

  const handleCreated = (newPet: Pet, newBalance: number) => {
    setPets((prev) => [...prev, newPet]);
    setBalance(newBalance);
    onBalanceChange?.(newBalance);
  };

  const handleAddPet = () => {
    if (balance < PET_PURCHASE_COST) {
      return;
    }
    setCreateOpen(true);
  };

  const canAffordPet = balance >= PET_PURCHASE_COST;
  const showPartnerTab = !isReadonly && Boolean(partnerId);

  const renderPetCards = (items: Pet[], onSelect?: (pet: Pet) => void) => (
    <PetScrollRow>
      {items.map((pet, index) => (
        <Box key={pet.id} sx={{ ...petScrollItemSx, ...petCardEnterAnimation(index) }}>
          <PetCard pet={pet} onSelect={onSelect} moodLoading={moodLoading} />
        </Box>
      ))}
    </PetScrollRow>
  );

  const renderReadonlyContent = () => {
    if (pets.length > 0) {
      return renderPetCards(pets, onPetSelect);
    }

    return (
      <PetHintCard sx={{ py: compact ? 1.25 : 2 }}>
        <Typography variant="body2" color="text.secondary" sx={compact ? { fontSize: '0.8125rem' } : undefined}>
          {t('pets.contactEmpty')}
        </Typography>
      </PetHintCard>
    );
  };

  const renderViewContent = () => {
    if (isReadonly) {
      return renderReadonlyContent();
    }

    if (view === 'mine') {
      return (
        <>
          <PetScrollRow>
            {pets.map((pet, index) => (
              <Box key={pet.id} sx={{ ...petScrollItemSx, ...petCardEnterAnimation(index) }}>
                <PetCard pet={pet} moodLoading={moodLoading} />
              </Box>
            ))}
            <AddPetCard
              canAfford={canAffordPet}
              cost={PET_PURCHASE_COST}
              onClick={handleAddPet}
              animationIndex={pets.length}
            />
          </PetScrollRow>
        </>
      );
    }

    if (partnerPets.length > 0) {
      return (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, px: 0.5 }}>
            {t('pets.partnerHint')}
          </Typography>
          {renderPetCards(partnerPets)}
        </>
      );
    }

    return (
      <PetHintCard sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('pets.partnerEmpty')}
        </Typography>
      </PetHintCard>
    );
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={(theme) => ({
          ...getPetSectionPaperSx(theme),
          mb: embedded ? 0 : 3,
          mt: embedded ? (compact ? 0 : 2) : 0,
          ...(compact && {
            px: 1.75,
            py: 1.5,
          }),
        })}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
            mb: showPartnerTab ? 1.5 : isReadonly ? (compact ? 1 : 1.5) : 2,
          }}
        >
          <Typography
            variant="h2"
            component="h2"
            sx={{ fontSize: compact ? '1rem' : '1.35rem', fontWeight: 700 }}
          >
            {t('pets.sectionTitle')}
          </Typography>
          {!isReadonly && <CurrencyBadge balance={balance} variant="tinted" size="small" />}
        </Box>

        {showPartnerTab && (
          <ToggleButtonGroup
            value={view}
            exclusive
            fullWidth
            size="small"
            onChange={(_event, next: PetView | null) => {
              if (next) setView(next);
            }}
            aria-label={t('pets.viewToggleAria')}
            sx={petViewToggleGroupSx}
          >
            <ToggleButton value="mine">{t('pets.tabMine')}</ToggleButton>
            <ToggleButton value="partner">{t('pets.tabPartner')}</ToggleButton>
          </ToggleButtonGroup>
        )}

        {loading && pets.length === 0 && partnerPets.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220, py: 3 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Fade in key={view} timeout={320} appear>
            <Box sx={{ ...petViewEnterSx, minHeight: 220 }}>{renderViewContent()}</Box>
          </Fade>
        )}
      </Paper>

      {!isReadonly && (
        <PetCreateDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
          balance={balance}
          onError={(msg) => setToast({ message: msg, severity: 'error' })}
        />
      )}

      <CustomSnackbar
        open={!!toast}
        message={toast?.message ?? null}
        severity={toast?.severity ?? 'success'}
        onClose={() => setToast(null)}
      />
    </>
  );
};

export default PetSection;
