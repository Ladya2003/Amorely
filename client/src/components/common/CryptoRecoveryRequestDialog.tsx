import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Typography,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockResetIcon from '@mui/icons-material/LockReset';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { useCrypto } from '../../contexts/CryptoContext';
import {
  createCryptoRecoveryRequest,
  type CryptoRecoveryContext,
  type CryptoRecoveryRememberOption,
  type CryptoRecoveryYesNoUnsure,
} from '../../services/cryptoRecoveryService';

interface CryptoRecoveryRequestDialogProps {
  open: boolean;
  onClose: () => void;
  context?: CryptoRecoveryContext;
}

const CryptoRecoveryRequestDialog: React.FC<CryptoRecoveryRequestDialogProps> = ({
  open,
  onClose,
  context = 'other',
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { localDeviceKeys } = useCrypto();
  const [multiplePassphrases, setMultiplePassphrases] = useState<CryptoRecoveryYesNoUnsure | ''>('');
  const [hasOldDeviceAccess, setHasOldDeviceAccess] = useState<CryptoRecoveryYesNoUnsure | ''>('');
  const [rememberOldPassphrase, setRememberOldPassphrase] = useState<CryptoRecoveryRememberOption | ''>(
    ''
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setMultiplePassphrases('');
    setHasOldDeviceAccess('');
    setRememberOldPassphrase('');
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    window.setTimeout(resetForm, 200);
  };

  // Keep question labels readable on glass modal — don't turn pink when a radio is focused.
  const questionLabelSx = {
    mb: 0.75,
    fontWeight: 600,
    color: 'text.primary',
    '&.Mui-focused': {
      color: 'text.primary',
    },
  } as const;

  const handleSubmit = async () => {
    if (!multiplePassphrases || !hasOldDeviceAccess || !rememberOldPassphrase) {
      setError(t('crypto.recoveryRequest.validationRequired'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createCryptoRecoveryRequest({
        multiplePassphrases,
        hasOldDeviceAccess,
        rememberOldPassphrase,
        context,
        currentDeviceId: localDeviceKeys?.deviceId,
      });
      setSuccess(true);
    } catch (submitError: unknown) {
      const axiosError = submitError as {
        response?: { status?: number; data?: { error?: string } };
        message?: string;
      };
      setError(
        axiosError?.response?.data?.error ||
          axiosError?.message ||
          t('crypto.recoveryRequest.submitFailed')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <LockResetIcon color="primary" />
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              {t('crypto.recoveryRequest.title')}
            </Typography>
          </Box>
          <IconButton aria-label={t('crypto.recoveryRequest.close')} onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, whiteSpace: 'pre-line' }}>
          {t('crypto.recoveryRequest.description')}
        </Typography>

        {success ? (
          <Alert severity="success">{t('crypto.recoveryRequest.success')}</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <FormControl required>
              <FormLabel sx={questionLabelSx}>
                {t('crypto.recoveryRequest.multiplePassphrases')}
              </FormLabel>
              <RadioGroup
                value={multiplePassphrases}
                onChange={(event) =>
                  setMultiplePassphrases(event.target.value as CryptoRecoveryYesNoUnsure)
                }
              >
                <FormControlLabel value="yes" control={<Radio />} label={t('crypto.recoveryRequest.yes')} />
                <FormControlLabel value="no" control={<Radio />} label={t('crypto.recoveryRequest.no')} />
                <FormControlLabel
                  value="unsure"
                  control={<Radio />}
                  label={t('crypto.recoveryRequest.unsure')}
                />
              </RadioGroup>
              <FormHelperText>{t('crypto.recoveryRequest.multiplePassphrasesHint')}</FormHelperText>
            </FormControl>

            <FormControl required>
              <FormLabel sx={questionLabelSx}>
                {t('crypto.recoveryRequest.hasOldDeviceAccess')}
              </FormLabel>
              <RadioGroup
                value={hasOldDeviceAccess}
                onChange={(event) =>
                  setHasOldDeviceAccess(event.target.value as CryptoRecoveryYesNoUnsure)
                }
              >
                <FormControlLabel value="yes" control={<Radio />} label={t('crypto.recoveryRequest.yes')} />
                <FormControlLabel value="no" control={<Radio />} label={t('crypto.recoveryRequest.no')} />
                <FormControlLabel
                  value="unsure"
                  control={<Radio />}
                  label={t('crypto.recoveryRequest.unsure')}
                />
              </RadioGroup>
              <FormHelperText>{t('crypto.recoveryRequest.hasOldDeviceAccessHint')}</FormHelperText>
            </FormControl>

            <FormControl required>
              <FormLabel sx={questionLabelSx}>
                {t('crypto.recoveryRequest.rememberOldPassphrase')}
              </FormLabel>
              <RadioGroup
                value={rememberOldPassphrase}
                onChange={(event) =>
                  setRememberOldPassphrase(event.target.value as CryptoRecoveryRememberOption)
                }
              >
                <FormControlLabel
                  value="yes"
                  control={<Radio />}
                  label={t('crypto.recoveryRequest.rememberYes')}
                />
                <FormControlLabel
                  value="partial"
                  control={<Radio />}
                  label={t('crypto.recoveryRequest.rememberPartial')}
                />
                <FormControlLabel
                  value="no"
                  control={<Radio />}
                  label={t('crypto.recoveryRequest.rememberNo')}
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {success ? (
          <Button variant="contained" onClick={handleClose}>
            {t('crypto.recoveryRequest.close')}
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={isSubmitting}>
              {t('crypto.recoveryRequest.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: `0 8px 20px ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.35)'}`,
              }}
            >
              {isSubmitting
                ? t('crypto.recoveryRequest.submitting')
                : t('crypto.recoveryRequest.submit')}
            </Button>
          </>
        )}
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default CryptoRecoveryRequestDialog;
