import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton,
  ListItemAvatar, 
  Avatar, 
  Typography, 
  Divider,
  Box,
  ListItemText
} from '@mui/material';
import { styled } from '@mui/material/styles';

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: {
    text: string;
    timestamp: string;
    isRead: boolean;
  };
}

interface ChatListProps {
  contacts: Contact[];
  onSelectContact: (contactId: string) => void;
  selectedContactId: string | null;
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

const ChatList: React.FC<ChatListProps> = ({ contacts, onSelectContact, selectedContactId }) => {
  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
      {contacts.map((contact, index) => (
        <React.Fragment key={contact.id}>
          <StyledListItemButton 
            alignItems="flex-start" 
            selected={selectedContactId === contact.id}
            onClick={() => onSelectContact(contact.id)}
            sx={{ py: 1.5 }}
          >
            <ListItemAvatar>
              <Avatar 
                alt={contact.name} 
                src={contact.avatar} 
                sx={{ 
                  width: 50, 
                  height: 50,
                  border: contact.lastMessage.isRead ? 'none' : '2px solid #ff4b8d'
                }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" component="span">
                    {contact.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(contact.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              }
              secondary={
                <Typography
                  sx={{ display: 'inline', fontWeight: contact.lastMessage.isRead ? 'normal' : 'bold' }}
                  component="span"
                  variant="body2"
                  color="text.primary"
                  noWrap
                >
                  {contact.lastMessage.text.length > 40 
                    ? `${contact.lastMessage.text.substring(0, 40)}...` 
                    : contact.lastMessage.text}
                </Typography>
              }
            />
          </StyledListItemButton>
          {index < contacts.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default ChatList; 