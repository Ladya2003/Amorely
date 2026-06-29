import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TransitionGroup } from 'react-transition-group';
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
  Slide,
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
import { PET_SPECIES } from '../../config/petCatalogShared';
import { createPet, type Pet } from '../../services/petsService';
import CurrencyBadge from './CurrencyBadge';
import PetHatchOverlay from './PetHatchOverlay';
import { SURFACE_BORDER_RADIUS } from '../../theme/appTheme';
import { unlockPetRevealAudio } from '../../utils/petRevealSound';

interface PetCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (pet: Pet, balance: number) => void;
  balance: number;
  onError: (message: string) => void;
}

const getDefaultVariant = (species: PetSpecies): string => PET_VARIANTS[species][0];

const PET_CHOICE_RADIUS = 24;
const PET_CHOICE_SIZE = 156;
const PET_CHOICE_IMAGE_HEIGHT = 180;
const PET_IMAGE_SCALE = 1.55;
const PET_CHOICE_GAP_PX = 16;
const STEP_TRANSITION_MS = 320;
/** Шаг «Имя»: яйцо + подсказка + поле + подпись */
const STEP_NAME_CONTENT_HEIGHT = 392;
const STEP_CHOICE_COLUMNS = { xs: 2, sm: 3 } as const;

const computeChoiceGridHeight = (itemCount: number, columns: number) => {
  const rows = Math.ceil(itemCount / columns);
  return rows * PET_CHOICE_IMAGE_HEIGHT + Math.max(0, rows - 1) * PET_CHOICE_GAP_PX;
};

const maxVariantCount = Math.max(...PET_SPECIES.map((species) => PET_VARIANTS[species].length));

const getStepContentAreaHeight = (theme: Theme) => {
  const speciesHeightXs = computeChoiceGridHeight(PET_CATALOG.length, STEP_CHOICE_COLUMNS.xs);
  const speciesHeightSm = computeChoiceGridHeight(PET_CATALOG.length, STEP_CHOICE_COLUMNS.sm);
  const variantHeightXs = computeChoiceGridHeight(maxVariantCount, STEP_CHOICE_COLUMNS.xs);
  const variantHeightSm = computeChoiceGridHeight(maxVariantCount, STEP_CHOICE_COLUMNS.sm);

  return {
    xs: Math.max(speciesHeightXs, variantHeightXs, STEP_NAME_CONTENT_HEIGHT),
    sm: Math.max(speciesHeightSm, variantHeightSm, STEP_NAME_CONTENT_HEIGHT),
  };
};

const getStepContentAreaSx = (theme: Theme) => {
  const height = getStepContentAreaHeight(theme);
  return {
    position: 'relative' as const,
    height: height.xs,
    overflow: 'hidden' as const,
    [theme.breakpoints.up('sm')]: {
      height: height.sm,
    },
  };
};

type StepDirection = 'forward' | 'back';

const petChoiceCardSx = {
  p: 0,
  m: 0,
  minWidth: PET_CHOICE_SIZE,
  maxWidth: PET_CHOICE_SIZE,
  minHeight: 'auto',
  textTransform: 'none' as const,
  border: 'none',
  cursor: 'pointer',
  display: 'block',
  bgcolor: 'transparent',
  WebkitTapHighlightColor: 'transparent',
  transition: 'transform 0.22s ease, box-shadow 0.22s ease',
  font: 'inherit',
  overflow: 'visible',
  borderRadius: `${PET_CHOICE_RADIUS}px`,
};

const getPetChoiceCardStateSx = (selected: boolean) => ({
  bgcolor: 'transparent',
  color: 'text.primary',
  boxShadow: (theme: Theme) =>
    `0 6px 18px ${alpha(theme.palette.common.black, theme.palette.mode === 'light' ? 0.1 : 0.28)}`,
  '&:hover': {
    bgcolor: 'transparent',
    transform: 'scale(1.02)',
    boxShadow: (theme: Theme) =>
      `0 8px 24px ${alpha(theme.palette.common.black, theme.palette.mode === 'light' ? 0.14 : 0.34)}`,
  },
});

const getPetChoiceFrameSx = (selected: boolean) => (theme: Theme) => ({
  position: 'relative' as const,
  width: '100%',
  height: PET_CHOICE_IMAGE_HEIGHT,
  overflow: 'hidden',
  borderRadius: `${PET_CHOICE_RADIUS}px`,
  bgcolor: '#000',
  transform: 'translateZ(0)',
  ...(selected && {
    boxShadow: `inset 0 0 0 3px ${theme.palette.primary.main}`,
  }),
});

const petChoiceImageWrapperSx = {
  position: 'absolute' as const,
  inset: 0,
  overflow: 'hidden',
};

const petChoiceImageZoomSx = {
  width: '100%',
  height: '100%',
  transform: `scale(${PET_IMAGE_SCALE})`,
  transformOrigin: 'center center',
};

