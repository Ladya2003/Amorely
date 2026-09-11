import React, { useCallback, useEffect, useState } from 'react';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { AddIcon, ArrowBackIcon } from '../UI/icons';
import { getCalendarHeaderGlowWrapSx, getCalendarScrollSx } from '../Calendar/calendarPageStyles';
import ConfirmDeleteDialog from '../UI/ConfirmDeleteDialog';
import CustomSnackbar from '../UI/CustomSnackbar';
import { useAuth } from '../../contexts/AuthContext';
import {
  createKaifLifeGroup,
  deleteKaifLifeGroup,
  fetchKaifLifeList,
  moveKaifLifeGroup,
  moveKaifLifeIdea,
  updateKaifLifeGroup,
} from '../../services/kaifLifeService';
import {
  isKaifLifeGroupExpanded,
  readKaifLifeGroupExpanded,
  writeKaifLifeGroupExpanded,
} from '../../utils/kaifLifeGroupCollapse';
import KaifLifeCreateGroupDialog from './KaifLifeCreateGroupDialog';
import KaifLifeIdeaEditor from './KaifLifeIdeaEditor';
import KaifLifeIdeaList from './KaifLifeIdeaList';
import { normalizeDraft } from './kaifLifeBlocks';
import type { KaifLifeGroup, KaifLifeIdea, KaifLifeMoveDirection } from './kaifLifeTypes';

interface KaifLifePageProps {
  onClose: () => void;
}

