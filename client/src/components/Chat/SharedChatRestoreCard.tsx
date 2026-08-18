import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import type { SharedChatRestoreRef } from './ChatDialog';
import { LockResetIcon } from '../UI/icons';

interface SharedChatRestoreCardProps {
  sharedChatRestore: SharedChatRestoreRef;
  isOwn: boolean;
  contactName: string;
  onAction?: () => void;
}

const SharedChatRestoreCard: React.FC<SharedChatRestoreCardProps> = ({
  sharedChatRestore,
  isOwn,
  contactName,
  onAction
}) => {
  const { t } = useTranslation();
  const isPending = sharedChatRestore.status === 'pending';
  const ownColor = isOwn ? 'rgba(255,255,255,0.95)' : 'text.primary';
  const mutedColor = isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary';

  const statusLabel = (() => {
    switch (sharedChatRestore.status) {
      case 'completed':
        return t('chat.restore.cardCompleted');
      case 'failed':
        return t('chat.restore.cardFailed');
      case 'pending':
        return t('chat.restore.cardPending');
      default: {
        const _never: never = sharedChatRestore.status;
        return _never;
      }
    }
  })();

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: isOwn ? 'rgba(255,255,255,0.25)' : 'divider',
        bgcolor: isOwn ? 'rgba(255,255,255,0.12)' : 'action.hover',
        maxWidth: 300,
        p: 1.25
      }}
    >
      <Box
        sx={{
          width: 40,
          minWidth: 40,
          height: 40,
          borderRadius: '12px',
          bgcolor: isOwn ? 'rgba(255,255,255,0.1)' : 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <LockResetIcon
          sx={{
            fontSize: 22,
            color: isOwn ? 'rgba(255,255,255,0.75)' : 'primary.main'
          }}
        />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 600,
            color: isOwn ? 'rgba(255,255,255,0.85)' : 'primary.main',
            mb: 0.25
          }}
        >
          {t('chat.restore.cardTitle')}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: ownColor,
            lineHeight: 1.35
          }}
        >
          {isOwn
            ? t('chat.restore.cardBodySelf')
            : t('chat.restore.cardBody', { name: contactName })}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            color: mutedColor
          }}
        >
          {statusLabel}
        </Typography>
        {isPending && (
          <Button
            size="small"
            variant={isOwn ? 'outlined' : 'contained'}
            color={isOwn ? 'inherit' : 'primary'}
            onClick={onAction}
            sx={{ mt: 1, textTransform: 'none' }}
          >
            {t('chat.restore.cardAction')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default SharedChatRestoreCard;
