import React, { useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  AdminDashboardStats,
  DashboardDetailItem,
  DashboardMetricKey,
  fetchAdminDashboard,
  fetchAdminDashboardDetails,
} from '../../services/adminService';

type MetricConfig = {
  key: DashboardMetricKey;
  label: string;
  getValue: (stats: AdminDashboardStats) => number;
  countLabel?: string;
};

const METRICS: MetricConfig[] = [
  { key: 'totalUsers', label: 'Всего пользователей', getValue: (s) => s.totalUsers },
  { key: 'newUsersToday', label: 'Регистрации сегодня', getValue: (s) => s.newUsersToday },
  { key: 'newUsers7d', label: 'За 7 дней', getValue: (s) => s.newUsers7d },
  { key: 'newUsers30d', label: 'За 30 дней', getValue: (s) => s.newUsers30d },
  { key: 'activePairs', label: 'Активные пары', getValue: (s) => s.activePairs },
  { key: 'brokenUpPairs', label: 'Расставшиеся пары', getValue: (s) => s.brokenUpPairs },
  { key: 'usersWithoutPartner', label: 'Без партнёра', getValue: (s) => s.usersWithoutPartner },
  { key: 'activeLast24h', label: 'Активны за 24ч', getValue: (s) => s.activeLast24h },
  {
    key: 'totalCalendarEvents',
    label: 'События календаря',
    getValue: (s) => s.totalCalendarEvents,
    countLabel: 'событий',
  },
  {
    key: 'totalFeedMedia',
    label: 'Медиа в ленте',
    getValue: (s) => s.totalFeedMedia,
    countLabel: 'медиа',
  },
  {
    key: 'totalMessages',
    label: 'Сообщений',
    getValue: (s) => s.totalMessages,
    countLabel: 'сообщений',
  },
  {
    key: 'totalNewsPublished',
    label: 'Опубликованных новостей',
    getValue: (s) => s.totalNewsPublished,
  },
];

const formatExtra = (extra?: string) => {
  if (!extra) {
    return undefined;
  }

  const isoMatch = extra.match(/\d{4}-\d{2}-\d{2}T/);
  if (isoMatch) {
    const datePart = extra.replace(/^[^:]+:\s*/, '').trim();
    const parsed = new Date(datePart);
    if (!Number.isNaN(parsed.getTime())) {
      const prefix = extra.includes('Регистрация')
        ? 'Регистрация: '
        : extra.includes('Был')
          ? 'Был(а): '
          : '';
      return `${prefix}${format(parsed, 'dd MMM yyyy, HH:mm', { locale: ru })}`;
    }
  }

  return extra;
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<DashboardMetricKey | false>(false);
  const [detailsCache, setDetailsCache] = useState<Partial<Record<DashboardMetricKey, DashboardDetailItem[]>>>({});
  const [loadingDetails, setLoadingDetails] = useState<DashboardMetricKey | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchAdminDashboard();
        setStats(data);
      } catch {
        setError('Не удалось загрузить статистику');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const loadDetails = useCallback(
    async (metricKey: DashboardMetricKey) => {
      if (detailsCache[metricKey]) {
        return;
      }

      try {
        setLoadingDetails(metricKey);
        setDetailsError(null);
        const data = await fetchAdminDashboardDetails(metricKey);
        setDetailsCache((prev) => ({ ...prev, [metricKey]: data.items }));
      } catch {
        setDetailsError('Не удалось загрузить подробности');
      } finally {
        setLoadingDetails(null);
      }
    },
    [detailsCache]
  );

  const handleAccordionChange = (metricKey: DashboardMetricKey) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedKey(isExpanded ? metricKey : false);
    if (isExpanded) {
      void loadDetails(metricKey);
    }
  };

  const renderDetailItem = (item: DashboardDetailItem, countLabel?: string) => {
    const secondaryParts = [item.subtitle, formatExtra(item.extra)].filter(Boolean);
    const countText =
      item.count !== undefined && countLabel ? `${item.count} ${countLabel}` : undefined;

    return (
      <ListItem key={item.id} alignItems="flex-start" sx={{ px: 0 }}>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" fontWeight={500}>
                {item.title}
              </Typography>
              {countText && <Chip size="small" label={countText} />}
            </Box>
          }
          secondary={secondaryParts.join(' · ')}
          secondaryTypographyProps={{ variant: 'caption', sx: { display: 'block', mt: 0.25 } }}
        />
      </ListItem>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stats) {
    return <Alert severity="error">{error ?? 'Нет данных'}</Alert>;
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {METRICS.map((metric) => {
          const isExpanded = expandedKey === metric.key;
          const items = detailsCache[metric.key];
          const isDetailsLoading = loadingDetails === metric.key;

          return (
            <Grid key={metric.key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Accordion
                expanded={isExpanded}
                onChange={handleAccordionChange(metric.key)}
                disableGutters
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    minHeight: 88,
                    '& .MuiAccordionSummary-content': {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      my: 1,
                    },
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {metric.label}
                  </Typography>
                  <Typography variant="h5" component="div">
                    {metric.getValue(stats)}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, maxHeight: 280, overflow: 'auto' }}>
                  {isDetailsLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  )}
                  {!isDetailsLoading && detailsError && isExpanded && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                      {detailsError}
                    </Alert>
                  )}
                  {!isDetailsLoading && items && items.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Нет данных
                    </Typography>
                  )}
                  {!isDetailsLoading && items && items.length > 0 && (
                    <List dense disablePadding>
                      {items.map((item) => renderDetailItem(item, metric.countLabel))}
                    </List>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>
          );
        })}
      </Grid>

      {stats.topPairs.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Топ пар по событиям календаря
          </Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <List dense>
              {stats.topPairs.map((pair, index) => (
                <ListItem key={`${pair.userId}-${pair.partnerId}`} divider={index < stats.topPairs.length - 1}>
                  <ListItemText
                    primary={`${index + 1}. ${pair.username} + ${pair.partnerUsername}`}
                    secondary={`${pair.calendarEvents} событий`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AdminDashboard;
