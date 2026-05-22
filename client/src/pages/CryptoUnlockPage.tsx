import React, { useMemo, useState } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCrypto } from '../contexts/CryptoContext';
import {
  PairingRequestPayload,
  approvePairingRequest,
  consumePairingRequest,
  createPairingRequest,
  importLocalKeysFileContent
} from '../crypto/cryptoService';

const CryptoUnlockPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const {
    isCryptoReady,
    createAndBackupKeys,
    restoreKeysFromPassphrase,
    generateSuggestedPassphrase,
    localDeviceKeys,
    ensureLocalKeys
  } =
    useCrypto();
  const [tab, setTab] = useState(0);
  const [passphrase, setPassphrase] = useState('');
  const [restorePhrase, setRestorePhrase] = useState('');
  const [pairingPayload, setPairingPayload] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pairingPrivateJwk, setPairingPrivateJwk] = useState<JsonWebKey | null>(null);
  const [phraseCopied, setPhraseCopied] = useState(false);

  const suggestedPhrase = useMemo(() => generateSuggestedPassphrase(), [generateSuggestedPassphrase]);

  const handleCopySuggestedPhrase = async () => {
    try {
      await navigator.clipboard.writeText(suggestedPhrase);
      setPhraseCopied(true);
      setTimeout(() => setPhraseCopied(false), 2000);
    } catch {
      setError('Не удалось скопировать. Выделите фразу и скопируйте вручную.');
    }
  };

  if (isCryptoReady) {
    const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    const to =
      fromPath && fromPath !== '/crypto/unlock' && fromPath !== '/auth'
        ? fromPath
        : '/';
    return <Navigate to={to} replace />;
  }

  const userId = user?._id;

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

  const handleCreateKeys = async () => {
    if (!passphrase.trim()) {
      setError('Введите секретную фразу');
      return;
    }

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

  const handleFileRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    await withAction(async () => {
      const content = await file.text();
      await importLocalKeysFileContent(userId, content);
      await ensureLocalKeys();
      setStatus('Доступ восстановлен из файла');
    });
  };

  const handleCreatePairing = async () => {
    if (!userId) {
      setError('Пользователь не авторизован');
      return;
    }

    await withAction(async () => {
      const request = await createPairingRequest(localDeviceKeys?.deviceId || `pending-${Date.now()}`);
      setPairingPayload(JSON.stringify(request.payload));
      setPairingPrivateJwk(request.privateJwk);
      setStatus('Код для подключения создан. Передайте его на устройство, где вы уже заходили в приложение.');
    });
  };

  const handleApprovePairing = async () => {
    if (!localDeviceKeys) {
      setError('На этом устройстве ещё нет доступа к сообщениям');
      return;
    }
    if (!pairingPayload.trim()) {
      setError('Вставьте код подключения');
      return;
    }

    await withAction(async () => {
      const parsed = JSON.parse(pairingPayload) as PairingRequestPayload;
      await approvePairingRequest(parsed, localDeviceKeys);
      setStatus('Подключение подтверждено. На новом устройстве нажмите «Завершить подключение».');
    });
  };

  const handleCompletePairing = async () => {
    if (!userId) {
      setError('Пользователь не авторизован');
      return;
    }
    if (!pairingPrivateJwk) {
      setError('Сначала создайте код подключения на этом устройстве');
      return;
    }
    if (!pairingPayload.trim()) {
      setError('Вставьте код подключения');
      return;
    }

    await withAction(async () => {
      const parsed = JSON.parse(pairingPayload) as PairingRequestPayload;
      await consumePairingRequest(userId, parsed, pairingPrivateJwk);
      await ensureLocalKeys();
      setStatus('Новое устройство подключено');
    });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={500} gutterBottom>
          Подключение этого устройства
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Сообщения и фото зашифрованы и доступны только вам. На этом устройстве нужно подключить ключ —
            выберите способ ниже.
          </Typography>
          <Tooltip
            title={
              <Typography variant="body2" sx={{ maxWidth: 280 }}>
                Данные шифруются на вашем устройстве. Мы не храним ключи и не можем прочитать ваши сообщения
                и фото — даже по запросу. Это защита вашей приватности. На каждом новом телефоне или браузере
                понадобится секретная фраза, которую вы создаёте при первом подключении.
              </Typography>
            }
            placement="top"
            arrow
            enterTouchDelay={0}
            leaveTouchDelay={4000}
          >
            <IconButton
              size="small"
              sx={{ color: 'text.secondary', p: 0.3, mt: -0.3, flexShrink: 0 }}
              aria-label="О шифровании и приватности"
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" sx={{ mb: 2 }}>
          <Tab label="Создать" />
          <Tab label="Ввести фразу" />
          <Tab label="Файл" />
          <Tab label="Другое устройство" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {status && <Alert severity="success" sx={{ mb: 2 }}>{status}</Alert>}

        {tab === 0 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Мы подготовили для вас секретную фразу. Запишите её в надёжное место — заметки, менеджер паролей
              или бумажный блокнот. Она понадобится, если вы зайдёте с другого телефона или браузера.
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {suggestedPhrase}
              </Typography>
            </Paper>
            <Button
              disabled={isLoading}
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopySuggestedPhrase}
              sx={{ mb: 2 }}
            >
              {phraseCopied ? 'Скопировано' : 'Скопировать фразу'}
            </Button>
            <TextField
              fullWidth
              label="Секретная фраза"
              helperText="Можно оставить предложенную или придумать свою — главное, не потерять её"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              sx={{ mb: 2 }}
            />
            <Button disabled={isLoading} variant="contained" onClick={handleCreateKeys}>
              Сохранить и продолжить
            </Button>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Если вы уже подключали другое устройство, введите ту же секретную фразу, которую сохраняли
              тогда.
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Секретная фраза"
              value={restorePhrase}
              onChange={(event) => setRestorePhrase(event.target.value)}
              sx={{ mb: 2 }}
            />
            <Button disabled={isLoading} variant="contained" onClick={handleRestore}>
              Подключить устройство
            </Button>
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Если вы раньше сохраняли файл с настройками доступа на другом устройстве, выберите его здесь.
            </Typography>
            <Button disabled={isLoading} component="label" variant="outlined">
              Выбрать файл
              <input hidden type="file" accept=".json,.txt,.backup" onChange={handleFileRestore} />
            </Button>
          </Box>
        )}

        {tab === 3 && (
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
        )}
      </Paper>
    </Container>
  );
};

export default CryptoUnlockPage;
