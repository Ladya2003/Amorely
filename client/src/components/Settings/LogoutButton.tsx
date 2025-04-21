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

const LogoutButton: React.FC = () => {
  const { logout } = useAuth();
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
            Вы уверены, что хотите выйти из аккаунта?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleLogout} color="error">
            Выйти
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LogoutButton; 