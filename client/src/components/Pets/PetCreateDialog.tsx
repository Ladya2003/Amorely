import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Stepper,
  Step,
  StepButton,
  CircularProgress,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import {
  PET_CATALOG,
  PET_VARIANTS,
  VARIANT_NAME_KEYS,
  PET_PURCHASE_COST,
  getPetImagePath,
} from '../../config/petCatalog';
import { getPublicAssetPath } from '../../utils/publicAssetPath';
import { getPetEggSrc } from '../../config/petEggAssets';
import type { PetSpecies } from '../../config/petCatalogShared';
import { createPet, type Pet } from '../../services/petsService';
import CurrencyBadge from './CurrencyBadge';
import PetHatchOverlay from './PetHatchOverlay';

interface PetCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (pet: Pet, balance: number) => void;
  balance: number;
  onError: (message: string) => void;
}

const getDefaultVariant = (species: PetSpecies): string => PET_VARIANTS[species][0];

const PET_CHOICE_RADIUS = 4;

const petChoiceCardSx = {
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'flex-start',
  minWidth: 108,
  maxWidth: 108,
  minHeight: 'auto',
  p: 0.75,
  gap: 1.25,
  textTransform: 'none' as const,
  borderRadius: PET_CHOICE_RADIUS,
  border: 'none',
  transition: 'box-shadow 0.2s ease, background-color 0.2s ease',
};

const getPetChoiceCardStateSx = (selected: boolean) => ({
  bgcolor: (theme: Theme) =>
    selected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.14),
  color: (theme: Theme) =>
    selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
  boxShadow: (theme: Theme) =>
    selected
      ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.38)}`
      : `0 4px 14px ${alpha(theme.palette.common.black, 0.12)}`,
  '&:hover': {
    bgcolor: (theme: Theme) =>
      selected ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.24),
    boxShadow: (theme: Theme) =>
      selected
        ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.44)}`
        : `0 6px 18px ${alpha(theme.palette.common.black, 0.16)}`,
  },
});

const petChoiceLabelSx = {
  fontSize: '0.875rem',
  fontWeight: 700,
  lineHeight: 1.2,
  textAlign: 'center',
  px: 0.25,
};

const petChoiceImageFrameSx = {
  width: '100%',
  height: 112,
  overflow: 'hidden',
  flexShrink: 0,
  borderRadius: 3,
};

const petChoiceImageSx = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  objectPosition: 'center center',
  transform: 'scale(1.5)',
  display: 'block',
  borderRadius: 3,
};

const petHatchImageFrameSx = {
  width: '100%',
  maxWidth: 280,
  height: 260,
  mx: 'auto',
  overflow: 'hidden',
  mb: 1,
  borderRadius: PET_CHOICE_RADIUS,
};

const petHatchImageSx = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  objectPosition: 'center center',
  transform: 'scale(1.35)',
  display: 'block',
};

