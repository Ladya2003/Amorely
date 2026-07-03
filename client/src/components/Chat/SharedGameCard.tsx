import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import type { SharedGameRef } from './ChatDialog';

interface SharedGameCardProps {
  sharedGame: SharedGameRef;
  isOwn?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

const SharedGameCard: React.FC<SharedGameCardProps> = ({
  sharedGame,
  isOwn = false,
  compact = false,
  onClick,
}) => {
  const { t } = useTranslation();
  const hasImage = Boolean(sharedGame.imageUrl?.trim());

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        gap: 1,
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: isOwn ? 'rgba(255,255,255,0.25)' : 'divider',
        bgcolor: isOwn ? 'rgba(255,255,255,0.12)' : 'action.hover',
        cursor: onClick ? 'pointer' : 'default',
        maxWidth: compact ? '100%' : 280,
      }}
    >
      <Box
        sx={{
          width: compact ? 56 : 72,
          minWidth: compact ? 56 : 72,
          height: compact ? 56 : 72,
          bgcolor: isOwn ? 'rgba(255,255,255,0.1)' : 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          pointerEvents: 'none',
        }}
      >
        {hasImage ? (
          <Box
            component="img"
            src={sharedGame.imageUrl}
            alt=""
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <SportsEsportsIcon
            sx={{
              fontSize: compact ? 24 : 28,
              color: isOwn ? 'rgba(255,255,255,0.6)' : 'text.disabled',
            }}
          />
        )}
      </Box>
      <Box sx={{ py: 0.75, pr: 1, minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 600,
            color: isOwn ? 'rgba(255,255,255,0.85)' : 'primary.main',
            mb: 0.25,
          }}
        >
          {t('chat.game.label')}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: isOwn ? 'rgba(255,255,255,0.95)' : 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3,
          }}
        >
          {sharedGame.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.25,
            color: isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary',
          }}
        >
          {t('chat.game.joinHint')}
        </Typography>
      </Box>
    </Box>
  );
};

export default SharedGameCard;
