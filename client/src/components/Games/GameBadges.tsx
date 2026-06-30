import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getBestBadgesByGame, getGameName, resolveDisplayBadge, type RelationshipBadge } from '../../utils/gameBadges';
import GameBadgeIcon from './GameBadgeIcon';
export { default as AvatarGameRankMedal } from './AvatarGameRankMedal';

export type { RelationshipBadge };

interface GameBadgesProps {
  badges?: RelationshipBadge[];
  /** null/undefined — автоматический выбор лучшей медали. */
  displayGameId?: string | null;
  variant?: 'single' | 'all' | 'list';
  size?: number;
  dense?: boolean;
}

const GameBadges: React.FC<GameBadgesProps> = ({
  badges = [],
  displayGameId,
  variant = 'single',
  size = 16,
  dense = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (variant === 'single') {
    const badge = resolveDisplayBadge(badges, displayGameId);
    if (!badge) {
      return null;
    }

    return (
      <Box component="span" sx={{ display: 'inline-flex', ml: 0.5, verticalAlign: 'middle' }}>
        <GameBadgeIcon badge={badge} size={size} />
      </Box>
    );
  }

  const visibleBadges = getBestBadgesByGame(badges);
  if (visibleBadges.length === 0) {
    return null;
  }

  if (variant === 'list') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: dense ? 0.625 : 1,
          width: '100%',
        }}
      >
        {visibleBadges.map((badge, index) => (
          <Box
            key={`${badge.gameId}-${badge.rank}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: dense ? 1 : 1.25,
              px: dense ? 0 : 1.5,
              py: dense ? 0.375 : 1,
              ...(dense
                ? index > 0 && {
                    pt: 0.75,
                    borderTop: `1px solid ${alpha(
                      theme.palette.primary.main,
                      theme.palette.mode === 'light' ? 0.1 : 0.16
                    )}`,
                  }
                : {
                    borderRadius: `${Math.round(theme.shape.borderRadius * 1.5)}px`,
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      theme.palette.mode === 'light' ? 0.12 : 0.2
                    )}`,
                    bgcolor: alpha(
                      theme.palette.primary.main,
                      theme.palette.mode === 'light' ? 0.08 : 0.14
                    ),
                  }),
              textAlign: 'left',
            }}
          >
            <GameBadgeIcon badge={badge} size={dense ? 20 : 24} showTooltip={false} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                lineHeight: 1.35,
                fontSize: dense ? '0.8125rem' : undefined,
              }}
            >
              {t('chat.profile.medalItem', {
                rank: badge.rank,
                game: getGameName(badge.gameId),
              })}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.75,
        verticalAlign: 'middle',
      }}
    >
      {visibleBadges.map((badge) => (
        <GameBadgeIcon key={`${badge.gameId}-${badge.rank}`} badge={badge} size={size + 4} />
      ))}
    </Box>
  );
};

export default GameBadges;
