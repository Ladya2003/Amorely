import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { alpha } from '@mui/material/styles';
import ResponsiveDialog from '../UI/ResponsiveDialog';

export const PET_FEED_COST = 2;

interface PetFeedDialogProps {
  open: boolean;
  onClose: () => void;
  onFeed: () => Promise<void>;
  balance: number;
}

const PetFeedDialog: React.FC<PetFeedDialogProps> = ({ open, onClose, onFeed, balance }) => {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const canAfford = balance >= PET_FEED_COST;

  const handleFeed = async () => {
    if (!canAfford || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await onFeed();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{t('pets.feedTitle')}</DialogTitle>
      <DialogContent sx={{ pt: 2.5 }}>
        <Box
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            mx: 'auto',
            mb: 2,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.warning.main, 0.14),
            color: theme.palette.warning.dark,
          })}
        >
          <RestaurantMenuIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography variant="body1" textAlign="center" sx={{ mb: 1.5 }}>
          {t('pets.feedDescription', { cost: PET_FEED_COST })}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('pets.feedSatietyHint')}
        </Typography>
        {!canAfford && (
          <Typography variant="body2" color="error.main" textAlign="center" sx={{ mt: 2 }}>
            {t('pets.feedInsufficientBalance', { cost: PET_FEED_COST })}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={() => void handleFeed()} disabled={!canAfford || submitting}>
          {submitting ? <CircularProgress size={22} /> : t('pets.feedConfirm')}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default PetFeedDialog;
