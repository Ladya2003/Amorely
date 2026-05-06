import React from 'react';
import { 
  List, 
  ListItemButton,
  ListItemAvatar, 
  Avatar, 
  Typography, 
  Box,
  ListItemText
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ImageIcon from '@mui/icons-material/Image';
import PushPinIcon from '@mui/icons-material/PushPin';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ScheduleIcon from '@mui/icons-material/Schedule';

export interface Contact {
  id: string;
  isPartner?: boolean;
  name: string;
  avatar: string;
  username?: string;
  email?: string;
  unreadCount?: number;
  lastMessage: {
    id?: string;
    senderId?: string;
    text: string;
    timestamp: string;
    isRead: boolean;
    isPending?: boolean;
    hasMedia?: boolean; // Флаг наличия медиафайлов
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
  const formatLastMessageTimestamp = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();

    const isToday =
      messageDate.getFullYear() === now.getFullYear() &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getDate() === now.getDate();

    if (isToday) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return messageDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
      {contacts.map((contact, index) => (
        <React.Fragment key={contact.id}>
          {(() => {
            const hasUnreadIncoming = (contact.unreadCount || 0) > 0;
            return (
          <StyledListItemButton 
            alignItems="flex-start" 
            selected={selectedContactId === contact.id}
            onClick={() => onSelectContact(contact.id)}
            sx={{ py: 0.5 }}
          >
            <ListItemAvatar>
              <Avatar 
                alt={contact.name} 
                src={contact.avatar} 
                sx={{ 
                  width: 50, 
                  height: 50,
                  border: hasUnreadIncoming ? '2px solid #ff4b8d' : 'none'
                }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" component="span">
                    {contact.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                    {renderLastMessageStatusIcon(contact)}
                    <Typography variant="caption" color="text.secondary">
                      {formatLastMessageTimestamp(contact.lastMessage.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              }
              secondary={
                contact.lastMessage.hasMedia ? (
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
                        Медиафайл
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
        </React.Fragment>
      ))}
    </List>
  );
};

export default ChatList; 