import React, { useCallback, useEffect, useState } from 'react';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { AddIcon, ArrowBackIcon } from '../UI/icons';
import { getCalendarHeaderGlowWrapSx, getCalendarScrollSx } from '../Calendar/calendarPageStyles';
import { fetchKaifLifeIdeas } from '../../services/kaifLifeService';
import KaifLifeIdeaEditor from './KaifLifeIdeaEditor';
import KaifLifeIdeaList from './KaifLifeIdeaList';
import { normalizeDraft } from './kaifLifeBlocks';
import type { KaifLifeIdea } from './kaifLifeTypes';

interface KaifLifePageProps {
  onClose: () => void;
}

const KaifLifePage: React.FC<KaifLifePageProps> = ({ onClose }) => {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [ideas, setIdeas] = useState<KaifLifeIdea[]>([]);
  const [editingIdea, setEditingIdea] = useState<KaifLifeIdea | null>(null);
  const [loading, setLoading] = useState(true);

  const loadIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchKaifLifeIdeas();
      setIdeas(next);
    } catch (error) {
      console.error('Kaif Life list load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIdeas();
  }, [loadIdeas]);

  const openCreate = () => {
    setEditingIdea(null);
    setView('editor');
  };

  const openEdit = (idea: KaifLifeIdea) => {
    setEditingIdea({
      ...idea,
      ...normalizeDraft({ title: idea.title, stages: idea.stages }),
    });
    setView('editor');
  };

  const handleEditorBack = (shouldReload: boolean) => {
    setView('list');
    setEditingIdea(null);
    if (shouldReload) {
      void loadIdeas();
    }
  };

  if (view === 'editor') {
    return (
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={(muiTheme) => getCalendarHeaderGlowWrapSx(muiTheme)}>
          <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 0.5 }}>
            <KaifLifeIdeaEditor
              key={editingIdea?._id ?? 'new'}
              idea={editingIdea}
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
          <IconButton onClick={openCreate} aria-label="Создать идею">
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
          <KaifLifeIdeaList ideas={ideas} onOpenIdea={openEdit} />
        )}
      </Box>
    </Box>
  );
};

export default KaifLifePage;
