import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCrypto } from '../../contexts/CryptoContext';
import BrandLoader from '../common/BrandLoader';
import {
  getLandingPath,
  resolvePreferredLandingLocale,
} from '../../localization/landingLocale';

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
  if (isLoading) {
    return <BrandLoader fullscreen />;
  }

  if (!isAuthenticated) {
    // Guests land on localized marketing pages (`/ru`, `/es`, …), not the app shell.
    const landingPath = getLandingPath(resolvePreferredLandingLocale());
    return <Navigate to={landingPath} replace state={{ from: location }} />;
  }

  if (!bypassCryptoCheck && isCryptoBootstrapComplete && !isCryptoReady) {
    return <Navigate to="/crypto/unlock" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
