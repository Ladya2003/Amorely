import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t('settings.security.errors.fillAll'));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError(t('settings.security.errors.passwordMismatch'));
      return;
    }
    
    if (newPassword.length < 8) {
      setError(t('settings.security.errors.passwordTooShort'));
      return;
    }
    
    try {
      await onChangePassword(oldPassword, newPassword);
      setSuccess(t('settings.security.success'));
      
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Ошибка при изменении пароля:', error);
      setError(t('settings.security.errors.changeFailed'));
    }
  };
  
  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'transparent' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 400 }}>
        {t('settings.security.title')}
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
              label={t('settings.security.currentPassword')}
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
              label={t('settings.security.newPassword')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              variant="outlined"
              helperText={t('settings.security.passwordMinHelper')}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              type="password"
              label={t('settings.security.confirmPassword')}
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
              {isLoading ? t('settings.security.changing') : t('settings.security.changePassword')}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default SecuritySettings;
