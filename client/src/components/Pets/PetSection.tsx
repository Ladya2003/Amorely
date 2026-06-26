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
import PetCard from './PetCard';
import PetCreateDialog from './PetCreateDialog';
import { fetchMyPets, fetchPartnerPets, fetchUserPets, type Pet } from '../../services/petsService';
import { PET_PURCHASE_COST } from '../../config/petCatalogShared';
import { CURRENCY_UPDATED_EVENT } from '../../utils/currencyEvents';
import { usePartnerId } from '../../hooks/usePartnerId';
import { PARTNER_CHANGED_EVENT } from '../../hooks/useRelationship';

interface PetSectionProps {
  onBalanceChange?: (balance: number) => void;
  variant?: 'default' | 'readonly';
  userId?: string;
  onPetSelect?: (pet: Pet) => void;
  embedded?: boolean;
}

type PetView = 'mine' | 'partner';

const petGridSx = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1.5,
  width: '100%',
} as const;

const petCardItemSx = {
  flex: '1 1 140px',
  minWidth: 140,
  maxWidth: 'min(calc(50% - 6px), 200px)',
} as const;

const addPetItemSx = {
  flex: '1 1 140px',
  minWidth: 140,
  minHeight: 180,
} as const;

const petViewToggleGroupSx = {
  mb: 2,
  p: 0.5,
  borderRadius: 3,
  bgcolor: (theme: { palette: { primary: { main: string } } }) =>
    alpha(theme.palette.primary.main, 0.14),
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: '12px !important',
    flex: 1,
    textTransform: 'none',
    fontWeight: 600,
    color: 'text.primary',
    transition: 'background-color 0.25s ease, color 0.25s ease',
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

const PetGrid: React.FC<{ pets: Pet[] }> = ({ pets }) => (
  <Box sx={petGridSx}>
    {pets.map((pet) => (
      <Box key={pet.id} sx={petCardItemSx}>
        <PetCard pet={pet} />
      </Box>
    ))}
  </Box>
);

const PetSection: React.FC<PetSectionProps> = ({
  onBalanceChange,
  variant = 'default',
  userId,
  onPetSelect,
  embedded = false,
}) => {
  const { t } = useTranslation();
  const partnerId = usePartnerId();
  const isReadonly = variant === 'readonly';
  const [view, setView] = useState<PetView>('mine');
  const [pets, setPets] = useState<Pet[]>([]);
  const [partnerPets, setPartnerPets] = useState<Pet[]>([]);
  const [balance, setBalance] = useState(0);
  const [canAffordFirstPet, setCanAffordFirstPet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const loadPets = useCallback(async () => {
    try {
      setLoading(true);
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
      setCanAffordFirstPet(myData.canAffordFirstPet);
      onBalanceChange?.(myData.balance);
    } catch (error) {
      console.error('Failed to load pets:', error);
      setToast({ message: t('pets.loadFailed'), severity: 'error' });
    } finally {
      setLoading(false);
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
        setCanAffordFirstPet(detail.balance >= PET_PURCHASE_COST);
        void loadPets();
      } else {
        void loadPets();
      }
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
  }, [loadPets]);

  const handleCreated = (newPet: Pet, newBalance: number) => {
    setPets((prev) => [...prev, newPet]);
    setBalance(newBalance);
    setCanAffordFirstPet(newBalance >= PET_PURCHASE_COST);
    onBalanceChange?.(newBalance);
  };

  const handleAddPet = () => {
    if (balance < PET_PURCHASE_COST) {
      setToast({
        message: t('pets.insufficientBalance', { cost: PET_PURCHASE_COST }),
        severity: 'error',
      });
      return;
    }
    setCreateOpen(true);
  };

  const showOnboarding = !isReadonly && pets.length === 0 && canAffordFirstPet;
  const showPartnerTab = !isReadonly && Boolean(partnerId);

  const renderReadonlyContent = () => {
    if (pets.length > 0) {
      return (
        <Box sx={petGridSx}>
          {pets.map((pet) => (
            <Box key={pet.id} sx={petCardItemSx}>
              <PetCard pet={pet} onSelect={onPetSelect} />
            </Box>
          ))}
        </Box>
      );
    }

    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        {t('pets.contactEmpty')}
      </Typography>
    );
  };

  const renderViewContent = () => {
    if (isReadonly) {
      return renderReadonlyContent();
    }

    if (view === 'mine') {
      return (
        <>
          <Box sx={petGridSx}>
            {pets.map((pet) => (
              <Box key={pet.id} sx={petCardItemSx}>
                <PetCard pet={pet} />
              </Box>
            ))}

            <Box sx={addPetItemSx}>
              <Box
                onClick={handleAddPet}
                role="button"
                tabIndex={0}
                aria-label={t('pets.addPet')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleAddPet();
                  }
                }}
                sx={{
                  width: '100%',
                  height: '100%',
                  minHeight: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: balance >= PET_PURCHASE_COST ? 'primary.main' : 'divider',
                  borderRadius: 3,
                  opacity: balance >= PET_PURCHASE_COST ? 1 : 0.6,
                  cursor: 'pointer',
                  bgcolor: 'transparent',
                  transition: 'border-color 0.2s, opacity 0.2s',
                  '&:hover': {
                    opacity: balance >= PET_PURCHASE_COST ? 0.9 : 0.6,
                  },
                }}
              >
                <AddIcon color={balance >= PET_PURCHASE_COST ? 'primary' : 'disabled'} />
              </Box>
            </Box>
          </Box>

          {showOnboarding && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: 'rgba(255, 182, 193, 0.15)',
                textAlign: 'center',
              }}
            >
              {t('pets.onboarding')}
            </Typography>
          )}

          {pets.length > 0 && balance < PET_PURCHASE_COST && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('pets.needMore', { cost: PET_PURCHASE_COST, balance })}
            </Typography>
          )}
        </>
      );
    }

    if (partnerPets.length > 0) {
      return (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {t('pets.partnerHint')}
          </Typography>
          <PetGrid pets={partnerPets} />
        </>
      );
    }

    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        {t('pets.partnerEmpty')}
      </Typography>
    );
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: embedded ? 0 : 3,
          mt: embedded ? 2 : 0,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: showPartnerTab ? 1.5 : isReadonly ? 1.5 : 2,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {t('pets.sectionTitle')}
          </Typography>
          {!isReadonly && <CurrencyBadge balance={balance} />}
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Fade in key={view} timeout={280} appear>
            <Box
              sx={{
                '@keyframes petViewEnter': {
                  from: { transform: 'translateY(8px)' },
                  to: { transform: 'translateY(0)' },
                },
                animation: 'petViewEnter 0.28s ease-out',
              }}
            >
              {renderViewContent()}
            </Box>
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
