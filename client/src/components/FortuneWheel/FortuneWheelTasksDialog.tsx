import React, { useEffect, useState } from 'react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import AppTextField from '../UI/AppTextField';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import type { FortuneWheelDraft } from './fortuneWheelTypes';

interface FortuneWheelTasksDialogProps {
  open: boolean;
  initialDraft: FortuneWheelDraft;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (draft: FortuneWheelDraft) => void;
}

const FortuneWheelTasksDialog: React.FC<FortuneWheelTasksDialogProps> = ({
  open,
  initialDraft,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [tasksText, setTasksText] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(initialDraft.title);
      setTasksText(initialDraft.tasksText);
    }
  }, [initialDraft, open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) {
      return;
    }
    onSubmit({ title: title.trim(), tasksText });
  };

  return (
    <ResponsiveDialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>
          <Typography variant="h6" component="span">
            Задания
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <AppTextField
            autoFocus
            fullWidth
            label="Название колеса фортуны"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            inputProps={{ maxLength: 200 }}
            disabled={isLoading}
          />
          <AppTextField
            fullWidth
            multiline
            minRows={8}
            maxRows={16}
            label="Задания (каждое с новой строки)"
            value={tasksText}
            onChange={(event) => setTasksText(event.target.value)}
            disabled={isLoading}
            placeholder={'Слабая рука — играешь только недоминантной рукой.\nТолько бэкхенд — весь период без права на форхенд.'}
          />
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={onClose} variant="outlined" disabled={isLoading} sx={{ minWidth: 100 }}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading} sx={{ minWidth: 100 }}>
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Box>
    </ResponsiveDialog>
  );
};

export default FortuneWheelTasksDialog;
