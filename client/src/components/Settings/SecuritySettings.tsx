import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  TextField, 
  Button, 
  Alert,
  Grid
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

interface SecuritySettingsProps {
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onChangePassword, isLoading }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Валидация
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Новый пароль и подтверждение не совпадают');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Новый пароль должен содержать не менее 8 символов');
      return;
    }
    
    try {
      await onChangePassword(oldPassword, newPassword);
      setSuccess('Пароль успешно изменен');
      
      // Очищаем поля
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Ошибка при изменении пароля:', error);
      setError('Не удалось изменить пароль. Проверьте правильность текущего пароля.');
    }
  };
  
  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Безопасность
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              type="password"
              label="Текущий пароль"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              variant="outlined"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              type="password"
              label="Новый пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              variant="outlined"
              helperText="Минимум 8 символов"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              type="password"
              label="Подтверждение нового пароля"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              variant="outlined"
            />
          </Grid>
          <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<LockIcon />}
              disabled={isLoading}
            >
              {isLoading ? 'Изменение...' : 'Изменить пароль'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default SecuritySettings; 