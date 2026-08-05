import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCrypto } from '../../contexts/CryptoContext';
import { Box, CircularProgress } from '@mui/material';
import AuthPage from '../../pages/AuthPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  bypassCryptoCheck?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, bypassCryptoCheck = false }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { isCryptoReady, isCryptoBootstrapComplete } = useCrypto();

  // Do not gate on crypto `isChecking`: ensureLocalKeys() toggles it during saves
  // (calendar / dating ideas) and would unmount the whole protected tree mid-action.
  // Initial key bootstrap is already covered by `isCryptoBootstrapComplete`.
  if (isLoading || !isCryptoBootstrapComplete) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Landing must stay on `/` so GitHub Pages serves index.html (200) for Ctrl+U / SEO.
    // `/auth` used to 404 at the CDN layer because it is not a real static file.
    if (location.pathname !== '/') {
      return <Navigate to="/" replace />;
    }
    return <AuthPage />;
  }

  if (!bypassCryptoCheck && !isCryptoReady) {
    return <Navigate to="/crypto/unlock" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
