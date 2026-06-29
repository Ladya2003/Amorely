import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getDaysWord } from '../utils/helpers';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Achievement } from '../types';
import { ColorTheme } from './ColorPicker';
import {
  DAYS_TOGETHER_ACTION_RADIUS,
  getDaysTogetherAchievementItemSx,
  getDaysTogetherChipSx,
  getDaysTogetherInnerSurfaceSx,
} from '../daysTogetherStyles';

interface MilestoneCardProps {
  achievements: Achievement[];
  showAchievements: boolean;
  onToggle: () => void;
  daysUntilAnniversary: number | null;
  theme: ColorTheme;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({
  achievements,
  showAchievements,
  onToggle,
  daysUntilAnniversary,
  theme: colorTheme,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (achievements.length === 0) return null;

  return (
    <Box sx={{ mt: 2, ...getDaysTogetherInnerSurfaceSx(theme) }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <EmojiEventsIcon sx={{ color: colorTheme.preview, flexShrink: 0 }} />
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {t('feed.achievementsTitle')}
          </Typography>
          <Chip
            label={achievements.length}
            size="small"
            sx={{
              ...getDaysTogetherChipSx(theme, colorTheme),
              height: 22,
              fontSize: '0.75rem',
            }}
          />
        </Box>
        <IconButton size="small" sx={{ color: 'text.primary', flexShrink: 0 }}>
          {showAchievements ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={showAchievements}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
            gap: 1,
            mt: 1.5,
          }}
        >
          {achievements.map((achievement) => (
            <Tooltip key={achievement.id} title={achievement.description} arrow>
              <Box sx={getDaysTogetherAchievementItemSx(theme, colorTheme)}>
                <Typography variant="h5" sx={{ mb: 0.5, lineHeight: 1 }}>
                  {achievement.icon}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{
                    display: 'block',
                    fontSize: '0.7rem',
                    lineHeight: 1.25,
                    color: 'text.primary',
                  }}
                >
                  {achievement.title}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>

        {daysUntilAnniversary !== null && daysUntilAnniversary > 0 && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: `${DAYS_TOGETHER_ACTION_RADIUS}px`,
              border: `1px dashed ${alpha(colorTheme.preview, 0.4)}`,
              bgcolor: alpha(colorTheme.preview, theme.palette.mode === 'light' ? 0.06 : 0.12),
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('feed.untilAnniversary')}
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: colorTheme.preview }}>
              {daysUntilAnniversary} {getDaysWord(daysUntilAnniversary, t)}
            </Typography>
          </Box>
        )}
      </Collapse>
    </Box>
  );
};

export default MilestoneCard;
