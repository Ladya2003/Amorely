import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper, 
  useMediaQuery, 
  useTheme,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import SettingsIcon from '@mui/icons-material/Settings';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useAuth } from '../../contexts/AuthContext';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNavigate = (path: string) => {
    navigate(path);
    handleMenuClose();
  };
  
  // Определяем текущую вкладку на основе пути
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path === '/chat') return 1;
    if (path === '/news') return 2;
    if (path === '/settings') return 3;
    return 0;
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Верхняя панель навигации для десктопа */}
      {!isMobile && (
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FavoriteIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Amorely
              </Typography>
            </Box>
            
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <BottomNavigation
                showLabels
                value={getCurrentTab()}
                onChange={(event, newValue) => {
                  switch (newValue) {
                    case 0:
                      navigate('/');
                      break;
                    case 1:
                      navigate('/chat');
                      break;
                    case 2:
                      navigate('/news');
                      break;
                    case 3:
                      navigate('/settings');
                      break;
                  }
                }}
                sx={{ bgcolor: 'transparent' }}
              >
                <BottomNavigationAction label="Главная" icon={<HomeIcon />} />
                <BottomNavigationAction label="Чат" icon={<ChatIcon />} />
                <BottomNavigationAction label="Новости" icon={<NewspaperIcon />} />
                <BottomNavigationAction label="Настройки" icon={<SettingsIcon />} />
              </BottomNavigation>
            </Box>
            
            <IconButton onClick={handleMenuOpen}>
              <Avatar 
                src={user?.avatar} 
                alt={user?.username}
                sx={{ width: 32, height: 32 }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => handleNavigate('/settings')}>
                <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                Настройки
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
      )}
      
      {/* Основное содержимое */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: isMobile ? 0 : 2 }}>
        <Outlet />
      </Box>
      
      {/* Нижняя панель навигации для мобильных устройств */}
      {isMobile && (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
          <BottomNavigation
            showLabels
            value={getCurrentTab()}
            onChange={(event, newValue) => {
              switch (newValue) {
                case 0:
                  navigate('/');
                  break;
                case 1:
                  navigate('/chat');
                  break;
                case 2:
                  navigate('/news');
                  break;
                case 3:
                  navigate('/settings');
                  break;
              }
            }}
          >
            <BottomNavigationAction label="Главная" icon={<HomeIcon />} />
            <BottomNavigationAction label="Чат" icon={<ChatIcon />} />
            <BottomNavigationAction label="Новости" icon={<NewspaperIcon />} />
            <BottomNavigationAction label="Настройки" icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};

export default Layout; 