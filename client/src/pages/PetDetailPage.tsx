import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import PetDetailView from '../components/Pets/PetDetailView';
import { getPetPageBackdropSx } from '../components/Feed/feedBannerStyles';

const PetDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { petId } = useParams<{ petId: string }>();

  if (!petId) {
    return null;
  }

  return (
    <Box sx={(theme) => getPetPageBackdropSx(theme)}>
      <Container maxWidth="sm" sx={{ py: 2, px: { xs: 2, sm: 3 } }}>
        <PetDetailView
          petId={petId}
          onBack={() => navigate('/')}
          onGifted={() => navigate('/')}
        />
      </Container>
    </Box>
  );
};

export default PetDetailPage;
