import React from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { MessageType } from './ChatDialog';

interface MessageProps {
  message: MessageType;
  isOwn: boolean;
  contactName: string;
  contactAvatar: string;
}

const Message: React.FC<MessageProps> = ({ message, isOwn, contactName, contactAvatar }) => {
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 1.5
      }}
    >
      {!isOwn && (
        <Avatar 
          alt={contactName} 
          src={contactAvatar} 
          sx={{ width: 36, height: 36, mr: 1, mt: 0.5 }}
        />
      )}
      <Box sx={{ maxWidth: '70%' }}>
        <Paper 
          elevation={1} 
          sx={{ 
            p: 1.5, 
            borderRadius: 2,
            bgcolor: isOwn ? 'primary.light' : 'background.paper',
            color: isOwn ? 'white' : 'text.primary',
            borderTopRightRadius: isOwn ? 0 : 2,
            borderTopLeftRadius: isOwn ? 2 : 0,
          }}
        >
          {message.attachments && message.attachments.length > 0 && (
            <Box sx={{ mb: message.text ? 1 : 0 }}>
              {message.attachments.map((attachment, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    mb: 1,
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  {attachment.type === 'image' ? (
                    <img 
                      src={attachment.url} 
                      alt="Attachment" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px',
                        display: 'block'
                      }} 
                    />
                  ) : (
                    <video 
                      src={attachment.url} 
                      controls 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px',
                        display: 'block'
                      }} 
                    />
                  )}
                </Box>
              ))}
            </Box>
          )}
          
          {message.text && (
            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
              {message.text}
            </Typography>
          )}
        </Paper>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            display: 'block', 
            textAlign: isOwn ? 'right' : 'left',
            mt: 0.5,
            mr: isOwn ? 0.5 : 0,
            ml: isOwn ? 0 : 0.5
          }}
        >
          {formattedTime}
        </Typography>
      </Box>
    </Box>
  );
};

export default Message; 