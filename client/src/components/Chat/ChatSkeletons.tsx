import React from 'react';
import { Box, IconButton, Skeleton, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getChatDialogBackdropSx } from '../Feed/feedBannerStyles';
import {
  CHAT_LIST_ITEM_RADIUS,
  getChatListItemButtonSx,
  getChatListStackSx,
} from './chatListStyles';
import {
  CHAT_DIALOG_INNER_RADIUS,
  getChatDialogHeaderSx,
  getChatDialogHeaderWrapSx,
  getChatDialogMessagesAreaSx,
} from './chatDialogStyles';
import { ArrowBackIcon } from '../UI/icons';

const CONTACT_ROW_COUNT = 6;

/** Скелетон одной строки списка чатов */
const ChatListItemSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        ...getChatListItemButtonSx(theme),
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        cursor: 'default',
        pointerEvents: 'none',
        '&:hover': { transform: 'none' },
      }}
    >
      <Skeleton variant="circular" animation="wave" width={52} height={52} sx={{ flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 0.75 }}>
          <Skeleton variant="text" animation="wave" width="48%" height={22} />
          <Skeleton variant="text" animation="wave" width={36} height={16} />
        </Box>
        <Skeleton variant="text" animation="wave" width="72%" height={18} />
      </Box>
    </Box>
  );
};

/** Скелетон списка всех чатов */
export const ChatListSkeleton: React.FC = () => (
  <Box sx={getChatListStackSx()} aria-busy="true">
    {Array.from({ length: CONTACT_ROW_COUNT }, (_, index) => (
      <ChatListItemSkeleton key={index} />
    ))}
  </Box>
);

const MESSAGE_SKELETONS: Array<{ own: boolean; width: string; height: number }> = [
  { own: false, width: '68%', height: 52 },
  { own: true, width: '54%', height: 44 },
  { own: false, width: '76%', height: 64 },
  { own: true, width: '42%', height: 40 },
  { own: false, width: '58%', height: 48 },
  { own: true, width: '70%', height: 56 },
  { own: false, width: '46%', height: 40 },
  { own: true, width: '62%', height: 48 },
];

/** Скелетон пузырей в области сообщений */
export const ChatMessagesSkeleton: React.FC = () => (
  <Box
    aria-busy="true"
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      gap: 1.25,
      minHeight: '100%',
      py: 1,
      px: 0.5,
    }}
  >
    {MESSAGE_SKELETONS.map((item, index) => (
      <Box
        key={index}
        sx={{
          display: 'flex',
          justifyContent: item.own ? 'flex-end' : 'flex-start',
        }}
      >
        <Skeleton
          variant="rounded"
          animation="wave"
          width={item.width}
          height={item.height}
          sx={{
            borderRadius: item.own ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
            maxWidth: 320,
          }}
        />
      </Box>
    ))}
  </Box>
);

interface ChatDialogLoadingSkeletonProps {
  onBack?: () => void;
}

/**
 * Полный скелетон диалога, пока контакт ещё не резолвился
 * (хедер + сообщения).
 */
export const ChatDialogLoadingSkeleton: React.FC<ChatDialogLoadingSkeletonProps> = ({
  onBack,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box
      aria-busy="true"
      sx={(muiTheme) => ({
        ...getChatDialogBackdropSx(muiTheme, { containGlow: true }),
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      })}
    >
      <Box sx={getChatDialogHeaderWrapSx()}>
        <Box sx={getChatDialogHeaderSx(theme)}>
          {onBack && (
            <IconButton edge="start" onClick={onBack} sx={{ mr: 1 }} aria-label={t('common.back')}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Skeleton variant="circular" animation="wave" width={44} height={44} sx={{ mr: 1.25 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" animation="wave" width="46%" height={22} />
            <Skeleton variant="text" animation="wave" width="28%" height={16} />
          </Box>
          <Skeleton
            variant="rounded"
            animation="wave"
            width={72}
            height={28}
            sx={{ borderRadius: `${CHAT_DIALOG_INNER_RADIUS}px` }}
          />
        </Box>
      </Box>

      <Box sx={getChatDialogMessagesAreaSx()}>
        <ChatMessagesSkeleton />
      </Box>

      <Box sx={{ px: 1.5, py: 1.25, flexShrink: 0 }}>
        <Skeleton
          variant="rounded"
          animation="wave"
          height={48}
          sx={{ borderRadius: `${CHAT_LIST_ITEM_RADIUS}px` }}
        />
      </Box>
    </Box>
  );
};