const petChoiceImageSx = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  objectPosition: 'center center',
  display: 'block',
};

const petChoiceOverlayGlassSx = {
  position: 'absolute' as const,
  inset: 0,
  zIndex: 0,
  borderRadius: `0 0 ${PET_CHOICE_RADIUS}px ${PET_CHOICE_RADIUS}px`,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  background:
    'linear-gradient(to top, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.28) 45%, transparent 100%)',
  maskImage: 'linear-gradient(to top, #000 35%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to top, #000 35%, transparent 100%)',
  pointerEvents: 'none' as const,
};

const petChoiceTitleOverlaySx = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1,
  overflow: 'hidden',
  borderRadius: `0 0 ${PET_CHOICE_RADIUS}px ${PET_CHOICE_RADIUS}px`,
  pointerEvents: 'none',
  color: 'white',
};

const petChoiceLabelSx = {
  position: 'relative',
  zIndex: 1,
  display: 'block',
  color: 'white',
  pl: 2,
  pr: 1.1,
  pt: 3,
  pb: 1.75,
  fontSize: '0.875rem',
  fontWeight: 500,
  lineHeight: 1.2,
  textAlign: 'left',
  pointerEvents: 'none',
};

interface PetChoiceButtonProps {
  label: string;
  imageSrc: string;
  selected: boolean;
  onClick: () => void;
}

const PetChoiceButton: React.FC<PetChoiceButtonProps> = ({ label, imageSrc, selected, onClick }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      sx={{ ...petChoiceCardSx, ...getPetChoiceCardStateSx(selected) }}
    >
      <Box sx={getPetChoiceFrameSx(selected)}>
        <Box sx={petChoiceImageWrapperSx}>
          <Box sx={petChoiceImageZoomSx}>
            <Box component="img" src={imageSrc} alt="" sx={petChoiceImageSx} />
          </Box>
        </Box>
        <Box sx={petChoiceTitleOverlaySx}>
          <Box sx={petChoiceOverlayGlassSx} />
          <Typography component="span" sx={petChoiceLabelSx}>
            {label}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const petHatchImageFrameSx = {
  width: '100%',
  maxWidth: 280,
  height: 260,
  mx: 'auto',
  overflow: 'hidden',
  mb: 1,
  borderRadius: SURFACE_BORDER_RADIUS,
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
  const [stepDirection, setStepDirection] = useState<StepDirection>('forward');
  const [species, setSpecies] = useState<PetSpecies | null>(null);
  const [variant, setVariant] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hatchResult, setHatchResult] = useState<{ pet: Pet; balance: number } | null>(null);

  const reset = () => {
    setStep(0);
    setStepDirection('forward');
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
    unlockPetRevealAudio();
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
    goToStep(index);
  };

  const goToStep = (nextStep: number) => {
    if (nextStep === step) return;
    setStepDirection(nextStep > step ? 'forward' : 'back');
    setStep(nextStep);
  };

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {PET_CATALOG.map((entry) => (
            <PetChoiceButton
              key={entry.id}
              label={t(entry.nameKey)}
              imageSrc={getPublicAssetPath(getPetImagePath(entry.id, getDefaultVariant(entry.id), 1))}
              selected={species === entry.id}
              onClick={() => {
                setSpecies(entry.id);
                setVariant(null);
                goToStep(1);
              }}
            />
          ))}
        </Box>
      );
    }

    if (step === 1 && species) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {PET_VARIANTS[species].map((v) => (
            <PetChoiceButton
              key={v}
              label={t(VARIANT_NAME_KEYS[species][v])}
              imageSrc={getPublicAssetPath(getPetImagePath(species, v, 1))}
              selected={variant === v}
              onClick={() => {
                setVariant(v);
                goToStep(2);
              }}
            />
          ))}
        </Box>
      );
    }

    if (step === 2 && species && variant) {
      return (
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
      );
    }

    return null;
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
        <Stepper
          activeStep={step}
          alternativeLabel
          nonLinear
          sx={{
            mb: 3,
            '& .MuiStepConnector-line': {
              width: '88%',
              marginLeft: 'auto',
              marginRight: 'auto',
            },
          }}
        >
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

        <Box sx={(theme) => getStepContentAreaSx(theme)}>
          <TransitionGroup component={null}>
            <Slide
              key={step}
              direction={stepDirection === 'forward' ? 'left' : 'right'}
              timeout={STEP_TRANSITION_MS}
              mountOnEnter
              unmountOnExit
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: step === 2 ? 'flex-start' : 'center',
                  justifyContent: 'center',
                }}
              >
                {renderStepContent()}
              </Box>
            </Slide>
          </TransitionGroup>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, minHeight: 52 }}>
        {step > 0 && (
          <Button onClick={() => goToStep(step - 1)} disabled={submitting}>
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
            sx={{ ml: 1, minWidth: 100 }}
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
