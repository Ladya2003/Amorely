import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { setAppLocale } from '../../localization';
import {
  getLandingPath,
  isLandingLocaleSegment,
  resolvePreferredLandingLocale,
} from '../../localization/landingLocale';
import AuthPage from '../../pages/AuthPage';

/**
 * Public localized landing at `/{lang}` (registered per supported locale in App).
 * Guests see AuthPage; signed-in users go to the app root.
 */
const LandingRoute: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const segment = (location.pathname.split('/').filter(Boolean)[0] ?? '').toLowerCase();
  const locale = isLandingLocaleSegment(segment) ? segment : null;

  useEffect(() => {
    if (locale) {
      setAppLocale(locale);
    }
  }, [locale]);

  if (!locale) {
    return <Navigate to={getLandingPath(resolvePreferredLandingLocale())} replace />;
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <AuthPage />;
};

export default LandingRoute;
