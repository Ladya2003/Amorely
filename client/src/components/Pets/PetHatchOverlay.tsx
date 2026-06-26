import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Portal, Box, Typography, Button, Fade } from '@mui/material';
import type { PetSpecies } from '../../config/petCatalogShared';
import { getPetEggSrc } from '../../config/petEggAssets';
import { getPetImagePath } from '../../config/petCatalog';
import { getPublicAssetPath } from '../../utils/publicAssetPath';

const ZOOM_MS = 2600;
const FLASH_MS = 350;

interface PetHatchOverlayProps {
  species: PetSpecies;
  variant: string;
  petName: string;
  toLevel: number;
  /** Omit for egg → pet hatch; pass previous main level for level-up reveal. */
  fromLevel?: number;
  onContinue: () => void;
}

const PetHatchOverlay: React.FC<PetHatchOverlayProps> = ({
  species,
  variant,
  petName,
  toLevel,
  fromLevel,
  onContinue,
}) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'zoom' | 'flash' | 'reveal'>('zoom');
  const [showCongrats, setShowCongrats] = useState(false);

  const isHatch = fromLevel === undefined;
  const fromSrc = isHatch
    ? getPetEggSrc(species, variant)
    : getPublicAssetPath(getPetImagePath(species, variant, fromLevel));
  const toSrc = getPublicAssetPath(getPetImagePath(species, variant, toLevel));

  useEffect(() => {
    const flashTimer = window.setTimeout(() => setPhase('flash'), ZOOM_MS);
    const revealTimer = window.setTimeout(() => {
      setPhase('reveal');
      setShowCongrats(true);
    }, ZOOM_MS + FLASH_MS);

    return () => {
      window.clearTimeout(flashTimer);
      window.clearTimeout(revealTimer);
    };
  }, []);

  const showPet = phase === 'flash' || phase === 'reveal';

  const congratsMessage = isHatch
    ? t('pets.hatchCongrats', { name: petName })
    : t('pets.levelUpRevealCongrats', { name: petName, level: toLevel });

  return (
    <Portal>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1600,
          bgcolor: 'rgba(0, 0, 0, 0.82)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 3,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: { xs: 240, sm: 280 },
            height: { xs: 280, sm: 320 },
            flexShrink: 0,
            transform: phase === 'reveal' ? 'scale(1)' : undefined,
            transition: phase === 'reveal' ? 'transform 500ms ease-out' : undefined,
            animation: phase === 'zoom' ? `petHatchZoom ${ZOOM_MS}ms ease-in forwards` : undefined,
            '@keyframes petHatchZoom': {
              from: { transform: 'scale(1)' },
              to: { transform: 'scale(2.15)' },
            },
          }}
        >
          <Box
            component="img"
            src={fromSrc}
            alt=""
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              borderRadius: 2,
              opacity: showPet ? 0 : 1,
              transition: showPet ? 'opacity 80ms ease-out' : 'none',
            }}
          />
          <Box
            component="img"
            src={toSrc}
            alt=""
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              borderRadius: 2,
              opacity: showPet ? 1 : 0,
              transition: showPet ? 'opacity 120ms ease-in' : 'none',
            }}
          />

          {phase === 'flash' && (
            <Box
              sx={{
                position: 'absolute',
                inset: -8,
                borderRadius: 3,
                bgcolor: '#fff',
                animation: `petHatchFlash ${FLASH_MS}ms ease-out forwards`,
                pointerEvents: 'none',
                '@keyframes petHatchFlash': {
                  '0%': { opacity: 0.95 },
                  '40%': { opacity: 1 },
                  '100%': { opacity: 0 },
                },
              }}
            />
          )}
        </Box>

        <Fade in={showCongrats} timeout={600}>
          <Box sx={{ textAlign: 'center', mt: 3, maxWidth: 360 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ color: '#fff', mb: 2, lineHeight: 1.35 }}
            >
              {congratsMessage}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={onContinue}
              sx={{
                px: 4,
                borderRadius: 3,
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(255, 105, 180, 0.45)',
              }}
            >
              {t('pets.hatchContinue')}
            </Button>
          </Box>
        </Fade>
      </Box>
    </Portal>
  );
};

export default PetHatchOverlay;
