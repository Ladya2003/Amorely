import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AdminHealthInfo, fetchAdminHealth } from '../../services/adminService';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} Б`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} КБ`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ГБ`;
};

const HealthCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="subtitle1" gutterBottom>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const AdminHealth: React.FC = () => {
  const [health, setHealth] = useState<AdminHealthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchAdminHealth();
        setHealth(data);
      } catch {
        setError('Не удалось загрузить состояние системы');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !health) {
    return <Alert severity="error">{error ?? 'Нет данных'}</Alert>;
  }

  const mongoOk = health.mongodb.readyState === 1;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <HealthCard title="MongoDB">
          <Chip
            label={health.mongodb.status}
            color={mongoOk ? 'success' : 'error'}
            size="small"
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            Состояние подключения к базе данных
          </Typography>
        </HealthCard>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <HealthCard title="Планировщик ленты">
          <Typography variant="body2">{health.feedScheduler.description}</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Расписание: {health.feedScheduler.schedule}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Часовой пояс: {health.feedScheduler.timezone}
          </Typography>
        </HealthCard>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <HealthCard title="Хранилище контента">
          <Typography variant="h6">{formatBytes(health.storage.totalBytes)}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Всего записей: {health.storage.totalContentCount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Зашифрованных: {health.storage.encryptedContentCount}
          </Typography>
        </HealthCard>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <HealthCard title="Уведомления и безопасность">
          <Typography variant="body2">Push-подписок: {health.pushSubscriptions}</Typography>
          <Typography variant="body2">Crypto-устройств: {health.cryptoDevices}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Черновиков новостей: {health.draftNewsCount}
          </Typography>
        </HealthCard>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <HealthCard title="Игровые сессии">
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2">Тыкалка: {health.games.tap}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2">Гео: {health.games.geo}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2">Рисовалка: {health.games.draw}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2">Квиз: {health.games.quiz}</Typography>
            </Grid>
          </Grid>
        </HealthCard>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Typography variant="caption" color="text.secondary">
          Время сервера: {format(new Date(health.serverTime), 'dd MMM yyyy, HH:mm:ss', { locale: ru })}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default AdminHealth;
