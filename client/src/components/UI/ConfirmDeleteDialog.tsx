import React from 'react';
import ResponsiveDialog from './ResponsiveDialog';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isLoading?: boolean;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Подтвердите удаление',
  message,
  itemName,
  isLoading = false
}) => {
  const defaultMessage = itemName 
    ? `Вы уверены, что хотите удалить "${itemName}"?`
    : 'Вы уверены, что хотите удалить этот элемент?';

  const finalMessage = message || defaultMessage;

  const handleConfirm = () => {
    onConfirm();
    // Не закрываем диалог автоматически, позволяем родительскому компоненту управлять этим
  };

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon color="warning" sx={{ fontSize: 28 }} />
            <Typography variant="h6" component="span">
              {title}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            disabled={isLoading}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          {finalMessage}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
          Это действие нельзя отменить.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isLoading}
          sx={{ minWidth: 100 }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={isLoading}
          sx={{ 
            minWidth: 100,
            '&:hover': {
              bgcolor: 'error.dark'
            }
          }}
        >
          {isLoading ? 'Удаление...' : 'Удалить'}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default ConfirmDeleteDialog;
