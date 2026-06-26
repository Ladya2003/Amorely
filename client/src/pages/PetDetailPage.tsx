import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@mui/material';
import { useParams } from 'react-router-dom';
import PetDetailView from '../components/Pets/PetDetailView';

const PetDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { petId } = useParams<{ petId: string }>();

  if (!petId) {
    return null;
  }

  return (
    <Container maxWidth="sm">
      <PetDetailView
        petId={petId}
        onBack={() => navigate('/')}
        onGifted={() => navigate('/')}
      />
    </Container>
  );
};

export default PetDetailPage;
