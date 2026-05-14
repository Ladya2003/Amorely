import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCrypto } from '../../contexts/CryptoContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  bypassCryptoCheck?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, bypassCryptoCheck = false }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { isCryptoReady, isChecking, isCryptoBootstrapComplete } = useCrypto();
  
  if (isLoading || isChecking || !isCryptoBootstrapComplete) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!bypassCryptoCheck && !isCryptoReady) {
    return <Navigate to="/crypto/unlock" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute; 