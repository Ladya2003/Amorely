import React from 'react';
import { Alert, Box, Typography } from '@mui/material';

const AdminModeration: React.FC = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Модерация
      </Typography>
      <Alert severity="info">
        Раздел модерации и жалоб будет добавлен позже.
      </Alert>
    </Box>
  );
};

export default AdminModeration;
