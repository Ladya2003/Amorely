import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import type { CliffLiftPet } from '../../../services/gamesService';
import { CLIFF_ASSETS } from './cliffAssets';
import CliffModalFrame from './CliffModalFrame';
import {
  getCliffLiftPetPickSx,
  getCliffModalBodySx,
  getCliffModalGhostButtonSx,
  getCliffModalPrimaryButtonSx,
} from './cliffStyles';

type CliffLiftDialogProps = {
  raised: boolean;
  requiredCount: number;
  eligiblePets: CliffLiftPet[];
  standingPets: CliffLiftPet[];
  activating: boolean;
  onActivate: (petIds: string[]) => void;
  onClose: () => void;
};

const CliffLiftDialog: React.FC<CliffLiftDialogProps> = ({
  raised,
  requiredCount,
  eligiblePets,
  standingPets,
  activating,
  onActivate,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (raised) {
      setSelectedIds([]);
      return;
    }
    if (eligiblePets.length === requiredCount) {
      setSelectedIds(eligiblePets.map((pet) => pet.id));
    }
  }, [eligiblePets, raised, requiredCount]);

  const togglePet = (petId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(petId)) {
        return prev.filter((id) => id !== petId);
      }
      if (prev.length >= requiredCount) {
        return [...prev.slice(1), petId];
      }
      return [...prev, petId];
    });
  };

  const canActivate = !raised && selectedIds.length === requiredCount && eligiblePets.length >= requiredCount;

  return (
    <CliffModalFrame
      title={t('games.cliff.lift.title')}
      heroSrc={CLIFF_ASSETS.pressurePlate}
      roomy
      actions={
        <>
          {canActivate && (
            <Button
              onClick={() => onActivate(selectedIds)}
              disabled={activating}
              sx={getCliffModalPrimaryButtonSx()}
            >
              {t('games.cliff.lift.activate')}
            </Button>
          )}
          <Button onClick={onClose} sx={getCliffModalGhostButtonSx()}>
            {t('games.common.close')}
          </Button>
        </>
      }
    >
      <Typography variant="body2" sx={getCliffModalBodySx()}>
        {raised ? t('games.cliff.lift.raised') : t('games.cliff.lift.lore')}
      </Typography>
      {!raised && eligiblePets.length < requiredCount && (
        <Typography variant="body2" sx={{ color: '#b42318', fontWeight: 700, mb: 1.5 }}>
          {t('games.cliff.lift.needPets')}
        </Typography>
      )}
      {!raised && eligiblePets.length > 0 && (
        <>
          <Typography variant="body2" sx={{ ...getCliffModalBodySx(), mb: 1 }}>
            {t('games.cliff.lift.pick')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
              gap: 1,
              mb: 0.5,
            }}
          >
            {eligiblePets.map((pet) => (
              <Box
                key={pet.id}
                component="button"
                type="button"
                onClick={() => togglePet(pet.id)}
                sx={getCliffLiftPetPickSx(selectedIds.includes(pet.id))}
              >
                <Box component="img" src={pet.imageUrl} alt="" />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#5c2618', lineHeight: 1.2 }}>
                  {pet.name}
                </Typography>
                <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: '#8b4a2b' }}>
                  {t(pet.mine ? 'games.cliff.lift.you' : 'games.cliff.lift.partner')} ·{' '}
                  {t('games.cliff.lift.level', { level: pet.level })}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
      {raised && standingPets.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {standingPets.map((pet) => (
            <Box key={pet.id} sx={{ ...getCliffLiftPetPickSx(true), cursor: 'default' }}>
              <Box component="img" src={pet.imageUrl} alt="" />
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#5c2618' }}>{pet.name}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </CliffModalFrame>
  );
};

export default CliffLiftDialog;
