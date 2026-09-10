import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { CheckIcon } from '../UI/icons';
import { SURFACE_BORDER_RADIUS, getPrimaryTintSurface } from '../../theme/surfaceStyles';
import { KAIF_LIFE_STAGE_KEYS, KAIF_LIFE_STAGE_LABELS, type KaifLifeIdea } from './kaifLifeTypes';

interface KaifLifeIdeaListProps {
  ideas: KaifLifeIdea[];
  onOpenIdea: (idea: KaifLifeIdea) => void;
}

const KaifLifeIdeaList: React.FC<KaifLifeIdeaListProps> = ({ ideas, onOpenIdea }) => {
  const theme = useTheme();
  const lastTapRef = useRef<{ id: string; at: number }>({ id: '', at: 0 });

  const handleCardClick = (idea: KaifLifeIdea, pointerType: string) => {
    if (pointerType !== 'touch') {
      return;
    }

    const now = Date.now();
    if (lastTapRef.current.id === idea._id && now - lastTapRef.current.at < 350) {
      lastTapRef.current = { id: '', at: 0 };
      onOpenIdea(idea);
      return;
    }

    lastTapRef.current = { id: idea._id, at: now };
  };

  if (ideas.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ px: 0.5, py: 2 }}>
        Пока нет идей
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {ideas.map((idea) => {
        const doneCount = KAIF_LIFE_STAGE_KEYS.filter((key) => idea.stages[key]?.done).length;

        return (
          <Box
            key={idea._id}
            onDoubleClick={() => onOpenIdea(idea)}
            onPointerUp={(event) => handleCardClick(idea, event.pointerType)}
            sx={(muiTheme) => {
              const isLight = muiTheme.palette.mode === 'light';
              const restSurface = getPrimaryTintSurface(muiTheme);

              return {
                p: 2,
                borderRadius: `${SURFACE_BORDER_RADIUS}px`,
                border: `1px solid ${alpha(muiTheme.palette.primary.main, isLight ? 0.14 : 0.28)}`,
                boxShadow: isLight
                  ? `0 10px 28px ${alpha(muiTheme.palette.common.black, 0.06)}`
                  : `0 12px 32px ${alpha(muiTheme.palette.common.black, 0.32)}`,
                cursor: 'pointer',
                userSelect: 'none',
                ...restSurface,
                transition:
                  'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 320ms cubic-bezier(0.22, 1, 0.36, 1), background-color 320ms ease, border-color 320ms ease',
                '@media (hover: hover)': {
                  '&:hover': {
                    bgcolor: alpha(muiTheme.palette.primary.main, isLight ? 0.2 : 0.34),
                    borderColor: alpha(muiTheme.palette.primary.main, isLight ? 0.36 : 0.5),
                    transform: 'translateY(-4px)',
                    boxShadow: isLight
                      ? `0 16px 36px ${alpha(muiTheme.palette.common.black, 0.1)}`
                      : `0 18px 40px ${alpha(muiTheme.palette.common.black, 0.42)}`,
                  },
                },
              };
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 1.5 }}>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap', lineHeight: 1.3 }}
              >
                {idea.title.trim() || 'Без названия'}
              </Typography>
              <Box
                sx={{
                  flexShrink: 0,
                  px: 1,
                  py: 0.25,
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.16 : 0.28),
                  color: 'primary.main',
                  typography: 'caption',
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                {doneCount}/{KAIF_LIFE_STAGE_KEYS.length}
              </Box>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                gap: 0.75,
              }}
            >
              {KAIF_LIFE_STAGE_KEYS.map((key) => {
                const stage = idea.stages[key];
                const done = Boolean(stage?.done);
                const deadline = stage?.deadline ? format(new Date(stage.deadline), 'd.MM.yyyy') : null;

                return (
                  <Box
                    key={key}
                    sx={{
                      minWidth: 0,
                      px: 1,
                      py: 0.85,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: done
                        ? 'primary.main'
                        : alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.16 : 0.28),
                      bgcolor: done
                        ? alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.18 : 0.32)
                        : alpha(theme.palette.common.black, theme.palette.mode === 'light' ? 0.02 : 0.12),
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          flexShrink: 0,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: done ? 'primary.main' : 'transparent',
                          border: done ? 'none' : '1.5px solid',
                          borderColor: 'text.disabled',
                          color: 'primary.contrastText',
                        }}
                      >
                        {done && <CheckIcon sx={{ fontSize: 12 }} />}
                      </Box>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        noWrap
                        sx={{ color: done ? 'primary.main' : 'text.secondary' }}
                      >
                        {KAIF_LIFE_STAGE_LABELS[key]}
                      </Typography>
                    </Box>
                    {deadline && (
                      <Typography
                        variant="caption"
                        sx={{ display: 'block', mt: 0.35, color: 'text.secondary', lineHeight: 1.2 }}
                      >
                        {deadline}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default KaifLifeIdeaList;
