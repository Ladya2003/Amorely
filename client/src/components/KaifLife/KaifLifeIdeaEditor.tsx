import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Fab,
  FormControlLabel,
  IconButton,
  Switch,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AppDatePicker from '../UI/AppDatePicker';
import AppTextField from '../UI/AppTextField';
import ConfirmDeleteDialog from '../UI/ConfirmDeleteDialog';
import CustomSnackbar from '../UI/CustomSnackbar';
import { AddIcon, ArrowBackIcon, DeleteIcon, RedoIcon, SaveIcon, UndoIcon } from '../UI/icons';
import { prepareAllMediaForUpload } from '../../utils/parallelMediaPrepare';
import {
  createKaifLifeIdea,
  deleteKaifLifeIdea,
  updateKaifLifeIdea,
  uploadKaifLifeMedia,
} from '../../services/kaifLifeService';
import {
  cloneDraft,
  createEmptyDraft,
  defaultMediaWidth,
  insertMediaAtCursor,
  isIdeaMeaningful,
  normalizeDraft,
} from './kaifLifeBlocks';
import KaifLifeDocumentEditor, { type KaifLifeDocumentEditorHandle } from './KaifLifeDocumentEditor';
import {
  KAIF_LIFE_STAGE_KEYS,
  KAIF_LIFE_STAGE_LABELS,
  type KaifLifeIdea,
  type KaifLifeIdeaDraft,
  type KaifLifeStageKey,
} from './kaifLifeTypes';

const AUTOSAVE_MS = 2000;
const HISTORY_DEBOUNCE_MS = 500;
const TITLE_COMMIT_MS = 400;
const HISTORY_LIMIT = 50;

interface KaifLifeIdeaEditorProps {
  idea: KaifLifeIdea | null;
  groupId: string | null;
  onBack: (shouldReload: boolean) => void;
}

