import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ListItemButton,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  ListItemText,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import BlockIcon from '@mui/icons-material/Block';
import ImageIcon from '@mui/icons-material/Image';
import { AppPinIcon } from '../UI/AppIcons';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { getOnlinePresenceColor } from '../UI/CustomSnackbar';
import AvatarGameRankMedal from '../Games/AvatarGameRankMedal';
import type { RelationshipBadge } from '../../utils/gameBadges';
import { formatChatListTimestamp } from '../../localization/chatHelpers';
import { getContactDisplayName } from '../../utils/contactDisplayName';
import {
  getChatListAvatarSx,
  getChatListItemButtonSx,
  getChatListStackSx,
  getChatListUnreadBadgeSx,
} from './chatListStyles';

export interface Contact {
  id: string;
  isPartner?: boolean;
  role?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  bio?: string;
  birthday?: string | null;
  avatar: string;
  badges?: RelationshipBadge[];
  displayBadgeGameId?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
  unreadCount?: number;
  isBlocked?: boolean;
  blockedByMe?: boolean;
  blockedByPeer?: boolean;
  lastMessage: {
    id?: string;
    senderId?: string;
    text: string;
    timestamp: string;
    isRead: boolean;
    isPending?: boolean;
    hasMedia?: boolean;
    encryptedPayload?: {
      version: number;
      algorithm: string;
      ciphertext: string;
      iv: string;
      senderDeviceId: string;
    };
    attachments?: Array<{
      type: 'image' | 'video' | 'encrypted';
      url: string;
      publicId?: string;
      encrypted?: boolean;
    }>;
  };
}

interface ChatListProps {
  contacts: Contact[];
  onSelectContact: (contactId: string) => void;
  selectedContactId: string | null;
  currentUserId: string;
}

const ChatList: React.FC<ChatListProps> = ({ contacts, onSelectContact, selectedContactId, currentUserId }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const formatLastMessageTimestamp = (timestamp: string) =>
    formatChatListTimestamp(timestamp, i18n.language);

  const renderContactIndicators = (contact: Contact) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
      {(contact.unreadCount || 0) > 0 && (
        <Box sx={getChatListUnreadBadgeSx(theme)}>
          {contact.unreadCount! > 99 ? '99+' : contact.unreadCount}
        </Box>
      )}
      {contact.isPartner && <AppPinIcon sx={{ fontSize: 15, color: 'text.secondary' }} />}
    </Box>
  );

  const renderLastMessageStatusIcon = (contact: Contact) => {
    const isOwnLastMessage = contact.lastMessage.senderId === currentUserId;
    if (!isOwnLastMessage) return null;

    if (contact.lastMessage.isPending) {
      return <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />;
    }

    if (contact.lastMessage.isRead) {
      return <DoneAllIcon sx={{ fontSize: 15, color: 'primary.main' }} />;
    }

    return <DoneIcon sx={{ fontSize: 15, color: 'text.secondary' }} />;
  };

  if (contacts.length === 0) {
    return null;
  }

  return (
    <Box sx={getChatListStackSx()}>
      {contacts.map((contact) => {
        const hasUnreadIncoming = (contact.unreadCount || 0) > 0;
        const displayName = getContactDisplayName(contact, t('chat.systemMessages'));
        const isSelected = selectedContactId === contact.id;

        return (
          <ListItemButton
            key={contact.id}
            alignItems="flex-start"
            selected={isSelected}
            onClick={() => onSelectContact(contact.id)}
            sx={{
              ...getChatListItemButtonSx(theme, isSelected),
              opacity: contact.isBlocked ? 0.72 : 1,
            }}
          >
            <ListItemAvatar sx={{ minWidth: 64, mt: 0.25 }}>
              <AvatarGameRankMedal
                badges={contact.badges}
                displayGameId={contact.displayBadgeGameId}
                avatarSize={52}
              >
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <Avatar alt={displayName} src={contact.avatar} sx={getChatListAvatarSx()} />
                  {contact.isOnline && (
                    <Box
                      sx={(muiTheme) => ({
                        position: 'absolute',
                        bottom: 1,
                        right: 1,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: getOnlinePresenceColor(muiTheme),
                        border: `2px solid ${alpha(
                          muiTheme.palette.primary.main,
                          muiTheme.palette.mode === 'light' ? 0.12 : 0.2
                        )}`,
                        boxSizing: 'border-box',
                      })}
                    />
                  )}
                </Box>
              </AvatarGameRankMedal>
            </ListItemAvatar>
            <ListItemText
              secondaryTypographyProps={{ component: 'div' }}
              primary={
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 0.75,
                    minWidth: 0,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      minWidth: 0,
                      maxWidth: '100%',
                      flex: 1,
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      component="span"
                      noWrap
                      sx={{
                        fontWeight: hasUnreadIncoming ? 700 : 600,
                        minWidth: 0,
                        flexShrink: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {displayName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, flexShrink: 0 }}>
                    {renderLastMessageStatusIcon(contact)}
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {formatLastMessageTimestamp(contact.lastMessage.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              }
              secondary={
                contact.isBlocked ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      mt: 0.25,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                      <BlockIcon sx={{ fontSize: 16, color: 'error.main' }} />
                      <Typography
                        component="span"
                        variant="body2"
                        color="error.main"
                        noWrap
                        sx={{ fontStyle: 'italic' }}
                      >
                        {contact.blockedByMe
                          ? t('chat.list.blockedByYou')
                          : t('chat.list.blockedByPeer')}
                      </Typography>
                    </Box>
                    {renderContactIndicators(contact)}
                  </Box>
                ) : contact.lastMessage.hasMedia ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      mt: 0.25,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                      <ImageIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography
                        sx={{
                          display: 'inline',
                          fontWeight: hasUnreadIncoming ? 700 : 500,
                          fontStyle: 'italic',
                        }}
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        noWrap
                      >
                        {t('chat.message.media')}
                      </Typography>
                    </Box>
                    {renderContactIndicators(contact)}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      mt: 0.25,
                    }}
                  >
                    <Typography
                      sx={{
                        display: 'inline',
                        fontWeight: hasUnreadIncoming ? 700 : 500,
                        minWidth: 0,
                      }}
                      component="span"
                      variant="body2"
                      color={hasUnreadIncoming ? 'text.primary' : 'text.secondary'}
                      noWrap
                    >
                      {contact.lastMessage.text.length > 40
                        ? `${contact.lastMessage.text.substring(0, 40)}...`
                        : contact.lastMessage.text}
                    </Typography>
                    {renderContactIndicators(contact)}
                  </Box>
                )
              }
            />
          </ListItemButton>
        );
      })}
    </Box>
  );
};

export default ChatList;
