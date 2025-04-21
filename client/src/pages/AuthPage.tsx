import React, { useState } from 'react';
import { Container, Box, Paper, Typography, useTheme } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import FavoriteIcon from '@mui/icons-material/Favorite';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const theme = useTheme();
  
  const handleSwitchToRegister = () => {
    setIsLogin(false);
  };
  
  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };
  
  return (
    <Container component="main" maxWidth="xs" sx={{ py: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <FavoriteIcon sx={{ color: 'primary.main', fontSize: 40, mr: 1 }} />
          <Typography variant="h4" component="div" fontWeight="bold">
            Amorely
          </Typography>
        </Box>
        
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          {isLogin ? (
            <LoginForm onSwitchToRegister={handleSwitchToRegister} />
          ) : (
            <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
          )}
        </Paper>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          Amorely — приложение для пар, которое помогает сохранять и делиться особыми моментами.
        </Typography>
      </Box>
    </Container>
  );
};

export default AuthPage; 