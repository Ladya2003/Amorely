import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, IconButton, Typography, useTheme } from '@mui/material';
import { ArrowBackIcon } from '../UI/icons';
import CustomSnackbar from '../UI/CustomSnackbar';
import { useNavigation } from '../../contexts/NavigationContext';
import { fetchFortuneWheel, saveFortuneWheel } from '../../services/fortuneWheelService';
import FortuneWheelPageShell from './FortuneWheelPageShell';
import FortuneWheelSpinView from './FortuneWheelSpinView';
import FortuneWheelTasksDialog from './FortuneWheelTasksDialog';
import {
  getFortuneWheelHeaderIconSx,
  getFortuneWheelHeaderSx,
  getFortuneWheelHubButtonPrimarySx,
  getFortuneWheelHubButtonSecondarySx,
  getFortuneWheelHubContentSx,
  getFortuneWheelTitleSx,
} from './fortuneWheelStyles';
import { tasksToText, textToTasks, type FortuneWheelDraft } from './fortuneWheelTypes';

interface FortuneWheelPageProps {
  onClose: () => void;
}

const FortuneWheelPage: React.FC<FortuneWheelPageProps> = ({ onClose }) => {
  const theme = useTheme();
  const { setShowBottomNav } = useNavigation();
  const [view, setView] = useState<'hub' | 'spin'>('hub');
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tasksDialogOpen, setTasksDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false,
    message: '',
    severity: 'error',
  });

  const draft = useMemo<FortuneWheelDraft>(
    () => ({
      title,
      tasksText: tasksToText(tasks),
    }),
    [title, tasks]
  );

  const loadWheel = useCallback(async () => {
    setLoading(true);
    try {
      const wheel = await fetchFortuneWheel();
      setTitle(wheel.title);
      setTasks(wheel.tasks);
    } catch (error) {
      console.error('Fortune wheel load error:', error);
      setSnackbar({ open: true, message: 'Не удалось загрузить колесо фортуны', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWheel();
  }, [loadWheel]);

  useEffect(() => {
    setShowBottomNav(false);
    return () => {
      setShowBottomNav(true);
    };
  }, [setShowBottomNav]);

  useEffect(() => {
    const scrollEl = document.querySelector<HTMLElement>('[data-app-main-scroll]');
    if (!scrollEl) {
      return undefined;
    }

    const previousOverflowY = scrollEl.style.overflowY;
    scrollEl.style.overflowY = 'hidden';

    return () => {
      scrollEl.style.overflowY = previousOverflowY;
    };
  }, []);

  const handleSaveTasks = async (nextDraft: FortuneWheelDraft) => {
    setSaving(true);
    try {
      const nextTasks = textToTasks(nextDraft.tasksText);
      const saved = await saveFortuneWheel({
        title: nextDraft.title,
        tasks: nextTasks,
      });
      setTitle(saved.title);
      setTasks(saved.tasks);
      setTasksDialogOpen(false);
      setSnackbar({ open: true, message: 'Задания сохранены', severity: 'success' });
    } catch (error) {
      console.error('Fortune wheel save error:', error);
      setSnackbar({ open: true, message: 'Не удалось сохранить задания', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (view === 'spin') {
    return (
      <FortuneWheelPageShell>
        <FortuneWheelSpinView title={title} tasks={tasks} onBack={() => setView('hub')} />
        <CustomSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      </FortuneWheelPageShell>
    );
  }

  return (
    <FortuneWheelPageShell>
      <Box sx={getFortuneWheelHeaderSx(theme)}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onClose} aria-label="Назад к планам" sx={getFortuneWheelHeaderIconSx()}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800} sx={getFortuneWheelTitleSx()}>
            Моё колесо Фортуны
          </Typography>
        </Box>
      </Box>

      <Box sx={getFortuneWheelHubContentSx()}>
        {loading ? (
          <CircularProgress size={28} sx={{ color: '#fff' }} />
        ) : (
          <>
            <Button
              variant="contained"
              size="large"
              onClick={() => setTasksDialogOpen(true)}
              sx={getFortuneWheelHubButtonPrimarySx(theme)}
            >
              Задания
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setView('spin')}
              sx={getFortuneWheelHubButtonSecondarySx()}
            >
              Колесо
            </Button>
          </>
        )}
      </Box>

      <FortuneWheelTasksDialog
        open={tasksDialogOpen}
        initialDraft={draft}
        isLoading={saving}
        onClose={() => {
          if (!saving) {
            setTasksDialogOpen(false);
          }
        }}
        onSubmit={(nextDraft) => void handleSaveTasks(nextDraft)}
      />

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </FortuneWheelPageShell>
  );
};

export default FortuneWheelPage;
