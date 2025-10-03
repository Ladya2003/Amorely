// Карточка достижений и вех

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Achievement } from '../types';

interface MilestoneCardProps {
  achievements: Achievement[];
  showAchievements: boolean;
  onToggle: () => void;
  daysUntilAnniversary: number | null;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({
  achievements,
  showAchievements,
  onToggle,
  daysUntilAnniversary
}) => {
  if (achievements.length === 0) return null;

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 75, 141, 0.2)'
      }}
    >
      {/* Заголовок с кнопкой разворачивания */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={onToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            Достижения
          </Typography>
          <Chip
            label={achievements.length}
            size="small"
            color="primary"
            sx={{ height: 20, fontSize: '0.75rem' }}
          />
        </Box>
        <IconButton size="small">
          {showAchievements ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Список достижений */}
      <Collapse in={showAchievements}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
            gap: 1,
            mt: 1
          }}
        >
          {achievements.map((achievement) => (
            <Tooltip key={achievement.id} title={achievement.description} arrow>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'rgba(255, 182, 193, 0.2)',
                  border: '1px solid rgba(255, 75, 141, 0.3)',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 2
                  }
                }}
              >
                <Typography variant="h4" sx={{ mb: 0.5 }}>
                  {achievement.icon}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  sx={{
                    display: 'block',
                    fontSize: '0.7rem',
                    lineHeight: 1.2
                  }}
                >
                  {achievement.title}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>

        {/* Обратный отсчет до годовщины */}
        {daysUntilAnniversary !== null && daysUntilAnniversary > 0 && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'rgba(255, 215, 0, 0.1)',
              border: '1px dashed rgba(255, 215, 0, 0.5)',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ⏳ До следующей годовщины:
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {daysUntilAnniversary} {getDaysWord(daysUntilAnniversary)}
            </Typography>
          </Box>
        )}
      </Collapse>
    </Box>
  );
};

// Вспомогательная функция для локализации
const getDaysWord = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastDigit === 1 && lastTwoDigits !== 11) return 'день';
  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) return 'дня';
  return 'дней';
};

export default MilestoneCard;

