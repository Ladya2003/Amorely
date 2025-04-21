import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  TextField, 
  Avatar, 
  Paper,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { Contact } from './ChatList';
import Message from './Message';

export interface MessageType {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  attachments?: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
}

interface ChatDialogProps {
  contact: Contact | null;
  messages: MessageType[];
  currentUserId: string;
  onBack: () => void;
  onSendMessage: (text: string, attachments?: File[]) => void;
  isLoading?: boolean;
}

const ChatDialog: React.FC<ChatDialogProps> = ({ 
  contact, 
  messages, 
  currentUserId, 
  onBack, 
  onSendMessage,
  isLoading = false
}) => {
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (messageText.trim() || attachments.length > 0) {
      onSendMessage(messageText, attachments);
      setMessageText('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  if (!contact) return null;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      bgcolor: 'background.paper' 
    }}>
      {/* Заголовок чата */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 1, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        <IconButton edge="start" onClick={onBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar 
          alt={contact.name} 
          src={contact.avatar} 
          sx={{ width: 40, height: 40, mr: 2 }}
        />
        <Typography variant="h6" noWrap>
          {contact.name}
        </Typography>
      </Box>

      {/* Область сообщений */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        bgcolor: '#f5f5f5'
      }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <Message 
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                contactName={contact.name}
                contactAvatar={contact.avatar}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Область ввода сообщения */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        {attachments.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            mb: 2,
            maxHeight: '100px',
            overflow: 'auto'
          }}>
            {attachments.map((file, index) => (
              <Box 
                key={index}
                sx={{ 
                  position: 'relative',
                  width: 60,
                  height: 60,
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                {file.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`Attachment ${index}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'action.hover'
                    }}
                  >
                    <Typography variant="caption">
                      {file.name.split('.').pop()?.toUpperCase()}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Введите сообщение..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleAttachmentClick}>
                  <AttachFileIcon />
                </IconButton>
                <IconButton>
                  <EmojiEmotionsIcon />
                </IconButton>
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() && attachments.length === 0}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mt: 1 }}
        />
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </Paper>
    </Box>
  );
};

export default ChatDialog; 