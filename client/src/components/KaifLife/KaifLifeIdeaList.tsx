import React, { useRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { alpha, lighten, useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import {
  AddIcon,
  CheckIcon,
  ChevronRightIcon,
  DeleteIcon,
  EditIcon,
  ExpandMoreIcon,
  KeyboardArrowDownIcon,
  KeyboardArrowUpIcon,
} from '../UI/icons';
import { SURFACE_BORDER_RADIUS, getPrimaryTintSurface } from '../../theme/surfaceStyles';
import {
  KAIF_LIFE_STAGE_KEYS,
  KAIF_LIFE_STAGE_LABELS,
  type KaifLifeGroup,
  type KaifLifeIdea,
  type KaifLifeMoveDirection,
} from './kaifLifeTypes';

interface KaifLifeIdeaListProps {
  groups: KaifLifeGroup[];
  ideas: KaifLifeIdea[];
  expandedByGroupId: Record<string, boolean>;
  moving?: boolean;
  onToggleGroup: (groupId: string) => void;
  onAddIdea: (group: KaifLifeGroup) => void;
  onEditGroup: (group: KaifLifeGroup) => void;
  onDeleteGroup: (group: KaifLifeGroup) => void;
  onMoveGroup: (group: KaifLifeGroup, direction: KaifLifeMoveDirection) => void;
  onMoveIdea: (idea: KaifLifeIdea, direction: KaifLifeMoveDirection) => void;
  onOpenIdea: (idea: KaifLifeIdea) => void;
}

const stopCardOpen = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

const KaifLifeIdeaCard: React.FC<{
  idea: KaifLifeIdea;
  canMoveUp: boolean;
  canMoveDown: boolean;
  moving?: boolean;
  onMove: (direction: KaifLifeMoveDirection) => void;
  onOpen: () => void;
}> = ({ idea, canMoveUp, canMoveDown, moving, onMove, onOpen }) => {
  const theme = useTheme();
  const lastTapRef = useRef<{ id: string; at: number }>({ id: '', at: 0 });
  const doneCount = KAIF_LIFE_STAGE_KEYS.filter((key) => idea.stages[key]?.done).length;
  const isLight = theme.palette.mode === 'light';
  const filledBadgeText = isLight
    ? theme.palette.primary.main
    : lighten(theme.palette.primary.main, 0.62);

  const handleCardClick = (pointerType: string) => {
    if (pointerType !== 'touch') {
      return;
    }

    const now = Date.now();
    if (lastTapRef.current.id === idea._id && now - lastTapRef.current.at < 350) {
      lastTapRef.current = { id: '', at: 0 };
      onOpen();
      return;
    }

    lastTapRef.current = { id: idea._id, at: now };
  };

  return (
    <Box
      onDoubleClick={onOpen}
      onPointerUp={(event) => handleCardClick(event.pointerType)}
      sx={(muiTheme) => {
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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
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
            bgcolor: alpha(theme.palette.primary.main, isLight ? 0.16 : 0.28),
            color: isLight ? 'primary.main' : filledBadgeText,
            typography: 'caption',
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          {doneCount}/{KAIF_LIFE_STAGE_KEYS.length}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', flexShrink: 0, mt: -0.5 }} onPointerUp={stopCardOpen}>
          <IconButton
            size="small"
            aria-label="Переместить идею вверх"
            disabled={moving || !canMoveUp}
            onClick={() => onMove('up')}
          >
            <KeyboardArrowUpIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Переместить идею вниз"
            disabled={moving || !canMoveDown}
            onClick={() => onMove('down')}
          >
            <KeyboardArrowDownIcon fontSize="small" />
          </IconButton>
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
          const inProgress = Boolean(stage?.inProgress) && !done;
          const deadline = stage?.deadline ? format(new Date(stage.deadline), 'd.MM.yyyy') : null;
          const filled = done || inProgress;

          return (
            <Box
              key={key}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                minWidth: 0,
                px: 1,
                py: 0.85,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: filled
                  ? 'primary.main'
                  : alpha(theme.palette.primary.main, isLight ? 0.16 : 0.28),
                bgcolor: done
                  ? alpha(theme.palette.primary.main, isLight ? 0.18 : 0.32)
                  : alpha(theme.palette.common.black, isLight ? 0.02 : 0.12),
              }}
            >
              {inProgress && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '50%',
                    bgcolor: alpha(theme.palette.primary.main, isLight ? 0.4 : 0.55),
                  }}
                />
              )}
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
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
                  sx={{ color: filled ? filledBadgeText : 'text.secondary' }}
                >
                  {KAIF_LIFE_STAGE_LABELS[key]}
                </Typography>
              </Box>
              {deadline && (
                <Typography
                  variant="caption"
                  sx={{
                    position: 'relative',
                    display: 'block',
                    mt: 0.35,
                    color: 'text.secondary',
                    lineHeight: 1.2,
                  }}
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
};

const KaifLifeIdeaList: React.FC<KaifLifeIdeaListProps> = ({
  groups,
  ideas,
  expandedByGroupId,
  moving,
  onToggleGroup,
  onAddIdea,
  onEditGroup,
  onDeleteGroup,
  onMoveGroup,
  onMoveIdea,
  onOpenIdea,
}) => {
  if (groups.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ px: 0.5, py: 2 }}>
        Пока нет групп. Нажмите +, чтобы создать.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {groups.map((group, groupIndex) => {
        const groupIdeas = ideas
          .filter((idea) => idea.groupId === group._id)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const expanded = expandedByGroupId[group._id] !== false;

        return (
          <Box key={group._id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box
              sx={(muiTheme) => ({
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.5,
                px: 0.5,
                py: 0.25,
                borderRadius: `${SURFACE_BORDER_RADIUS}px`,
                ...getPrimaryTintSurface(muiTheme, { tint: { light: 0.08, dark: 0.16 } }),
              })}
            >
              <IconButton
                size="small"
                onClick={() => onToggleGroup(group._id)}
                aria-label={expanded ? 'Свернуть группу' : 'Развернуть группу'}
                sx={{ mt: 0.15 }}
              >
                {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
              </IconButton>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflowWrap: 'anywhere',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.3,
                  pt: 0.7,
                }}
              >
                {group.title.trim() || 'Без названия'}
              </Typography>
              <Box sx={{ display: 'flex', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <IconButton
                  size="small"
                  aria-label="Переместить группу вверх"
                  disabled={moving || groupIndex === 0}
                  onClick={() => onMoveGroup(group, 'up')}
                >
                  <KeyboardArrowUpIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Переместить группу вниз"
                  disabled={moving || groupIndex === groups.length - 1}
                  onClick={() => onMoveGroup(group, 'down')}
                >
                  <KeyboardArrowDownIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Добавить идею в группу"
                  onClick={() => onAddIdea(group)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Изменить название группы"
                  onClick={() => onEditGroup(group)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Удалить группу"
                  onClick={() => onDeleteGroup(group)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {expanded && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: { xs: 0.5, sm: 1 } }}>
                {groupIdeas.length === 0 ? (
                  <Typography color="text.secondary" sx={{ px: 1, py: 0.5 }}>
                    Пока нет идей
                  </Typography>
                ) : (
                  groupIdeas.map((idea, ideaIndex) => {
                    const canMoveUp = !(groupIndex === 0 && ideaIndex === 0);
                    const canMoveDown = !(
                      groupIndex === groups.length - 1 && ideaIndex === groupIdeas.length - 1
                    );

                    return (
                      <KaifLifeIdeaCard
                        key={idea._id}
                        idea={idea}
                        canMoveUp={canMoveUp}
                        canMoveDown={canMoveDown}
                        moving={moving}
                        onMove={(direction) => onMoveIdea(idea, direction)}
                        onOpen={() => onOpenIdea(idea)}
                      />
                    );
                  })
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default KaifLifeIdeaList;