const KaifLifeIdeaEditor: React.FC<KaifLifeIdeaEditorProps> = ({ idea, groupId, onBack }) => {
  const [draft, setDraft] = useState<KaifLifeIdeaDraft>(() =>
    idea ? normalizeDraft({ title: idea.title, stages: idea.stages }) : createEmptyDraft()
  );
  const [ideaId, setIdeaId] = useState<string | null>(idea?._id ?? null);
  const [activeStage, setActiveStage] = useState<KaifLifeStageKey>('development');
  const [focusTextId, setFocusTextId] = useState<string | null>(null);
  const [title, setTitle] = useState(draft.title);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false,
    message: '',
    severity: 'error',
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [historyTick, setHistoryTick] = useState(0);

  const draftRef = useRef(draft);
  const ideaIdRef = useRef(ideaId);
  const createdInSessionRef = useRef(!idea);
  const saveTimerRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const leavingRef = useRef(false);
  const undoStackRef = useRef<KaifLifeIdeaDraft[]>([]);
  const redoStackRef = useRef<KaifLifeIdeaDraft[]>([]);
  const savedSnapshotRef = useRef(JSON.stringify(draft));
  const historyTimerRef = useRef<number | null>(null);
  const historyCheckpointRef = useRef<KaifLifeIdeaDraft | null>(null);
  const documentEditorRef = useRef<KaifLifeDocumentEditorHandle | null>(null);
  const focusTextIdRef = useRef<string | null>(null);
  const cursorRef = useRef(0);
  const titleTimerRef = useRef<number | null>(null);
  const titleRef = useRef(title);
  const flushPendingInputsRef = useRef(() => {});

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    ideaIdRef.current = ideaId;
  }, [ideaId]);

  useEffect(() => {
    setTitle(draft.title);
    titleRef.current = draft.title;
  }, [draft.title]);

  const flushSave = useCallback(async (): Promise<boolean> => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (savingRef.current) {
      pendingSaveRef.current = true;
      return false;
    }

    flushPendingInputsRef.current();

    const snapshot = draftRef.current;
    const currentId = ideaIdRef.current;
    if (!currentId && !isIdeaMeaningful(snapshot)) {
      return false;
    }

    const snapshotJson = JSON.stringify(snapshot);
    if (snapshotJson === savedSnapshotRef.current && currentId) {
      setIsDirty(false);
      return true;
    }

    savingRef.current = true;
    try {
      if (!currentId) {
        if (!groupId) {
          if (!leavingRef.current) {
            setSnackbar({ open: true, message: 'Не удалось сохранить идею', severity: 'error' });
          }
          return false;
        }
        const created = await createKaifLifeIdea(snapshot, groupId);
        ideaIdRef.current = created._id;
        setIdeaId(created._id);
      } else {
        await updateKaifLifeIdea(currentId, snapshot);
      }
      savedSnapshotRef.current = snapshotJson;
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error('Kaif Life save error:', error);
      if (!leavingRef.current) {
        setSnackbar({ open: true, message: 'Не удалось сохранить идею', severity: 'error' });
      }
      return false;
    } finally {
      savingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        void flushSave();
      }
    }
  }, [groupId]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void flushSave();
    }, AUTOSAVE_MS);
  }, [flushSave]);

  const scheduleHistory = (before: KaifLifeIdeaDraft) => {
    if (!historyCheckpointRef.current) {
      historyCheckpointRef.current = cloneDraft(before);
    }

    if (historyTimerRef.current !== null) {
      window.clearTimeout(historyTimerRef.current);
    }

    historyTimerRef.current = window.setTimeout(() => {
      const checkpoint = historyCheckpointRef.current;
      historyCheckpointRef.current = null;
      historyTimerRef.current = null;
      if (!checkpoint) {
        return;
      }
      undoStackRef.current = [...undoStackRef.current, checkpoint].slice(-HISTORY_LIMIT);
      redoStackRef.current = [];
      setHistoryTick((tick) => tick + 1);
    }, HISTORY_DEBOUNCE_MS);
  };

  const flushHistoryCheckpoint = () => {
    if (historyTimerRef.current !== null) {
      window.clearTimeout(historyTimerRef.current);
      historyTimerRef.current = null;
    }
    const checkpoint = historyCheckpointRef.current;
    if (!checkpoint) {
      return;
    }
    historyCheckpointRef.current = null;
    undoStackRef.current = [...undoStackRef.current, checkpoint].slice(-HISTORY_LIMIT);
    redoStackRef.current = [];
    setHistoryTick((tick) => tick + 1);
  };

  const applyDraft = (next: KaifLifeIdeaDraft, recordHistory: boolean) => {
    if (recordHistory) {
      scheduleHistory(draftRef.current);
    }
    draftRef.current = next;
    setDraft(next);
    setIsDirty(true);
    scheduleSave();
  };

  const updateDraft = (updater: (prev: KaifLifeIdeaDraft) => KaifLifeIdeaDraft) => {
    applyDraft(updater(draftRef.current), true);
  };

  flushPendingInputsRef.current = () => {
    documentEditorRef.current?.flush();
    if (titleTimerRef.current !== null) {
      window.clearTimeout(titleTimerRef.current);
      titleTimerRef.current = null;
    }
    if (titleRef.current !== draftRef.current.title) {
      applyDraft({ ...draftRef.current, title: titleRef.current }, true);
    }
  };

  const handleUndo = () => {
    flushPendingInputsRef.current();
    flushHistoryCheckpoint();
    const previous = undoStackRef.current[undoStackRef.current.length - 1];
    if (!previous) {
      return;
    }
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    redoStackRef.current = [...redoStackRef.current, cloneDraft(draftRef.current)].slice(-HISTORY_LIMIT);
    setHistoryTick((tick) => tick + 1);
    applyDraft(cloneDraft(previous), false);
  };

  const handleRedo = () => {
    flushPendingInputsRef.current();
    flushHistoryCheckpoint();
    const next = redoStackRef.current[redoStackRef.current.length - 1];
    if (!next) {
      return;
    }
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    undoStackRef.current = [...undoStackRef.current, cloneDraft(draftRef.current)].slice(-HISTORY_LIMIT);
    setHistoryTick((tick) => tick + 1);
    applyDraft(cloneDraft(next), false);
  };

  const handleManualSave = async () => {
    flushPendingInputsRef.current();
    flushHistoryCheckpoint();
    setIsSaving(true);
    try {
      const saved = await flushSave();
      if (saved && !leavingRef.current) {
        setSnackbar({ open: true, message: 'Сохранено', severity: 'success' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = async () => {
    leavingRef.current = true;
    flushPendingInputsRef.current();
    await flushSave();

    const currentId = ideaIdRef.current;
    const snapshot = draftRef.current;
    if (createdInSessionRef.current && currentId && !isIdeaMeaningful(snapshot)) {
      try {
        await deleteKaifLifeIdea(currentId);
        onBack(true);
        return;
      } catch (error) {
        console.error('Kaif Life discard draft error:', error);
      }
    }

    onBack(Boolean(currentId) || isIdeaMeaningful(snapshot));
  };

  const handleDelete = async () => {
    if (!ideaId) {
      setDeleteOpen(false);
      onBack(false);
      return;
    }

    setDeleting(true);
    try {
      await deleteKaifLifeIdea(ideaId);
      onBack(true);
    } catch (error) {
      console.error('Kaif Life delete error:', error);
      setSnackbar({ open: true, message: 'Не удалось удалить идею', severity: 'error' });
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleAddMedia = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    try {
      flushPendingInputsRef.current();
      const prepared = await prepareAllMediaForUpload(Array.from(files));
      const uploaded = await uploadKaifLifeMedia(prepared);
      const widthPercent = defaultMediaWidth(uploaded.length);
      const mediaItems = uploaded.map((item) => ({
        url: item.url,
        publicId: item.publicId,
        mediaType: item.mediaType,
        widthPercent,
      }));

      flushPendingInputsRef.current();
      const inserted = insertMediaAtCursor(
        draftRef.current.stages[activeStage].blocks,
        mediaItems,
        focusTextIdRef.current,
        cursorRef.current
      );
      focusTextIdRef.current = inserted.focusTextId;
      cursorRef.current = 0;
      setFocusTextId(inserted.focusTextId);
      updateDraft((prev) => ({
        ...prev,
        stages: {
          ...prev.stages,
          [activeStage]: {
            ...prev.stages[activeStage],
            blocks: inserted.blocks,
          },
        },
      }));
    } catch (error) {
      console.error('Kaif Life upload error:', error);
      setSnackbar({ open: true, message: 'Не удалось загрузить файлы', severity: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const stage = draft.stages[activeStage];
  const canUndo = historyTick >= 0 && undoStackRef.current.length > 0;
  const canRedo = historyTick >= 0 && redoStackRef.current.length > 0;
  const canSave = isDirty && (Boolean(ideaId) || isIdeaMeaningful(draft));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
        <IconButton onClick={() => void handleBack()} aria-label="Назад к списку" sx={{ mt: 0.25 }}>
          <ArrowBackIcon />
        </IconButton>
        <AppTextField
          value={title}
          onChange={(event) => {
            const nextTitle = event.target.value;
            setTitle(nextTitle);
            titleRef.current = nextTitle;
            if (titleTimerRef.current !== null) {
              window.clearTimeout(titleTimerRef.current);
            }
            titleTimerRef.current = window.setTimeout(() => {
              titleTimerRef.current = null;
              if (titleRef.current !== draftRef.current.title) {
                updateDraft((prev) => ({
                  ...prev,
                  title: titleRef.current,
                }));
              }
            }, TITLE_COMMIT_MS);
          }}
          placeholder="Название идеи"
          label="Название идеи"
          multiline
          fullWidth
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontWeight: 800,
              fontSize: '1.35rem',
              lineHeight: 1.25,
              alignItems: 'flex-start',
            },
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, mt: 0.25 }}>
          <IconButton
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Назад"
            title="Назад"
          >
            <UndoIcon />
          </IconButton>
          <IconButton
            onClick={handleRedo}
            disabled={!canRedo}
            aria-label="Вперёд"
            title="Вперёд"
          >
            <RedoIcon />
          </IconButton>
          <IconButton
            onClick={() => void handleManualSave()}
            disabled={!canSave || isSaving}
            aria-label="Сохранить"
            title="Сохранить"
            color={canSave ? 'primary' : 'default'}
          >
            <SaveIcon />
          </IconButton>
          <IconButton
            onClick={() => setDeleteOpen(true)}
            aria-label="Удалить идею"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Tabs
        value={activeStage}
        onChange={(_event, value: KaifLifeStageKey) => {
          flushPendingInputsRef.current();
          setActiveStage(value);
        }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 1.5, minHeight: 42 }}
      >
        {KAIF_LIFE_STAGE_KEYS.map((key) => (
          <Tab
            key={key}
            value={key}
            label={KAIF_LIFE_STAGE_LABELS[key]}
            sx={{ textTransform: 'none', minHeight: 42 }}
          />
        ))}
      </Tabs>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1.5,
          mb: 2,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={stage.inProgress}
              onChange={(event) =>
                updateDraft((prev) => ({
                  ...prev,
                  stages: {
                    ...prev.stages,
                    [activeStage]: {
                      ...prev.stages[activeStage],
                      inProgress: event.target.checked,
                    },
                  },
                }))
              }
            />
          }
          label="В прогрессе"
        />
        <FormControlLabel
          control={
            <Switch
              checked={stage.done}
              onChange={(event) =>
                updateDraft((prev) => ({
                  ...prev,
                  stages: {
                    ...prev.stages,
                    [activeStage]: {
                      ...prev.stages[activeStage],
                      done: event.target.checked,
                    },
                  },
                }))
              }
            />
          }
          label="Выполнено"
        />
        <AppDatePicker
          label="Дедлайн"
          value={stage.deadline ? new Date(stage.deadline) : null}
          onChange={(value) =>
            updateDraft((prev) => ({
              ...prev,
              stages: {
                ...prev.stages,
                [activeStage]: {
                  ...prev.stages[activeStage],
                  deadline: value instanceof Date && !Number.isNaN(value.getTime())
                    ? value.toISOString()
                    : null,
                },
              },
            }))
          }
          format="dd.MM.yyyy"
          slotProps={{
            field: { clearable: true },
            textField: { fullWidth: true },
          }}
        />
      </Box>

      <Box sx={{ pb: 10 }}>
        <KaifLifeDocumentEditor
          ref={documentEditorRef}
          blocks={stage.blocks}
          focusTextId={focusTextId}
          onBlocksChange={(blocks) =>
            updateDraft((prev) => ({
              ...prev,
              stages: {
                ...prev.stages,
                [activeStage]: {
                  ...prev.stages[activeStage],
                  blocks,
                },
              },
            }))
          }
          onFocusChange={(textId, nextCursor) => {
            focusTextIdRef.current = textId;
            cursorRef.current = nextCursor;
          }}
        />
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(event) => void handleAddMedia(event.target.files)}
      />

      <Fab
        color="primary"
        aria-label="Добавить фото или видео"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          position: 'sticky',
          bottom: { xs: 16, sm: 16 },
          alignSelf: 'flex-end',
          ml: 'auto',
        }}
      >
        <AddIcon />
      </Fab>

      {uploading && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, alignSelf: 'flex-end' }}>
          Загрузка...
        </Typography>
      )}

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
        title="Удалить идею"
        message={draft.title.trim() ? `Удалить «${draft.title.trim()}»?` : 'Удалить эту идею?'}
        isLoading={deleting}
      />

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default KaifLifeIdeaEditor;
