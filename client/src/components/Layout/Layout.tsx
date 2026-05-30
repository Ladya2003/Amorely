import React, { useState, useEffect } from 'react';
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
  MenuItem,
  Badge
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import SettingsIcon from '@mui/icons-material/Settings';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';
import { useUnreadNews } from '../../contexts/UnreadNewsContext';
import { MOBILE_BOTTOM_NAV_OFFSET } from '../../constants/layout';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { showBottomNav, setShowBottomNav } = useNavigation();
  const { totalUnreadCount } = useUnreadMessages();
  const { unreadCount: unreadNewsCount } = useUnreadNews();

  const isGameRoute = location.pathname.startsWith('/chat/games/');

  useEffect(() => {
    if (!isMobile || !isGameRoute) {
      return;
    }

    setShowBottomNav(false);

    return () => {
      setShowBottomNav(true);
    };
  }, [isGameRoute, isMobile, setShowBottomNav]);
  
  const chatTabIcon = (
    <Badge
      badgeContent={totalUnreadCount}
      color="error"
      max={99}
      invisible={totalUnreadCount === 0}
    >
      <ChatIcon />
    </Badge>
  );

  const newsTabIcon = (
    <Badge
      badgeContent={unreadNewsCount}
      color="error"
      max={99}
      invisible={unreadNewsCount === 0}
    >
      <NewspaperIcon />
    </Badge>
  );
  
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
  const getCurrentTab = (): number | false => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path === '/chat' || path.startsWith('/chat/games')) return 1;
    if (path === '/calendar') return 2;
    if (path === '/news') return 3;
    if (path === '/settings') return 4;
    if (path.startsWith('/legal/')) return false;
    return 0;
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
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
                      navigate('/calendar');
                      break;
                    case 3:
                      navigate('/news');
                      break;
                    case 4:
                      navigate('/settings');
                      break;
                  }
                }}
                sx={{ bgcolor: 'transparent' }}
              >
                <BottomNavigationAction label="Главная" icon={<HomeIcon />} />
                <BottomNavigationAction label="Чат" icon={chatTabIcon} />
                <BottomNavigationAction label="Календарь" icon={<CalendarMonthIcon />} />
                <BottomNavigationAction label="Новости" icon={newsTabIcon} />
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
      <Box sx={{ 
        flexGrow: 1,
        minHeight: 0,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        p: isMobile ? 0 : 2,
        pb: isMobile && showBottomNav
          ? MOBILE_BOTTOM_NAV_OFFSET
          : isMobile ? '0px' : 2 // Отступ снизу для нижней навигации на мобильных
      }}>
        <Outlet />
      </Box>
      
      {/* Нижняя панель навигации для мобильных устройств */}
      {isMobile && showBottomNav && (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
          <Box
            sx={{
              pt: 1.5,
              pb: 'max(16px, env(safe-area-inset-bottom, 0px))',
              bgcolor: 'background.paper',
            }}
          >
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
                  navigate('/calendar');
                  break;
                case 3:
                  navigate('/news');
                  break;
                case 4:
                  navigate('/settings');
                  break;
              }
            }}
            sx={{
              bgcolor: 'transparent',
              height: 56,
              '& .MuiBottomNavigationAction-root': {
                minWidth: 0,
                flex: 1,
                px: 1
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '12px',
                '&.Mui-selected': {
                  fontSize: '12px'
                }
              },
              '@media (max-width:360px)': {
                '& .MuiBottomNavigationAction-root': {
                  px: 0.5
                },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '12px',
                  '&.Mui-selected': {
                    fontSize: '12px'
                  }
                }
              }
            }}
          >
            <BottomNavigationAction
              label="Главная"
              icon={<HomeIcon />}
              sx={{ px: 1 }}
            />
            <BottomNavigationAction label="Чат" icon={chatTabIcon} sx={{ px: 1 }} />
            <BottomNavigationAction label="Календарь" icon={<CalendarMonthIcon />} sx={{ px: 1 }} />
            <BottomNavigationAction label="Новости" icon={newsTabIcon} sx={{ px: 1 }} />
            <BottomNavigationAction label="Настройки" icon={<SettingsIcon />} sx={{ px: 1 }} />
          </BottomNavigation>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Layout; 