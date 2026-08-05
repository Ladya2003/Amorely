import React, { useState, useEffect, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import {

  Box, 

  useMediaQuery, 

  useTheme,

  AppBar,

  Container,

  Typography,

  IconButton,

  Avatar,

  Menu,

  MenuItem,

  Badge

} from '@mui/material';

import FavoriteIcon from '@mui/icons-material/Favorite';

import {
  AppCalendarFilledIcon,
  AppChatFilledIcon,
  AppHomeFilledIcon,
  AppNewsFilledIcon,
  AppSettingsFilledIcon,
} from '../UI/AppIcons';

import { useAuth } from '../../contexts/AuthContext';

import { useNavigation } from '../../contexts/NavigationContext';

import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';

import { useUnreadNews } from '../../contexts/UnreadNewsContext';

import { usePendingPartnerRequests } from '../../contexts/PendingPartnerRequestsContext';

import { useTabSlideDirection } from '../../hooks/useTabSlideDirection';

import AnimatedBottomNav from './AnimatedBottomNav';
import BottomNavTab from './BottomNavTab';

import {

  BOTTOM_NAV_TAB_COUNT,

  getMobileBottomNavOuterSx,

  getMobileBottomNavShellSx,

  getMobileBottomNavSx,

  getTabPageEnterSx,

} from './bottomNavStyles';

import { getDesktopLayoutTopGlowSx } from '../Feed/feedBannerStyles';



const NAV_TAB_ROUTES = ['/', '/chat', '/calendar', '/news', '/settings'] as const;



const Layout: React.FC = () => {

  const { t } = useTranslation();

  const location = useLocation();

  const navigate = useNavigate();

  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { user } = useAuth();

  const { showBottomNav, setShowBottomNav } = useNavigation();

  const { totalUnreadCount } = useUnreadMessages();

  const { unreadCount: unreadNewsCount } = useUnreadNews();

  const { pendingIncomingCount: pendingPartnerRequestsCount } = usePendingPartnerRequests();



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

  

  const newsTabIcon = (

    <Badge

      badgeContent={unreadNewsCount}

      color="error"

      max={99}

      invisible={unreadNewsCount === 0}

    >

      <AppNewsFilledIcon />

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

  

  const getCurrentTab = (): number | false => {

    const path = location.pathname;

    if (path === '/') return 0;

    if (path === '/chat' || path.startsWith('/chat/games')) return 1;

    if (path === '/calendar') return 2;

    if (path === '/news') return 3;

    if (path === '/settings') return 4;

    // Sub-pages outside bottom-nav tabs: keep a stable unique key via pathname.
    if (path.startsWith('/dating-ideas')) return false;

    if (path.startsWith('/pets')) return false;

    if (path.startsWith('/legal/')) return false;

    if (path.startsWith('/admin')) return false;

    return 0;

  };



  const currentTab = getCurrentTab();
  const isMainTabPage = typeof currentTab === 'number';

  const chatTabIcon = (

    <Badge

      badgeContent={totalUnreadCount}

      color="error"

      max={99}

      invisible={totalUnreadCount === 0}

    >

      <AppChatFilledIcon />

    </Badge>

  );

  const settingsTabIcon = (

    <Badge

      badgeContent={pendingPartnerRequestsCount}

      color="error"

      max={99}

      invisible={pendingPartnerRequestsCount === 0}

    >

      <AppSettingsFilledIcon />

    </Badge>

  );

  const tabSlideDirection = useTabSlideDirection(currentTab);

  const tabContentKey =

    typeof currentTab === 'number' ? `tab-${currentTab}` : location.pathname;



  const handleTabChange = useCallback(

    (_event: React.SyntheticEvent, newValue: number) => {

      const path = NAV_TAB_ROUTES[newValue];

      if (path) {

        navigate(path);

      }

    },

    [navigate]

  );



  const bottomNavActions = [
    <BottomNavTab key="home" value={0} label={t('nav.home')} icon={<AppHomeFilledIcon />} />,
    <BottomNavTab key="chat" value={1} label={t('nav.chat')} icon={chatTabIcon} />,
    <BottomNavTab key="calendar" value={2} label={t('nav.calendar')} icon={<AppCalendarFilledIcon />} />,
    <BottomNavTab key="news" value={3} label={t('nav.news')} icon={newsTabIcon} />,
    <BottomNavTab key="settings" value={4} label={t('nav.settings')} icon={settingsTabIcon} />,
  ];

  

  return (

    <Box
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          overflow: 'hidden',
        },
        !isMobile && ((muiTheme) => getDesktopLayoutTopGlowSx(muiTheme)),
      ]}
    >

      {!isMobile && (

        <AppBar
          position="relative"
          color="transparent"
          elevation={0}
          sx={{
            zIndex: 1,
            bgcolor: 'transparent',
            backgroundImage: 'none',
          }}
        >

          <Box sx={{ px: 2, pt: 1, pb: 0 }}>

            <Box
              sx={(muiTheme) => ({
                ...getMobileBottomNavShellSx(muiTheme),
                width: '100%',
                px: 0,
              })}
            >

              <Container
                maxWidth="md"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >

                <Box
                  onClick={() => handleNavigate('/')}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleNavigate('/');
                    }
                  }}
                  aria-label="Amorely"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    borderRadius: 1,
                    userSelect: 'none',
                    '&:hover': { opacity: 0.85 },
                    '& .MuiSvgIcon-root, & .MuiTypography-root': {
                      cursor: 'pointer',
                    },
                  }}
                >

                  <FavoriteIcon sx={{ color: 'primary.main', mr: 1 }} />

                  <Typography variant="h6" component="div">

                    Amorely

                  </Typography>

                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>

                  <AnimatedBottomNav

                    value={currentTab}

                    onChange={handleTabChange}

                    tabCount={BOTTOM_NAV_TAB_COUNT}

                    sx={getMobileBottomNavSx(theme)}

                  >

                    {bottomNavActions}

                  </AnimatedBottomNav>

                </Box>

                <IconButton onClick={handleMenuOpen} sx={{ flexShrink: 0, p: 0.5 }}>

                  <Avatar 

                    src={user?.avatar} 

                    alt={user?.username}

                    sx={{ width: 32, height: 32 }}

                  >

                    {user?.username?.charAt(0).toUpperCase()}

                  </Avatar>

                </IconButton>

              </Container>

            </Box>

          </Box>

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

              <AppSettingsFilledIcon fontSize="small" sx={{ mr: 1 }} />

              {t('nav.settings')}

            </MenuItem>

          </Menu>

        </AppBar>

      )}

      

      <Box sx={{ 

        position: 'relative',

        zIndex: 1,

        flexGrow: 1,

        minHeight: 0,

        overflowX: 'hidden',

        overflowY: 'auto',

        display: 'flex',

        flexDirection: 'column',

        p: isMobile ? 0 : 2,

        pb: isMobile ? 0 : 2

      }}>

        <Box
          key={tabContentKey}
          sx={{
            ...getTabPageEnterSx(tabSlideDirection),
            ...(!isMainTabPage && {
              flex: '0 0 auto',
              minHeight: 'auto',
              width: '100%',
            }),
          }}
        >

          <Outlet />

        </Box>

      </Box>

      

      {isMobile && showBottomNav && (

        <Box sx={getMobileBottomNavOuterSx()}>

          <Box sx={(theme) => getMobileBottomNavShellSx(theme)}>

            <AnimatedBottomNav

              value={currentTab}

              onChange={handleTabChange}

              tabCount={BOTTOM_NAV_TAB_COUNT}

              sx={getMobileBottomNavSx(theme)}

            >

              {bottomNavActions}

            </AnimatedBottomNav>

          </Box>

        </Box>

      )}

    </Box>

  );

};



export default Layout;

