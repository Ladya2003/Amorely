import React, { useState } from 'react';
import { 
  Button, 
  Typography, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../contexts/AuthContext';
import { useCrypto } from '../../contexts/CryptoContext';
import { settingsActionButtonSx } from './settingsButtonSx';

interface LogoutButtonProps {
  size?: 'small' | 'medium' | 'large';
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ size = 'medium' }) => {
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
        sx={settingsActionButtonSx}
      >
        Выйти
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
          Подтверждение выхода
          <IconButton onClick={handleCloseDialog} aria-label="Закрыть" size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: '16px' }}>
          <Typography variant="body1">
            Вы можете просто выйти из аккаунта (ключевая фраза сохранится на устройстве) или выйти и удалить вашу фразу.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            onClick={handleLogoutAndRemoveKeys}
            color="warning"
            sx={{ justifyContent: 'flex-start', textAlign: 'left', mr: 2 }}
          >
            Выйти и удалить ключевую фразу
          </Button>
          <Button onClick={handleLogout} color="error" sx={{ flexShrink: 0 }}>
            Выйти
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </>
  );
};

export default LogoutButton; 