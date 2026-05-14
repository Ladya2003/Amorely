import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Tab,
  Tabs,
  TextField,
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

  const suggestedPhrase = useMemo(() => generateSuggestedPassphrase(), [generateSuggestedPassphrase]);

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
      setError('Введите recovery-фразу');
      return;
    }

    await withAction(async () => {
      await createAndBackupKeys(passphrase.trim());
      setStatus('Ключи успешно созданы и backup сохранен');
    });
  };

  const handleRestore = async () => {
    if (!restorePhrase.trim()) {
      setError('Введите recovery-фразу для восстановления');
      return;
    }

    await withAction(async () => {
      await restoreKeysFromPassphrase(restorePhrase.trim());
      setStatus('Ключи успешно восстановлены');
    });
  };

  const handleFileRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    await withAction(async () => {
      const content = await file.text();
      await importLocalKeysFileContent(userId, content);
      await ensureLocalKeys();
      setStatus('Ключи импортированы из файла');
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
      setStatus('Pairing payload создан. Передайте его на устройство с доступом к ключам.');
    });
  };

  const handleApprovePairing = async () => {
    if (!localDeviceKeys) {
      setError('Нет локальных ключей для подтверждения');
      return;
    }
    if (!pairingPayload.trim()) {
      setError('Вставьте pairing payload');
      return;
    }

    await withAction(async () => {
      const parsed = JSON.parse(pairingPayload) as PairingRequestPayload;
      await approvePairingRequest(parsed, localDeviceKeys);
      setStatus('Pairing подтвержден. На новом устройстве завершите подключение.');
    });
  };

  const handleCompletePairing = async () => {
    if (!userId) {
      setError('Пользователь не авторизован');
      return;
    }
    if (!pairingPrivateJwk) {
      setError('Сначала создайте pairing payload на этом устройстве');
      return;
    }
    if (!pairingPayload.trim()) {
      setError('Вставьте pairing payload');
      return;
    }

    await withAction(async () => {
      const parsed = JSON.parse(pairingPayload) as PairingRequestPayload;
      await consumePairingRequest(userId, parsed, pairingPrivateJwk);
      await ensureLocalKeys();
      setStatus('Ключи успешно получены через pairing');
    });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Восстановление шифрования
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Вы вошли в аккаунт, но на этом устройстве не найдены ключи E2EE. Восстановите их одним из способов.
        </Typography>

        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" sx={{ mb: 2 }}>
          <Tab label="Создать" />
          <Tab label="Ввести фразу" />
          <Tab label="Файл" />
          <Tab label="QR/Pairing" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {status && <Alert severity="success" sx={{ mb: 2 }}>{status}</Alert>}

        {tab === 0 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Сгенерированная recovery-фраза (сохраните ее в менеджер паролей):
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {suggestedPhrase}
              </Typography>
            </Paper>
            <TextField
              fullWidth
              label="Подтвердите/измените recovery-фразу"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              sx={{ mb: 2 }}
            />
            <Button disabled={isLoading} variant="contained" onClick={handleCreateKeys}>
              Создать ключи и backup
            </Button>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Recovery-фраза"
              value={restorePhrase}
              onChange={(event) => setRestorePhrase(event.target.value)}
              sx={{ mb: 2 }}
            />
            <Button disabled={isLoading} variant="contained" onClick={handleRestore}>
              Восстановить ключи
            </Button>
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Выберите файл экспортированных ключей.
            </Typography>
            <Button disabled={isLoading} component="label" variant="outlined">
              Выбрать файл
              <input hidden type="file" accept=".json,.txt,.backup" onChange={handleFileRestore} />
            </Button>
          </Box>
        )}

        {tab === 3 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Временный flow pairing: передайте JSON между устройствами (QR можно добавить поверх этого payload).
            </Typography>
            <Button sx={{ mb: 2, mr: 1 }} variant="outlined" onClick={handleCreatePairing} disabled={isLoading}>
              Создать pairing payload
            </Button>
            <Button sx={{ mb: 2, mr: 1 }} variant="contained" onClick={handleApprovePairing} disabled={isLoading}>
              Подтвердить pairing
            </Button>
            <Button sx={{ mb: 2 }} variant="outlined" onClick={handleCompletePairing} disabled={isLoading}>
              Завершить pairing
            </Button>
            <TextField
              fullWidth
              multiline
              minRows={5}
              label="Pairing payload"
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
