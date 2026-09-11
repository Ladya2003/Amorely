import React, { useEffect, useState } from 'react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import AppTextField from '../UI/AppTextField';
import ResponsiveDialog from '../UI/ResponsiveDialog';

interface KaifLifeCreateGroupDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialTitle?: string;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

const KaifLifeCreateGroupDialog: React.FC<KaifLifeCreateGroupDialogProps> = ({
  open,
  mode,
  initialTitle = '',
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(mode === 'edit' ? initialTitle : '');
    }
  }, [initialTitle, mode, open]);

  const trimmed = title.trim();
  const canSubmit = Boolean(trimmed) && (mode === 'create' || trimmed !== initialTitle.trim());

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || isLoading) {
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <ResponsiveDialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>
          <Typography variant="h6" component="span">
            {mode === 'edit' ? 'Название группы' : 'Новая группа'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <AppTextField
            autoFocus
            fullWidth
            label="Название группы"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            inputProps={{ maxLength: 200 }}
            disabled={isLoading}
            sx={{ mt: 0.5 }}
          />
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={onClose} variant="outlined" disabled={isLoading} sx={{ minWidth: 100 }}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit || isLoading}
            sx={{ minWidth: 100 }}
          >
            {isLoading ? (mode === 'edit' ? 'Сохранение...' : 'Создание...') : mode === 'edit' ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Box>
    </ResponsiveDialog>
  );
};

export default KaifLifeCreateGroupDialog;
