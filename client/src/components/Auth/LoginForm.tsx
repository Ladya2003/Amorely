import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  InputAdornment, 
  IconButton 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { translateAuthServerError } from '../../localization/authHelpers';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  initialEmail?: string;
  initialPassword?: string;
  showRegistrationSuccess?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  initialEmail = '',
  initialPassword = '',
  showRegistrationSuccess = false,
}) => {
  const { t } = useTranslation();
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }
    
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      // Ошибка уже обрабатывается в контексте
    }
  };
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const translatedError = error ? translateAuthServerError(error, t) : null;
  
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        {t('auth.login.title')}
      </Typography>
      
      {showRegistrationSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('auth.login.registrationSuccess')}
        </Alert>
      )}

      {translatedError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {translatedError}
        </Alert>
      )}
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label={t('auth.email')}
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label={t('auth.password')}
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={t('auth.togglePasswordVisibility')}
                onClick={handleClickShowPassword}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading}
      >
        {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
      </Button>
      
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2">
          {t('auth.login.noAccount')}{' '}
          <Button 
            onClick={onSwitchToRegister} 
            sx={{ p: 0, minWidth: 'auto' }}
            disabled={isLoading}
          >
            {t('auth.login.registerLink')}
          </Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginForm;
