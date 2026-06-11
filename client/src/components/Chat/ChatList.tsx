import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  List, 
  ListItemButton,
  ListItemAvatar, 
  Avatar, 
  Typography, 
  Box,
  ListItemText,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import BlockIcon from '@mui/icons-material/Block';
import ImageIcon from '@mui/icons-material/Image';
import PushPinIcon from '@mui/icons-material/PushPin';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { getOnlinePresenceColor } from '../UI/CustomSnackbar';
import GameBadges from '../Games/GameBadges';
import { useRelationshipBadges } from '../../hooks/useRelationshipBadges';
import { formatChatListTimestamp } from '../../localization/chatHelpers';

export interface Contact {
  id: string;
  isPartner?: boolean;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  bio?: string;
  birthday?: string | null;
  avatar: string;
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

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  '&.Mui-selected': {
    backgroundColor: theme.palette.action.selected,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const ChatList: React.FC<ChatListProps> = ({ contacts, onSelectContact, selectedContactId, currentUserId }) => {
  const { t, i18n } = useTranslation();
  const { badges, partnerDisplayBadgeGameId } = useRelationshipBadges();
  const formatLastMessageTimestamp = (timestamp: string) =>
    formatChatListTimestamp(timestamp, i18n.language);

  const renderContactIndicators = (contact: Contact) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
      {(contact.unreadCount || 0) > 0 && (
        <Box
          sx={{
            minWidth: 18,
            height: 18,
            px: 0.5,
            borderRadius: '999px',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            lineHeight: 1
          }}
        >
          {contact.unreadCount! > 99 ? '99+' : contact.unreadCount}
        </Box>
      )}
      {contact.isPartner && (
        <PushPinIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
      )}
    </Box>
  );

  const renderLastMessageStatusIcon = (contact: Contact) => {
    const isOwnLastMessage = contact.lastMessage.senderId === currentUserId;
    if (!isOwnLastMessage) return null;

    if (contact.lastMessage.isPending) {
      return <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />;
    }

    if (contact.lastMessage.isRead) {
      return <DoneAllIcon sx={{ fontSize: 15, color: 'text.secondary' }} />;
    }

    return <DoneIcon sx={{ fontSize: 15, color: 'text.secondary' }} />;
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'transparent', p: 0 }}>
      {contacts.map((contact, index) => (
        <React.Fragment key={contact.id}>
          {(() => {
            const hasUnreadIncoming = (contact.unreadCount || 0) > 0;
            return (
          <StyledListItemButton 
            alignItems="flex-start" 
            selected={selectedContactId === contact.id}
            onClick={() => onSelectContact(contact.id)}
            sx={{
              py: 0.5,
              opacity: contact.isBlocked ? 0.72 : 1,
            }}
          >
            <ListItemAvatar>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <Avatar 
                  alt={contact.name} 
                  src={contact.avatar} 
                  sx={{ 
                    width: 50, 
                    height: 50
                  }}
                />
                {contact.isOnline && (
                  <Box
                    sx={(theme) => ({
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: getOnlinePresenceColor(theme),
                      border: `2px solid ${theme.palette.background.paper}`,
                      boxSizing: 'border-box',
                    })}
                  />
                )}
              </Box>
            </ListItemAvatar>
            <ListItemText
              secondaryTypographyProps={{ component: 'div' }}
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
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
                      {contact.name}
                    </Typography>
                    {contact.isPartner && (
                      <Box component="span" sx={{ flexShrink: 0, display: 'inline-flex' }}>
                        <GameBadges
                          badges={badges}
                          displayGameId={partnerDisplayBadgeGameId}
                          size={22}
                        />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, flexShrink: 0 }}>
                    {renderLastMessageStatusIcon(contact)}
                    <Typography variant="caption" color="text.secondary">
                      {formatLastMessageTimestamp(contact.lastMessage.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              }
              secondary={
                contact.isBlocked ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                      <ImageIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography
                        sx={{ 
                          display: 'inline', 
                          fontWeight: hasUnreadIncoming ? 'bold' : 'normal',
                          fontStyle: 'italic'
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
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography
                      sx={{ 
                        display: 'inline', 
                        fontWeight: hasUnreadIncoming ? 'bold' : 'normal',
                        minWidth: 0
                      }}
                      component="span"
                      variant="body2"
                      color="text.primary"
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
          </StyledListItemButton>
            );
          })()}
          {index < contacts.length - 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', px: 2 }}>
              <Divider
                sx={(theme) => ({
                  width: '80%',
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.08)',
                })}
              />
            </Box>
          )}
        </React.Fragment>
      ))}
    </List>
  );
};

export default ChatList; 