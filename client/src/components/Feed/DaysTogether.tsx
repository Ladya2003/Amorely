import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button 
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CreateIcon from '@mui/icons-material/Create';
import SignatureCanvas from 'react-signature-canvas';
import { useNavigate } from 'react-router-dom';
interface DaysTogetherProps {
  daysCount: number | null;
  relationshipStartDate: string | null;
  onAddPhoto: (file: File) => void;
  onAddSignature: (signatureDataUrl: string) => void;
  photo?: string;
  signature?: string;
}

const DaysTogether: React.FC<DaysTogetherProps> = ({ 
  daysCount, 
  relationshipStartDate, 
  onAddPhoto, 
  onAddSignature,
  photo,
  signature
}) => {
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);
  const navigate = useNavigate();

  const getRelationshipStatus = (days: number) => {
    if (days < 30) return "Начало прекрасного пути вместе";
    if (days < 90) return "Месяц за месяцем строим наше счастье";
    if (days < 180) return "Полгода любви и взаимопонимания";
    if (days < 365) return "Наша любовь становится крепче с каждым днем";
    return "Год за годом - вместе навсегда";
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onAddPhoto(event.target.files[0]);
    }
  };

  const handleSignatureDialogOpen = () => {
    setSignatureDialogOpen(true);
  };

  const handleSignatureDialogClose = () => {
    setSignatureDialogOpen(false);
  };

  const handleSignatureSave = () => {
    if (signatureRef) {
      const dataUrl = signatureRef.toDataURL();
      onAddSignature(dataUrl);
      setSignatureDialogOpen(false);
    }
  };

  const handleSignatureClear = () => {
    if (signatureRef) {
      signatureRef.clear();
    }
  };

  if (!daysCount || !relationshipStartDate) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          textAlign: 'center',
          bgcolor: 'background.paper'
        }}
        onClick={() => navigate('/settings')}
      >
        <Typography variant="h6" gutterBottom>
          Добавьте партнера в настройках
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Чтобы видеть количество дней вместе, добавьте партнера и дату начала отношений
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'hidden'
      }}
      id="days-together"
    >
      {photo && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${photo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.2,
            zIndex: 0
          }}
        />
      )}
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h5" component="h2" gutterBottom align="center" fontWeight="bold">
          {daysCount} дней вместе
        </Typography>
        
        <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
          {getRelationshipStatus(daysCount)}
        </Typography>
        
        <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
          С {new Date(relationshipStartDate).toLocaleDateString()}
        </Typography>
        
        {signature && (
          <Box 
            sx={{ 
              mt: 2, 
              display: 'flex', 
              justifyContent: 'center',
              maxWidth: '100%',
              overflow: 'hidden'
            }}
          >
            <img 
              src={signature} 
              alt="Подпись" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100px',
                filter: 'invert(0.2)'
              }} 
            />
          </Box>
        )}
        
        <Box sx={{ 
          mt: 3, 
          display: 'flex', 
          justifyContent: 'center',
          gap: 2
        }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="upload-photo"
            type="file"
            onChange={handlePhotoUpload}
          />
          <label htmlFor="upload-photo">
            <IconButton 
              component="span" 
              color="primary"
              sx={{ 
                bgcolor: 'rgba(255, 75, 141, 0.1)', 
                '&:hover': { bgcolor: 'rgba(255, 75, 141, 0.2)' } 
              }}
            >
              <AddPhotoAlternateIcon />
            </IconButton>
          </label>
          
          <IconButton 
            color="primary" 
            onClick={handleSignatureDialogOpen}
            sx={{ 
              bgcolor: 'rgba(255, 75, 141, 0.1)', 
              '&:hover': { bgcolor: 'rgba(255, 75, 141, 0.2)' } 
            }}
          >
            <CreateIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Dialog open={signatureDialogOpen} onClose={handleSignatureDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Добавить подпись</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: '#f5f5f5',
            height: 200,
            width: '100%'
          }}>
            <SignatureCanvas
              ref={(ref) => setSignatureRef(ref)}
              canvasProps={{
                width: '100%',
                height: 200,
                className: 'signature-canvas'
              }}
              backgroundColor="rgba(245, 245, 245, 0)"
              penColor="black"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSignatureClear}>Очистить</Button>
          <Button onClick={handleSignatureDialogClose}>Отмена</Button>
          <Button onClick={handleSignatureSave} variant="contained" color="primary">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DaysTogether; 