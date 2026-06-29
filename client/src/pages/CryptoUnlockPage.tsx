import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {
  AlertColor,
  Alert,
  Box,
  Button,
  Container,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import LanguageSelector from '../components/UI/LanguageSelector';
import ResponsiveDialog from '../components/UI/ResponsiveDialog';
import { useAuth } from '../contexts/AuthContext';
import { useCrypto } from '../contexts/CryptoContext';
import {
  getAuthAlertSx,
  getAuthBackButtonSx,
  getAuthCryptoActionRowSx,
  getAuthCryptoDescriptionSx,
  getAuthCryptoPanelEnterSx,
  getAuthCryptoTitleSx,
  getAuthOutlinedButtonSx,
  getAuthPageCardSx,
  getAuthPageContainerSx,
  getAuthPageRootSx,
  getAuthPageTopBarSx,
  getAuthPrimaryButtonSx,
  getAuthToggleGroupSx,
} from '../components/Auth/authPageStyles';

const MIN_PASSPHRASE_WORDS = 12;

const countPassphraseWords = (value: string): number =>
  value.trim().split(/\s+/).filter(Boolean).length;

const CryptoUnlockPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    isCryptoReady,
    createAndBackupKeys,
    restoreKeysFromPassphrase,
    generateSuggestedPassphrase,
  } = useCrypto();
  const [tab, setTab] = useState(() => (user?.hasCryptoBackup ? 1 : 0));
  const [passphrase, setPassphrase] = useState('');
  const [restorePhrase, setRestorePhrase] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copyToastOpen, setCopyToastOpen] = useState(false);
  const [copyToastMessage, setCopyToastMessage] = useState('');
  const [copyToastSeverity, setCopyToastSeverity] = useState<AlertColor>('success');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const showCopyToast = (message: string, severity: AlertColor) => {
    setCopyToastMessage(message);
    setCopyToastSeverity(severity);
    setCopyToastOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showCopyToast(t('crypto.unlock.copySuccess'), 'success');
    } catch {
      showCopyToast(t('crypto.unlock.copyFailed'), 'error');
    }
  };

  const handleCopyPassphrase = () => {
    if (!passphrase.trim()) return;
    copyToClipboard(passphrase.trim());
  };

  const handleCopyInModal = () => {
    copyToClipboard(passphrase.trim());
  };

  const handleGeneratePassphrase = () => {
    setPassphrase(generateSuggestedPassphrase());
    setError(null);
  };

  const handleBack = () => {
    logout();
    navigate('/auth');
  };

  if (isCryptoReady) {
    const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    const to =
      fromPath && fromPath !== '/crypto/unlock' && fromPath !== '/auth'
        ? fromPath
        : '/';
    return <Navigate to={to} replace />;
  }

  const withAction = async (fn: () => Promise<void>) => {
    try {
      setIsLoading(true);
      setError(null);
      setStatus(null);
      await fn();
    } catch (caught: any) {
      setError(caught?.response?.data?.error || caught?.message || t('crypto.unlock.actionFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClick = () => {
    const trimmedPassphrase = passphrase.trim();
    if (!trimmedPassphrase) {
      setError(t('crypto.unlock.enterPassphrase'));
      return;
    }
    if (countPassphraseWords(trimmedPassphrase) < MIN_PASSPHRASE_WORDS) {
      const wordCount = countPassphraseWords(trimmedPassphrase);
      setError(
        t('crypto.unlock.passphraseMinWords', { min: MIN_PASSPHRASE_WORDS, count: wordCount })
      );
      return;
    }
    setError(null);
    setConfirmDialogOpen(true);
  };

  const handleConfirmCreateKeys = async () => {
    setConfirmDialogOpen(false);
    await withAction(async () => {
      await createAndBackupKeys(passphrase.trim());
      setStatus(t('crypto.unlock.deviceConnected'));
    });
  };

  const handleRestore = async () => {
    if (!restorePhrase.trim()) {
      setError(t('crypto.unlock.enterPassphrase'));
      return;
    }

    await withAction(async () => {
      await restoreKeysFromPassphrase(restorePhrase.trim());
      setStatus(t('crypto.unlock.accessRestored'));
    });
  };

  return (
    <Box sx={getAuthPageRootSx(theme)}>
      <Container maxWidth="sm" sx={getAuthPageContainerSx()}>
        <Box
          sx={{
            ...getAuthPageTopBarSx(),
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={getAuthBackButtonSx(theme)}
          >
            {t('crypto.unlock.back')}
          </Button>
          <LanguageSelector />
        </Box>

        <Box sx={getAuthPageCardSx(theme)}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
            <LockOutlinedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography component="h1" sx={getAuthCryptoTitleSx()}>
              {t('crypto.unlock.title')}
            </Typography>
          </Box>

          <Typography sx={getAuthCryptoDescriptionSx()}>
            {t('crypto.unlock.description')}
          </Typography>

          <ToggleButtonGroup
            value={tab}
            exclusive
            onChange={(_, value) => value !== null && setTab(value)}
            fullWidth
            sx={{ ...getAuthToggleGroupSx, mb: 2.5 }}
          >
            <ToggleButton value={0}>{t('crypto.unlock.tabCreate')}</ToggleButton>
            <ToggleButton value={1}>{t('crypto.unlock.tabRestore')}</ToggleButton>
          </ToggleButtonGroup>

          {error && (
            <Alert severity="error" sx={getAuthAlertSx(theme)}>
              {error}
            </Alert>
          )}
          {status && (
            <Alert severity="success" sx={getAuthAlertSx(theme)}>
              {status}
            </Alert>
          )}

          {tab === 0 && (
            <Box key="create" sx={getAuthCryptoPanelEnterSx(0)}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                placeholder={t('crypto.unlock.passphrasePlaceholder')}
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: passphrase ? (
                    <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <IconButton
                        size="small"
                        aria-label={t('crypto.unlock.clearPassphrase')}
                        onClick={() => setPassphrase('')}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
              />
              <Box sx={getAuthCryptoActionRowSx()}>
                <Button
                  disabled={isLoading}
                  variant="outlined"
                  onClick={handleGeneratePassphrase}
                  sx={getAuthOutlinedButtonSx(theme)}
                >
                  {t('crypto.unlock.generateRandom')}
                </Button>
                <Button
                  disabled={isLoading || !passphrase.trim()}
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyPassphrase}
                  sx={getAuthOutlinedButtonSx(theme)}
                >
                  {t('crypto.unlock.copy')}
                </Button>
              </Box>
              <Button
                disabled={isLoading}
                variant="contained"
                fullWidth
                onClick={handleSaveClick}
                sx={getAuthPrimaryButtonSx()}
              >
                {t('crypto.unlock.saveAndContinue')}
              </Button>
            </Box>
          )}

          {tab === 1 && (
            <Box key="restore" sx={getAuthCryptoPanelEnterSx(1)}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                placeholder={t('crypto.unlock.passphrasePlaceholder')}
                value={restorePhrase}
                onChange={(event) => setRestorePhrase(event.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                disabled={isLoading}
                variant="contained"
                fullWidth
                onClick={handleRestore}
                sx={getAuthPrimaryButtonSx()}
              >
                {t('crypto.unlock.connectDevice')}
              </Button>
            </Box>
          )}
        </Box>
      </Container>

      <ResponsiveDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('crypto.unlock.confirmTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={passphrase}
            InputProps={{ readOnly: true }}
            sx={{ mt: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyInModal}
            sx={{ ...getAuthOutlinedButtonSx(theme), mt: 2 }}
          >
            {t('crypto.unlock.copy')}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={isLoading}>
            {t('crypto.unlock.cancel')}
          </Button>
          <Button variant="contained" onClick={handleConfirmCreateKeys} disabled={isLoading}>
            {t('crypto.unlock.confirmSaved')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>

      <CustomSnackbar
        open={copyToastOpen}
        message={copyToastMessage}
        severity={copyToastSeverity}
        onClose={() => setCopyToastOpen(false)}
      />
    </Box>
  );
};

export default CryptoUnlockPage;