const KaifLifePage: React.FC<KaifLifePageProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [groups, setGroups] = useState<KaifLifeGroup[]>([]);
  const [ideas, setIdeas] = useState<KaifLifeIdea[]>([]);
  const [editingIdea, setEditingIdea] = useState<KaifLifeIdea | null>(null);
  const [createGroupId, setCreateGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<KaifLifeGroup | null>(null);
  const [savingGroupTitle, setSavingGroupTitle] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<KaifLifeGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [moving, setMoving] = useState(false);
  const [expandedByGroupId, setExpandedByGroupId] = useState<Record<string, boolean>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false,
    message: '',
    severity: 'error',
  });

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchKaifLifeList();
      setGroups(next.groups);
      setIdeas(next.ideas);
    } catch (error) {
      console.error('Kaif Life list load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!user?._id) {
      return;
    }
    setExpandedByGroupId(readKaifLifeGroupExpanded(user._id));
  }, [user?._id]);

  const persistExpanded = (next: Record<string, boolean>) => {
    setExpandedByGroupId(next);
    if (user?._id) {
      writeKaifLifeGroupExpanded(user._id, next);
    }
  };

  const openCreateGroup = () => {
    setCreateGroupOpen(true);
  };

  const handleCreateGroup = async (title: string) => {
    setCreatingGroup(true);
    try {
      const group = await createKaifLifeGroup(title);
      setGroups((prev) => [...prev, group]);
      persistExpanded({ ...expandedByGroupId, [group._id]: true });
      setCreateGroupOpen(false);
    } catch (error) {
      console.error('Kaif Life create group error:', error);
      setSnackbar({ open: true, message: 'Не удалось создать группу', severity: 'error' });
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleRenameGroup = async (title: string) => {
    if (!groupToEdit) {
      return;
    }

    setSavingGroupTitle(true);
    try {
      const updated = await updateKaifLifeGroup(groupToEdit._id, title);
      setGroups((prev) => prev.map((group) => (group._id === updated._id ? updated : group)));
      setGroupToEdit(null);
    } catch (error) {
      console.error('Kaif Life rename group error:', error);
      setSnackbar({ open: true, message: 'Не удалось переименовать группу', severity: 'error' });
    } finally {
      setSavingGroupTitle(false);
    }
  };

  const openCreateIdea = (group: KaifLifeGroup) => {
    setEditingIdea(null);
    setCreateGroupId(group._id);
    setView('editor');
  };

  const openEdit = (idea: KaifLifeIdea) => {
    setCreateGroupId(idea.groupId);
    setEditingIdea({
      ...idea,
      ...normalizeDraft({
        title: idea.title,
        stages: idea.stages,
      }),
    });
    setView('editor');
  };

  const handleEditorBack = (shouldReload: boolean) => {
    setView('list');
    setEditingIdea(null);
    setCreateGroupId(null);
    if (shouldReload) {
      void loadList();
    }
  };

  const handleToggleGroup = (groupId: string) => {
    persistExpanded({
      ...expandedByGroupId,
      [groupId]: !isKaifLifeGroupExpanded(expandedByGroupId, groupId),
    });
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) {
      return;
    }

    setDeletingGroup(true);
    try {
      await deleteKaifLifeGroup(groupToDelete._id);
      setGroups((prev) => prev.filter((group) => group._id !== groupToDelete._id));
      setIdeas((prev) => prev.filter((idea) => idea.groupId !== groupToDelete._id));
      const nextExpanded = { ...expandedByGroupId };
      delete nextExpanded[groupToDelete._id];
      persistExpanded(nextExpanded);
      setGroupToDelete(null);
    } catch (error) {
      console.error('Kaif Life delete group error:', error);
      setSnackbar({ open: true, message: 'Не удалось удалить группу', severity: 'error' });
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleMoveGroup = async (group: KaifLifeGroup, direction: KaifLifeMoveDirection) => {
    setMoving(true);
    try {
      const next = await moveKaifLifeGroup(group._id, direction);
      setGroups(next.groups);
      setIdeas(next.ideas);
    } catch (error) {
      console.error('Kaif Life move group error:', error);
      setSnackbar({ open: true, message: 'Не удалось переместить группу', severity: 'error' });
    } finally {
      setMoving(false);
    }
  };

  const handleMoveIdea = async (idea: KaifLifeIdea, direction: KaifLifeMoveDirection) => {
    setMoving(true);
    try {
      const next = await moveKaifLifeIdea(idea._id, direction);
      setGroups(next.groups);
      setIdeas(next.ideas);
      if (direction === 'up' || direction === 'down') {
        const moved = next.ideas.find((item) => item._id === idea._id);
        if (moved && moved.groupId !== idea.groupId) {
          persistExpanded({ ...expandedByGroupId, [moved.groupId]: true });
        }
      }
    } catch (error) {
      console.error('Kaif Life move idea error:', error);
      setSnackbar({ open: true, message: 'Не удалось переместить идею', severity: 'error' });
    } finally {
      setMoving(false);
    }
  };

  if (view === 'editor') {
    return (
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={(muiTheme) => getCalendarHeaderGlowWrapSx(muiTheme)}>
          <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 0.5 }}>
            <KaifLifeIdeaEditor
              key={editingIdea?._id ?? `new-${createGroupId ?? 'none'}`}
              idea={editingIdea}
              groupId={createGroupId}
              onBack={handleEditorBack}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={(muiTheme) => getCalendarHeaderGlowWrapSx(muiTheme)}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: { xs: 1.5, sm: 2 }, pb: 1 }}>
          <IconButton onClick={onClose} aria-label="Назад к планам">
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', lineHeight: 1.25 }}
          >
            Мои идеи для Kaif Life
          </Typography>
          <IconButton onClick={openCreateGroup} aria-label="Создать группу">
            <AddIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={getCalendarScrollSx()}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <KaifLifeIdeaList
            groups={groups}
            ideas={ideas}
            expandedByGroupId={expandedByGroupId}
            moving={moving}
            onToggleGroup={handleToggleGroup}
            onAddIdea={openCreateIdea}
            onEditGroup={setGroupToEdit}
            onDeleteGroup={setGroupToDelete}
            onMoveGroup={handleMoveGroup}
            onMoveIdea={handleMoveIdea}
            onOpenIdea={openEdit}
          />
        )}
      </Box>

      <KaifLifeCreateGroupDialog
        open={createGroupOpen || Boolean(groupToEdit)}
        mode={groupToEdit ? 'edit' : 'create'}
        initialTitle={groupToEdit?.title ?? ''}
        isLoading={creatingGroup || savingGroupTitle}
        onClose={() => {
          if (!creatingGroup && !savingGroupTitle) {
            setCreateGroupOpen(false);
            setGroupToEdit(null);
          }
        }}
        onSubmit={(title) => {
          if (groupToEdit) {
            void handleRenameGroup(title);
            return;
          }
          void handleCreateGroup(title);
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(groupToDelete)}
        onClose={() => {
          if (!deletingGroup) {
            setGroupToDelete(null);
          }
        }}
        onConfirm={() => void handleDeleteGroup()}
        title="Удалить группу"
        message={
          groupToDelete
            ? `Удалить «${groupToDelete.title.trim() || 'Без названия'}» и все идеи в ней?`
            : 'Удалить группу и все идеи в ней?'
        }
        isLoading={deletingGroup}
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

export default KaifLifePage;