const PetCreateDialog: React.FC<PetCreateDialogProps> = ({
  open,
  onClose,
  onCreated,
  balance,
  onError,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [species, setSpecies] = useState<PetSpecies | null>(null);
  const [variant, setVariant] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hatchResult, setHatchResult] = useState<{ pet: Pet; balance: number } | null>(null);

  const reset = () => {
    setStep(0);
    setSpecies(null);
    setVariant(null);
    setName('');
    setHatchResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!species || !variant || !name.trim()) return;
    if (balance < PET_PURCHASE_COST) {
      onError(t('pets.insufficientBalance', { cost: PET_PURCHASE_COST }));
      return;
    }

    setSubmitting(true);
    try {
      const result = await createPet({ species, variant, name: name.trim() });
      setHatchResult(result);
    } catch (err: any) {
      const msg = err.response?.data?.error || t('pets.createFailed');
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHatchContinue = () => {
    if (!hatchResult) return;
    onCreated(hatchResult.pet, hatchResult.balance);
    handleClose();
  };

  const stepLabels = [t('pets.stepSpecies'), t('pets.stepVariant'), t('pets.stepName')];

  const isStepAccessible = (index: number) => {
    if (index === 0) return true;
    if (index === 1) return species !== null;
    return species !== null && variant !== null;
  };

  const isStepCompleted = (index: number) => {
    if (index === 0) return species !== null;
    if (index === 1) return variant !== null;
    return false;
  };

  const handleStepClick = (index: number) => {
    if (submitting || !isStepAccessible(index)) return;
    setStep(index);
  };

  return (
    <>
      {hatchResult && species && variant && (
        <PetHatchOverlay
          species={species}
          variant={variant}
          petName={hatchResult.pet.name}
          toLevel={1}
          onContinue={handleHatchContinue}
        />
      )}

      <ResponsiveDialog
        open={open}
        onClose={hatchResult ? () => {} : handleClose}
        maxWidth="sm"
        fullWidth
      >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {t('pets.createTitle')}
        <CurrencyBadge balance={balance} size="small" />
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} alternativeLabel nonLinear sx={{ mb: step === 2 ? 1.5 : 3 }}>
          {stepLabels.map((label, index) => (
            <Step key={label} completed={isStepCompleted(index)}>
              <StepButton
                onClick={() => handleStepClick(index)}
                disabled={submitting || !isStepAccessible(index)}
              >
                {label}
              </StepButton>
            </Step>
          ))}
        </Stepper>

        {step === 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
            {PET_CATALOG.map((entry) => (
              <Button
                key={entry.id}
                variant="contained"
                disableElevation
                onClick={() => {
                  setSpecies(entry.id);
                  setVariant(null);
                  setStep(1);
                }}
                sx={{ ...petChoiceCardSx, ...getPetChoiceCardStateSx(species === entry.id) }}
              >
                <Box sx={petChoiceImageFrameSx}>
                  <Box
                    component="img"
                    src={getPublicAssetPath(
                      getPetImagePath(entry.id, getDefaultVariant(entry.id), 1)
                    )}
                    alt=""
                    sx={petChoiceImageSx}
                  />
                </Box>
                <Typography component="span" sx={petChoiceLabelSx}>
                  {t(entry.nameKey)}
                </Typography>
              </Button>
            ))}
          </Box>
        )}

        {step === 1 && species && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
            {PET_VARIANTS[species].map((v) => (
              <Button
                key={v}
                variant="contained"
                disableElevation
                onClick={() => {
                  setVariant(v);
                  setStep(2);
                }}
                sx={{ ...petChoiceCardSx, ...getPetChoiceCardStateSx(variant === v) }}
              >
                <Box sx={petChoiceImageFrameSx}>
                  <Box
                    component="img"
                    src={getPublicAssetPath(getPetImagePath(species, v, 1))}
                    alt=""
                    sx={petChoiceImageSx}
                  />
                </Box>
                <Typography component="span" sx={petChoiceLabelSx}>
                  {t(VARIANT_NAME_KEYS[species][v])}
                </Typography>
              </Button>
            ))}
          </Box>
        )}

        {step === 2 && species && variant && (
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={petHatchImageFrameSx}>
              <Box component="img" src={getPetEggSrc(species, variant)} alt="" sx={petHatchImageSx} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('pets.nameHint')}
            </Typography>
            <TextField
              fullWidth
              label={t('pets.nameLabel')}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 24))}
              inputProps={{ maxLength: 24 }}
              sx={{ mt: 1 }}
              autoFocus
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('pets.purchaseCost', { cost: PET_PURCHASE_COST })}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {step > 0 && (
          <Button onClick={() => setStep((s) => s - 1)} disabled={submitting}>
            {t('common.back')}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleClose} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        {step === 2 && (
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={!name.trim() || submitting || balance < PET_PURCHASE_COST}
          >
            {submitting ? <CircularProgress size={22} /> : t('pets.hatch')}
          </Button>
        )}
      </DialogActions>
      </ResponsiveDialog>
    </>
  );
};

export default PetCreateDialog;
