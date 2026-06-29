import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Button, 
  Typography, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  useTheme,
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../contexts/AuthContext';
import { useCrypto } from '../../contexts/CryptoContext';
import { getSettingsLogoutButtonSx } from './settingsPageStyles';

interface LogoutButtonProps {
  size?: 'small' | 'medium' | 'large';
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ size = 'medium' }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { logout } = useAuth();
  const { clearLocalKeys } = useCrypto();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  const handleLogout = () => {
    logout();
    setDialogOpen(false);
  };

  const handleLogoutAndRemoveKeys = async () => {
    await clearLocalKeys();
    logout();
    setDialogOpen(false);
  };
  
  return (
    <>
      <Button
        variant="outlined"
        color="error"
        size={size}
        startIcon={<LogoutIcon />}
        onClick={handleOpenDialog}
        sx={getSettingsLogoutButtonSx(theme)}
      >
        {t('settings.logout.button')}
      </Button>
      
      <ResponsiveDialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: '16px',
          }}
        >
          {t('settings.logout.confirmTitle')}
          <IconButton onClick={handleCloseDialog} aria-label={t('settings.logout.closeAria')} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: '16px' }}>
          <Typography variant="body1">
            {t('settings.logout.confirmBody')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            onClick={handleLogoutAndRemoveKeys}
            color="warning"
            sx={{ justifyContent: 'flex-start', textAlign: 'left', mr: 2 }}
          >
            {t('settings.logout.logoutAndRemoveKeys')}
          </Button>
          <Button onClick={handleLogout} color="error" sx={{ flexShrink: 0 }}>
            {t('settings.logout.button')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </>
  );
};

export default LogoutButton;
