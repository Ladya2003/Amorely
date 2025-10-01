import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Alert
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface FrequencyChangeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (resetRotation: boolean) => void;
  oldFrequency: { count: number; hours: number };
  newFrequency: { count: number; hours: number };
  isLoading?: boolean;
}

const FrequencyChangeDialog: React.FC<FrequencyChangeDialogProps> = ({
  open,
  onClose,
  onConfirm,
  oldFrequency,
  newFrequency,
  isLoading = false
}) => {
  const [resetChoice, setResetChoice] = React.useState<'continue' | 'reset'>('continue');

  const handleConfirm = () => {
    onConfirm(resetChoice === 'reset');
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="span">
            Изменение настроек частоты
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Текущие настройки:</strong> {oldFrequency.count} контента каждые {oldFrequency.hours} часов
          </Typography>
          <Typography variant="body2">
            <strong>Новые настройки:</strong> {newFrequency.count} контента каждые {newFrequency.hours} часов
          </Typography>
        </Alert>

        <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
          Как применить новые настройки?
        </Typography>

        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={resetChoice}
            onChange={(e) => setResetChoice(e.target.value as 'continue' | 'reset')}
          >
            <FormControlLabel
              value="continue"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlayArrowIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Продолжить с текущего места
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Новые настройки будут применены к текущему отображаемому контенту. 
                      Порядок показа фото не изменится.
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ 
                alignItems: 'flex-start', 
                mb: 2,
                '& .MuiFormControlLabel-label': { mt: -0.5 }
              }}
            />
            
            <FormControlLabel
              value="reset"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RestartAltIcon color="warning" fontSize="small" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Начать сначала
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Показ контента начнется с первых загруженных фото с новыми настройками частоты.
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ 
                alignItems: 'flex-start',
                '& .MuiFormControlLabel-label': { mt: -0.5 }
              }}
            />
          </RadioGroup>
        </FormControl>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={isLoading}
          sx={{ minWidth: 100 }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={isLoading}
          sx={{ 
            minWidth: 120,
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          {isLoading ? 'Применение...' : 'Применить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FrequencyChangeDialog;
