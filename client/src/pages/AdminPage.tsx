import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Container,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigation } from '../contexts/NavigationContext';
import { useAdminAlerts } from '../contexts/AdminAlertsContext';
import AdminDashboard from '../components/Admin/AdminDashboard';
import AdminUsers from '../components/Admin/AdminUsers';
import AdminNews from '../components/Admin/AdminNews';
import AdminAnnouncements from '../components/Admin/AdminAnnouncements';
import AdminHealth from '../components/Admin/AdminHealth';
import AdminModeration from '../components/Admin/AdminModeration';

const USERS_TAB_INDEX = 1;
const MODERATION_TAB_INDEX = 5;

const ADMIN_TABS = [
  { key: 'dashboard', label: 'Дашборд' },
  { key: 'users', label: 'Пользователи' },
  { key: 'news', label: 'Новости' },
  { key: 'announcements', label: 'Уведомления' },
  { key: 'health', label: 'Система' },
  { key: 'moderation', label: 'Модерация' },
] as const;

const renderTabBadge = (label: string, count: number) => (
  <Badge
    badgeContent={count}
    color="error"
    invisible={count <= 0}
    max={99}
    sx={{
      '& .MuiBadge-badge': {
        right: -10,
        top: 2,
      },
    }}
  >
    <Box component="span" sx={{ pr: count > 0 ? 1.5 : 0 }}>
      {label}
    </Box>
  </Badge>
);

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { setShowBottomNav } = useNavigation();
  const {
    newUsersCount,
    newReportsCount,
    clearFeedDot,
    clearUsersTabBadge,
    clearModerationTabBadge,
  } = useAdminAlerts();
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    setShowBottomNav(false);
    return () => setShowBottomNav(true);
  }, [setShowBottomNav]);

  useEffect(() => {
    void clearFeedDot();
  }, [clearFeedDot]);

  useEffect(() => {
    if (tabIndex === USERS_TAB_INDEX) {
      void clearUsersTabBadge();
    }
  }, [tabIndex, clearUsersTabBadge]);

  useEffect(() => {
    if (tabIndex === MODERATION_TAB_INDEX) {
      void clearModerationTabBadge();
    }
  }, [tabIndex, clearModerationTabBadge]);

  const renderTab = () => {
    switch (ADMIN_TABS[tabIndex].key) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <AdminUsers />;
      case 'news':
        return <AdminNews />;
      case 'announcements':
        return <AdminAnnouncements />;
      case 'health':
        return <AdminHealth />;
      case 'moderation':
        return <AdminModeration />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/')} aria-label="Назад">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Админ-панель
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, value) => setTabIndex(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {ADMIN_TABS.map((tab, index) => (
            <Tab
              key={tab.key}
              label={
                index === USERS_TAB_INDEX
                  ? renderTabBadge(tab.label, newUsersCount)
                  : index === MODERATION_TAB_INDEX
                    ? renderTabBadge(tab.label, newReportsCount)
                    : tab.label
              }
            />
          ))}
        </Tabs>
      </Paper>

      {renderTab()}
    </Container>
  );
};

export default AdminPage;
