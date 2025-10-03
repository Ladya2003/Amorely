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
import { ColorTheme } from './ColorPicker';

interface MilestoneCardProps {
  achievements: Achievement[];
  showAchievements: boolean;
  onToggle: () => void;
  daysUntilAnniversary: number | null;
  theme: ColorTheme;
  hasPhoto?: boolean;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({
  achievements,
  showAchievements,
  onToggle,
  daysUntilAnniversary,
  theme,
  hasPhoto = false
}) => {
  if (achievements.length === 0) return null;

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: hasPhoto ? 'rgba(255, 255, 255, 0.7)' : `${theme.colors[1].replace(/0\.\d+/, '0.1')}`,
        backdropFilter: hasPhoto ? 'blur(10px)' : 'none',
        border: `1px solid ${theme.colors[0].replace(/0\.\d+/, '0.3')}`
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
          <EmojiEventsIcon sx={{ color: theme.preview }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: hasPhoto ? 'text.primary' : theme.preview }}>
            Достижения
          </Typography>
          <Chip
            label={achievements.length}
            size="small"
            sx={{ 
              height: 20, 
              fontSize: '0.75rem',
              bgcolor: `${theme.colors[0].replace(/0\.\d+/, '0.2')}`,
              color: theme.preview,
              borderColor: theme.preview
            }}
          />
        </Box>
        <IconButton size="small" sx={{ color: hasPhoto ? 'text.primary' : theme.preview }}>
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
                  bgcolor: `${theme.colors[1].replace(/0\.\d+/, '0.15')}`,
                  border: `1px solid ${theme.colors[0].replace(/0\.\d+/, '0.3')}`,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 2,
                    bgcolor: `${theme.colors[1].replace(/0\.\d+/, '0.25')}`
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
                    lineHeight: 1.2,
                    color: hasPhoto ? 'text.primary' : theme.preview
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
              bgcolor: `${theme.colors[0].replace(/0\.\d+/, '0.1')}`,
              border: `1px dashed ${theme.colors[0].replace(/0\.\d+/, '0.5')}`,
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" sx={{ color: hasPhoto ? 'text.secondary' : `${theme.preview}CC` }} gutterBottom>
              ⏳ До следующей годовщины:
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ color: theme.preview }}>
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

