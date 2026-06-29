import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardActionArea, CardContent, Typography, Box } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { alpha } from '@mui/material/styles';
import type { Pet } from '../../services/petsService';
import { getPublicAssetPath } from '../../utils/publicAssetPath';
import { getSubLevelMax } from '../../config/petCatalogShared';
import { SURFACE_BORDER_RADIUS } from '../Feed/feedBannerStyles';
import PetLevelProgress from './PetLevelProgress';

interface PetCardProps {
  pet: Pet;
  compact?: boolean;
  onSelect?: (pet: Pet) => void;
}

const PetCard: React.FC<PetCardProps> = ({ pet, compact = false, onSelect }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const subLevel = pet.subLevel ?? 0;
  const subLevelMax = pet.subLevelMax ?? getSubLevelMax(pet.level);
  const cardRadius = compact ? 20 : SURFACE_BORDER_RADIUS;

  const handleClick = () => {
    if (onSelect) {
      onSelect(pet);
      return;
    }
    navigate(`/pets/${pet.id}`);
  };

  return (
    <Card
      elevation={0}
      sx={(theme) => ({
        width: '100%',
        height: '100%',
        borderRadius: `${cardRadius}px`,
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.2),
        boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, theme.palette.mode === 'light' ? 0.08 : 0.22)}`,
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        ...(compact && { minWidth: 120, maxWidth: 130, flexShrink: 0 }),
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: `0 8px 22px ${alpha(theme.palette.primary.main, 0.28)}`,
        },
      })}
    >
      <CardActionArea
        onClick={handleClick}
        sx={{
          height: '100%',
          borderRadius: `${cardRadius}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <Box
          sx={(theme) => ({
            position: 'relative',
            width: '100%',
            height: compact ? 110 : 130,
            overflow: 'hidden',
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.06 : 0.12),
          })}
        >
          <Box
            component="img"
            src={getPublicAssetPath(pet.imageUrl)}
            alt={pet.name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              transform: 'scale(1.5)',
              display: 'block',
            }}
          />
          {pet.giftedByUsername && (
            <Box
              aria-label={t('pets.giftedByLabel')}
              sx={(theme) => ({
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.dark, 0.88),
                color: theme.palette.primary.contrastText,
                boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.24)}`,
                border: `1px solid ${alpha(theme.palette.primary.contrastText, 0.22)}`,
              })}
            >
              <CardGiftcardIcon sx={{ fontSize: 16 }} />
            </Box>
          )}
        </Box>
        <CardContent sx={{ py: 1.25, px: 1.5, flex: 1, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="subtitle2" noWrap fontWeight={600}>
            {pet.name}
          </Typography>
          <Box sx={{ mt: 0.75 }}>
            <PetLevelProgress
              level={pet.level}
              subLevel={subLevel}
              subLevelMax={subLevelMax}
              levelProgressPercent={pet.levelProgressPercent}
              compact
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default PetCard;
