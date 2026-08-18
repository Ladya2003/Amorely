import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, IconButton, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { MessageType } from './ChatDialog';
import { CloseIcon, LockResetIcon } from '../UI/icons';
import {
  CHAT_DIALOG_ACTION_RADIUS,
  CHAT_DIALOG_INNER_RADIUS,
  getChatDialogHeaderWrapSx,
} from './chatDialogStyles';
import { getPrimaryTintSurface } from '../Feed/feedBannerStyles';

const bannerStorageKey = (selfId: string, peerId: string) =>
  `amorely:chat-history-restore-banner:${selfId}:${peerId}`;

interface ChatHistoryRestoreBannerProps {
  contactId: string;
  contactRole?: string;
  currentUserId: string;
  messages: MessageType[];
  onRequestRestore: () => void;
}

const ChatHistoryRestoreBanner: React.FC<ChatHistoryRestoreBannerProps> = ({
  contactId,
  contactRole,
  currentUserId,
  messages,
  onRequestRestore
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const storageKey = bannerStorageKey(currentUserId, contactId);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey) === '1');

  const shouldShow = useMemo(() => {
    if (contactRole === 'system' || dismissed) {
      return false;
    }

    const hasPendingRequest = messages.some(
      (message) => message.sharedChatRestore?.status === 'pending'
    );
    if (hasPendingRequest) {
      return false;
    }

    const decryptFailedText = t('chat.message.decryptFailed');
    return messages.some(
      (message) => Boolean(message.encryptedPayload) && message.text === decryptFailedText
    );
  }, [contactRole, dismissed, messages, t]);

  if (!shouldShow) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(storageKey, '1');
    setDismissed(true);
  };

  return (
    <Box sx={{ ...getChatDialogHeaderWrapSx(), pt: 0.5, pb: 0 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          px: 1.25,
          py: 1.1,
          borderRadius: `${CHAT_DIALOG_INNER_RADIUS}px`,
          border: `1px solid ${alpha(
            theme.palette.primary.main,
            theme.palette.mode === 'light' ? 0.14 : 0.24
          )}`,
          ...getPrimaryTintSurface(theme, {
            tint: { light: 0.12, dark: 0.22 }
          }),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              minWidth: 32,
              height: 32,
              borderRadius: `${CHAT_DIALOG_ACTION_RADIUS}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.22),
              color: 'primary.main',
              mt: 0.15,
            }}
          >
            <LockResetIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography
            variant="body2"
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: '0.8125rem',
              lineHeight: 1.4,
              color: 'text.primary',
              pt: 0.35,
            }}
          >
            {t('chat.restore.banner')}
          </Typography>
          <IconButton
            size="small"
            onClick={handleDismiss}
            aria-label={t('chat.restore.bannerClose')}
            sx={{
              mt: -0.25,
              mr: -0.5,
              color: 'text.secondary',
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
        <Button
          size="small"
          variant="contained"
          onClick={onRequestRestore}
          sx={{
            alignSelf: 'stretch',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: `${CHAT_DIALOG_ACTION_RADIUS}px`,
          }}
        >
          {t('chat.restore.bannerAction')}
        </Button>
      </Box>
    </Box>
  );
};

export default ChatHistoryRestoreBanner;
