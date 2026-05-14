import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions 
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../contexts/AuthContext';
import { useCrypto } from '../../contexts/CryptoContext';

const LogoutButton: React.FC = () => {
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
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleOpenDialog}
        >
          Выйти из аккаунта
        </Button>
      </Box>
      
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Подтверждение выхода</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Вы можете просто выйти из аккаунта (ключи останутся на устройстве) или выйти и удалить ключи E2EE.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleLogoutAndRemoveKeys} color="warning">
            Выйти и удалить ключи
          </Button>
          <Button onClick={handleLogout} color="error">
            Выйти
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LogoutButton; 