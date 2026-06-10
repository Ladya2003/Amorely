import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  AlertColor,
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import LanguageSelector from '../components/UI/LanguageSelector';
import ResponsiveDialog from '../components/UI/ResponsiveDialog';
import { useAuth } from '../contexts/AuthContext';
import { useCrypto } from '../contexts/CryptoContext';

const MIN_PASSPHRASE_WORDS = 12;

const countPassphraseWords = (value: string): number =>
  value.trim().split(/\s+/).filter(Boolean).length;

const CryptoUnlockPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const {
    isCryptoReady,
    createAndBackupKeys,
    restoreKeysFromPassphrase,
    generateSuggestedPassphrase
  } = useCrypto();
  const [tab, setTab] = useState(0);
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
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default'
      }}
    >
      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          borderRadius: 0,
          boxShadow: 'none'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1 }}>
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            color="inherit"
            sx={{
              alignSelf: 'flex-start',
              ml: -1,
              textTransform: 'uppercase',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              '& .MuiButton-startIcon': {
                margin: 0,
                marginRight: 1,
                display: 'inline-flex',
                alignItems: 'center'
              }
            }}
          >
            {t('crypto.unlock.back')}
          </Button>
          <LanguageSelector />
        </Box>
        <Typography variant="h5" fontWeight={500} sx={{ mb: 2 }}>
          {t('crypto.unlock.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {t('crypto.unlock.description')}
        </Typography>

        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" sx={{ mb: 2 }}>
          <Tab label={t('crypto.unlock.tabCreate')} />
          <Tab label={t('crypto.unlock.tabRestore')} />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {status && <Alert severity="success" sx={{ mb: 2 }}>{status}</Alert>}

        {tab === 0 && (
          <Box>
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
                ) : undefined
              }}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Button disabled={isLoading} variant="outlined" onClick={handleGeneratePassphrase}>
                {t('crypto.unlock.generateRandom')}
              </Button>
              <Button
                disabled={isLoading || !passphrase.trim()}
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyPassphrase}
              >
                {t('crypto.unlock.copy')}
              </Button>
            </Box>
            <Button disabled={isLoading} variant="contained" onClick={handleSaveClick}>
              {t('crypto.unlock.saveAndContinue')}
            </Button>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder={t('crypto.unlock.passphrasePlaceholder')}
              value={restorePhrase}
              onChange={(event) => setRestorePhrase(event.target.value)}
              sx={{ mb: 2 }}
            />
            <Button disabled={isLoading} variant="contained" onClick={handleRestore}>
              {t('crypto.unlock.connectDevice')}
            </Button>
          </Box>
        )}
      </Paper>

      <ResponsiveDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: (theme) => ({
              bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : theme.palette.grey[100],
              backgroundImage: 'none'
            })
          }
        }}
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
            sx={{ mt: 2 }}
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
