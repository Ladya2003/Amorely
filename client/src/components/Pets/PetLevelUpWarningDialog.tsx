import React from 'react';
import { useTranslation } from 'react-i18next';
import { DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { FavoriteRoundedIcon, RestaurantMenuIcon, WarningAmberRoundedIcon } from '../UI/icons';

interface PetLevelUpWarningDialogProps {
  open: boolean;
  onClose: () => void;
  hungry: boolean;
  affectionLow: boolean;
}

const PetLevelUpWarningDialog: React.FC<PetLevelUpWarningDialogProps> = ({
  open,
  onClose,
  hungry,
  affectionLow,
}) => {
  const { t } = useTranslation();
  const showBoth = hungry && affectionLow;
  const title = showBoth
    ? t('pets.levelUpWarning.title')
    : hungry
      ? t('pets.levelUpWarning.hungryTitle')
      : t('pets.levelUpWarning.affectionTitle');
  const Icon = showBoth
    ? WarningAmberRoundedIcon
    : hungry
      ? RestaurantMenuIcon
      : FavoriteRoundedIcon;

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
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
          <Icon sx={{ fontSize: 36 }} />
        </Box>
        {hungry && (
          <Typography
            variant={showBoth ? 'body2' : 'body1'}
            color={showBoth ? 'text.secondary' : 'text.primary'}
            textAlign="center"
            sx={{ mb: affectionLow ? 2 : 0 }}
          >
            {showBoth ? (
              <>
                <Box component="span" sx={{ display: 'block', fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                  {t('pets.levelUpWarning.hungryTitle')}
                </Box>
                {t('pets.levelUpWarning.hungryBody')}
              </>
            ) : (
              t('pets.levelUpWarning.hungryBody')
            )}
          </Typography>
        )}
        {affectionLow && (
          <Typography
            variant={showBoth ? 'body2' : 'body1'}
            color={showBoth ? 'text.secondary' : 'text.primary'}
            textAlign="center"
          >
            {showBoth ? (
              <>
                <Box component="span" sx={{ display: 'block', fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                  {t('pets.levelUpWarning.affectionTitle')}
                </Box>
                {t('pets.levelUpWarning.affectionBody')}
              </>
            ) : (
              t('pets.levelUpWarning.affectionBody')
            )}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose} fullWidth>
          {t('pets.levelUpWarning.gotIt')}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default PetLevelUpWarningDialog;
