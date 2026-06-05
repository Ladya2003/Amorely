import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
import AdminDashboard from '../components/Admin/AdminDashboard';
import AdminUsers from '../components/Admin/AdminUsers';
import AdminNews from '../components/Admin/AdminNews';
import AdminHealth from '../components/Admin/AdminHealth';
import AdminModeration from '../components/Admin/AdminModeration';

const ADMIN_TABS = [
  { key: 'dashboard', label: 'Дашборд' },
  { key: 'users', label: 'Пользователи' },
  { key: 'news', label: 'Новости' },
  { key: 'health', label: 'Система' },
  { key: 'moderation', label: 'Модерация' },
] as const;

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { setShowBottomNav } = useNavigation();
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    setShowBottomNav(false);
    return () => setShowBottomNav(true);
  }, [setShowBottomNav]);

  const renderTab = () => {
    switch (ADMIN_TABS[tabIndex].key) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <AdminUsers />;
      case 'news':
        return <AdminNews />;
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
          {ADMIN_TABS.map((tab) => (
            <Tab key={tab.key} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {renderTab()}
    </Container>
  );
};

export default AdminPage;
