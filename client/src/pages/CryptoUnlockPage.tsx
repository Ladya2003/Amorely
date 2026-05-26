import React, { useState } from 'react';
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
import ResponsiveDialog from '../components/UI/ResponsiveDialog';
import { useAuth } from '../contexts/AuthContext';
import { useCrypto } from '../contexts/CryptoContext';
// import {
//   PairingRequestPayload,
//   approvePairingRequest,
//   consumePairingRequest,
//   createPairingRequest,
//   importLocalKeysFileContent
// } from '../crypto/cryptoService';

const MIN_PASSPHRASE_WORDS = 12;

const countPassphraseWords = (value: string): number =>
  value.trim().split(/\s+/).filter(Boolean).length;

const CryptoUnlockPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const {
    isCryptoReady,
    createAndBackupKeys,
    restoreKeysFromPassphrase,
    generateSuggestedPassphrase
    // localDeviceKeys,
    // ensureLocalKeys
  } = useCrypto();
  const [tab, setTab] = useState(0);
  const [passphrase, setPassphrase] = useState('');
  const [restorePhrase, setRestorePhrase] = useState('');
  // const [pairingPayload, setPairingPayload] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [pairingPrivateJwk, setPairingPrivateJwk] = useState<JsonWebKey | null>(null);
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
      showCopyToast('Фраза скопирована', 'success');
    } catch {
      showCopyToast('Не удалось скопировать. Выделите фразу и скопируйте вручную.', 'error');
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

  // const userId = user?._id;

  const withAction = async (fn: () => Promise<void>) => {
    try {
      setIsLoading(true);
      setError(null);
      setStatus(null);
      await fn();
    } catch (caught: any) {
      setError(caught?.response?.data?.error || caught?.message || 'Не удалось выполнить действие');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClick = () => {
    const trimmedPassphrase = passphrase.trim();
    if (!trimmedPassphrase) {
      setError('Введите секретную фразу');
      return;
    }
    if (countPassphraseWords(trimmedPassphrase) < MIN_PASSPHRASE_WORDS) {
      const wordCount = countPassphraseWords(trimmedPassphrase);
      setError(
        `Секретная фраза должна содержать не менее ${MIN_PASSPHRASE_WORDS} слов. Слов в вашей фразе - ${wordCount}`
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
      setStatus('Устройство подключено. Сохраните фразу в надёжном месте — она понадобится на других устройствах.');
    });
  };

  const handleRestore = async () => {
    if (!restorePhrase.trim()) {
      setError('Введите секретную фразу');
      return;
    }

    await withAction(async () => {
      await restoreKeysFromPassphrase(restorePhrase.trim());
      setStatus('Доступ восстановлен. Можно пользоваться приложением.');
    });
  };

  // const handleFileRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file || !userId) return;
  //
  //   await withAction(async () => {
  //     const content = await file.text();
  //     await importLocalKeysFileContent(userId, content);
  //     await ensureLocalKeys();
  //     setStatus('Доступ восстановлен из файла');
  //   });
  // };

  // const handleCreatePairing = async () => {
  //   if (!userId) {
  //     setError('Пользователь не авторизован');
  //     return;
  //   }
  //
  //   await withAction(async () => {
  //     const request = await createPairingRequest(localDeviceKeys?.deviceId || `pending-${Date.now()}`);
  //     setPairingPayload(JSON.stringify(request.payload));
  //     setPairingPrivateJwk(request.privateJwk);
  //     setStatus('Код для подключения создан. Передайте его на устройство, где вы уже заходили в приложение.');
  //   });
  // };

  // const handleApprovePairing = async () => {
  //   if (!localDeviceKeys) {
  //     setError('На этом устройстве ещё нет доступа к сообщениям');
  //     return;
  //   }
  //   if (!pairingPayload.trim()) {
  //     setError('Вставьте код подключения');
  //     return;
  //   }
  //
  //   await withAction(async () => {
  //     const parsed = JSON.parse(pairingPayload) as PairingRequestPayload;
  //     await approvePairingRequest(parsed, localDeviceKeys);
  //     setStatus('Подключение подтверждено. На новом устройстве нажмите «Завершить подключение».');
  //   });
  // };

  // const handleCompletePairing = async () => {
  //   if (!userId) {
  //     setError('Пользователь не авторизован');
  //     return;
  //   }
  //   if (!pairingPrivateJwk) {
  //     setError('Сначала создайте код подключения на этом устройстве');
  //     return;
  //   }
  //   if (!pairingPayload.trim()) {
  //     setError('Вставьте код подключения');
  //     return;
  //   }
  //
  //   await withAction(async () => {
  //     const parsed = JSON.parse(pairingPayload) as PairingRequestPayload;
  //     await consumePairingRequest(userId, parsed, pairingPrivateJwk);
  //     await ensureLocalKeys();
  //     setStatus('Новое устройство подключено');
  //   });
  // };

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
        <Button
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          color="inherit"
          sx={{
            alignSelf: 'flex-start',
            mb: 1,
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
          Назад
        </Button>
        <Typography variant="h5" fontWeight={500} sx={{ mb: 2 }}>
          Добавление секретной фразы
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {`Я, как владелец Amorely, не могу прочитать ваши сообщения и посмотреть события.

Это сделано для того, чтобы вы были уверены в приватности вашего контента. 

Чтобы это работало, вам необходимо придумать секретную фразу и записать её в другой мессенджер или в блокнот.

Важно: если вы её потеряете, мы с вами никак не сможем восстановить ваши данные — сообщения в чатах, текст и медиа в календаре.`}
        </Typography>

        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" sx={{ mb: 2 }}>
          <Tab label="Создать новую" />
          <Tab label="Ввести готовую" />
          {/* <Tab label="Файл" /> */}
          {/* <Tab label="Другое устройство" /> */}
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {status && <Alert severity="success" sx={{ mb: 2 }}>{status}</Alert>}

        {tab === 0 && (
          <Box>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Секретная фраза"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: passphrase ? (
                  <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                    <IconButton
                      size="small"
                      aria-label="Очистить"
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
                Сгенерировать случайную
              </Button>
              <Button
                disabled={isLoading || !passphrase.trim()}
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyPassphrase}
              >
                Скопировать
              </Button>
            </Box>
            <Button disabled={isLoading} variant="contained" onClick={handleSaveClick}>
              Сохранить и продолжить
            </Button>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Секретная фраза"
              value={restorePhrase}
              onChange={(event) => setRestorePhrase(event.target.value)}
              sx={{ mb: 2 }}
            />
            <Button disabled={isLoading} variant="contained" onClick={handleRestore}>
              Подключить устройство
            </Button>
          </Box>
        )}

        {/* {tab === 2 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Если вы раньше сохраняли файл с настройками доступа на другом устройстве, выберите его здесь.
            </Typography>
            <Button disabled={isLoading} component="label" variant="outlined">
              Выбрать файл
              <input hidden type="file" accept=".json,.txt,.backup" onChange={handleFileRestore} />
            </Button>
          </Box>
        )} */}

        {/* {tab === 3 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              На устройстве, где вы уже пользуетесь приложением, создайте код и передайте его сюда — через
              мессенджер или вставкой в поле ниже.
            </Typography>
            <Button sx={{ mb: 2, mr: 1 }} variant="outlined" onClick={handleCreatePairing} disabled={isLoading}>
              Создать код (новое устройство)
            </Button>
            <Button sx={{ mb: 2, mr: 1 }} variant="contained" onClick={handleApprovePairing} disabled={isLoading}>
              Подтвердить (старое устройство)
            </Button>
            <Button sx={{ mb: 2 }} variant="outlined" onClick={handleCompletePairing} disabled={isLoading}>
              Завершить подключение
            </Button>
            <TextField
              fullWidth
              multiline
              minRows={5}
              label="Код подключения"
              value={pairingPayload}
              onChange={(event) => setPairingPayload(event.target.value)}
            />
          </Box>
        )} */}
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
        <DialogTitle>Вы уверены, что сохранили вашу фразу?</DialogTitle>
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
            Скопировать
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={isLoading}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleConfirmCreateKeys} disabled={isLoading}>
            Да, сохранил(а)
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
