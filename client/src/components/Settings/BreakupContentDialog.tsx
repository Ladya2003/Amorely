import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import type { BreakupContentOptions } from './PartnerForm';

export type BreakupDialogMode = 'initiator' | 'receiver';

interface BreakupContentDialogProps {
  open: boolean;
  mode: BreakupDialogMode;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (options: BreakupContentOptions) => void | Promise<void>;
}

const BreakupContentDialog: React.FC<BreakupContentDialogProps> = ({
  open,
  mode,
  isLoading = false,
  onClose,
  onConfirm
}) => {
  const { t } = useTranslation();
  const [keepEvents, setKeepEvents] = useState(true);
  const [keepPlans, setKeepPlans] = useState(true);

  useEffect(() => {
    if (open) {
      setKeepEvents(true);
      setKeepPlans(true);
    }
  }, [open]);

  const handleConfirm = () => {
    void onConfirm({ keepEvents, keepPlans });
  };

  const titleKey = mode === 'initiator'
    ? 'settings.partner.breakupTitle'
    : 'settings.partner.breakupReceivedTitle';
  const messageKey = mode === 'initiator'
    ? 'settings.partner.breakupMessage'
    : 'settings.partner.breakupReceivedMessage';
  const confirmLabelKey = mode === 'initiator'
    ? 'settings.partner.remove'
    : 'settings.partner.breakupContinue';
  const loadingLabelKey = mode === 'initiator'
    ? 'settings.partner.removing'
    : 'settings.partner.breakupProcessing';

  return (
    <ResponsiveDialog
      open={open}
      onClose={mode === 'receiver' ? () => {} : onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={mode === 'receiver'}
    >
      <DialogTitle>{t(titleKey)}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t(messageKey)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('settings.partner.breakupHint')}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={keepEvents}
              onChange={(e) => setKeepEvents(e.target.checked)}
              disabled={isLoading}
            />
          }
          label={t('settings.partner.keepEvents')}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={keepPlans}
              onChange={(e) => setKeepPlans(e.target.checked)}
              disabled={isLoading}
            />
          }
          label={t('settings.partner.keepPlans')}
        />
      </DialogContent>
      <DialogActions>
        {mode === 'initiator' && (
          <Button onClick={onClose} disabled={isLoading}>
            {t('settings.partner.cancel')}
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={mode === 'initiator' ? 'error' : 'primary'}
          disabled={isLoading}
        >
          {isLoading ? t(loadingLabelKey) : t(confirmLabelKey)}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default BreakupContentDialog;
