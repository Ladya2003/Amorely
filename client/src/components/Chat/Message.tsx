import React, { useMemo, useState } from 'react';
import { Box, Typography, Avatar, Paper, Dialog, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { MessageType } from './ChatDialog';

interface MessageProps {
  message: MessageType;
  isOwn: boolean;
  contactName: string;
  contactAvatar: string;
  mb?: number;
}

const Message: React.FC<MessageProps> = ({ message, isOwn, contactName, contactAvatar, mb = 0.75 }) => {
  const [openImage, setOpenImage] = useState<string | null>(null);
  
  const formattedTime = useMemo(() => (
    new Date(message.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  ), [message.timestamp]);

  const handleImageClick = (url: string) => {
    setOpenImage(url);
  };

  const handleCloseImage = () => {
    setOpenImage(null);
  };

  const bubbleColor = isOwn ? 'primary.light' : 'background.paper';

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb
      }}
    >
      {!isOwn && (
        <Avatar 
          alt={contactName} 
          src={contactAvatar} 
          sx={{ width: 36, height: 36, mr: 1, mt: 0.5 }}
        />
      )}
      <Box sx={{ maxWidth: '72%' }}>
        <Paper 
          elevation={1} 
          sx={{ 
            position: 'relative',
            px: 1.5,
            pt: 1,
            pb: 1.15,
            borderRadius: '16px',
            bgcolor: bubbleColor,
            color: isOwn ? 'white' : 'text.primary',
            overflow: 'hidden'
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
                      onClick={() => handleImageClick(attachment.url)}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px',
                        display: 'block',
                        cursor: 'pointer'
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
            <Typography
              variant="body1"
              sx={{
                wordBreak: 'break-word',
                lineHeight: 1.3
              }}
            >
              {message.text}
              <Box
                component="span"
                aria-hidden
                sx={{
                  display: 'inline-block',
                  width: '46px',
                  height: '1px'
                }}
              />
            </Typography>
          )}

          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              right: 10,
              bottom: 5,
              lineHeight: 1,
              fontSize: '12px',
              opacity: isOwn ? 0.8 : 0.7,
              color: isOwn ? 'rgba(255,255,255,0.9)' : 'text.secondary'
            }}
          >
            {formattedTime}
          </Typography>
        </Paper>
      </Box>

      {/* Модальное окно для просмотра изображения */}
      <Dialog
        open={Boolean(openImage)}
        onClose={handleCloseImage}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            boxShadow: 'none',
            maxHeight: '90vh'
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={handleCloseImage}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          {openImage && (
            <img
              src={openImage}
              alt="Full size"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                maxHeight: '90vh',
                objectFit: 'contain'
              }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

export default React.memo(Message);