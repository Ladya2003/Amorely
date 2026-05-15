import React, { useMemo, useState } from 'react';
import { Box, Typography, Avatar, Paper, Dialog, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { MessageType, MessageForwardRef } from './ChatDialog';
import EncryptedAttachment from './EncryptedAttachment';

interface MessageProps {
  message: MessageType;
  isOwn: boolean;
  contactName: string;
  contactAvatar: string;
  mb?: number;
  onOpenActions?: (event: React.MouseEvent, message: MessageType) => void;
  onReplyReferenceClick?: (messageId: string) => void;
  onForwardSourceClick?: (userId: string, forwardFrom: MessageForwardRef) => void;
}

const Message: React.FC<MessageProps> = ({
  message,
  isOwn,
  contactName,
  contactAvatar,
  mb = 0.75,
  onOpenActions,
  onReplyReferenceClick,
  onForwardSourceClick
}) => {
  const [openImage, setOpenImage] = useState<string | null>(null);
  
  const formattedTime = useMemo(() => (
    new Date(message.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  ), [message.timestamp]);

  const handleImageClick = (url: string) => {
    setOpenImage(url);
  };

  const handleCloseImage = () => {
    setOpenImage(null);
  };

  const bubbleColor = isOwn ? 'primary.light' : 'background.paper';
  const replyTo = message.replyTo;
  const forwardFrom = message.forwardFrom;
  const isPending = message.id.startsWith('temp-');
  const actionsButtonRight = isOwn
    ? (message.editedAt ? 92 : 66)
    : (message.editedAt ? 68 : 44);

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
          {replyTo && (
            <Box
              onClick={() => onReplyReferenceClick?.(replyTo.id)}
              sx={{
                mb: (message.text || (message.attachments?.length || 0) > 0) ? 0.8 : 0.25,
                px: 1,
                py: 0.5,
                borderLeft: '3px solid',
                borderColor: isOwn ? 'rgba(255,255,255,0.7)' : 'primary.main',
                bgcolor: isOwn ? 'rgba(255,255,255,0.15)' : 'action.hover',
                borderRadius: 1,
                cursor: 'pointer'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 600,
                  color: isOwn ? 'rgba(255,255,255,0.9)' : 'primary.main'
                }}
              >
                Ответ
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: isOwn ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {replyTo.text || 'Медиафайл'}
              </Typography>
            </Box>
          )}

          {forwardFrom && (
            <Box
              sx={{
                mb: (message.text || (message.attachments?.length || 0) > 0) ? 0.8 : 0.25,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                minWidth: 0
              }}
            >
              <Box
                onClick={() =>
                  forwardFrom.senderId && onForwardSourceClick?.(forwardFrom.senderId, forwardFrom)
                }
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  minWidth: 0
                }}
              >
                <Avatar
                  src={forwardFrom.senderAvatar}
                  alt={forwardFrom.senderName || 'user'}
                  sx={{ width: 14, height: 14 }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: isOwn ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                    maxWidth: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Forwarded from {forwardFrom.senderName || forwardFrom.senderId}
                </Typography>
              </Box>
            </Box>
          )}

          {message.attachments && message.attachments.length > 0 && (
            <Box sx={{ mb: message.text ? 1 : 0 }}>
              {message.attachments.map((attachment, index) => {
                const envelope = message.mediaEnvelopes?.[index];
                const isEncrypted = attachment.encrypted || attachment.type === 'encrypted';

                return (
                  <Box
                    key={index}
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    {isEncrypted && envelope ? (
                      <EncryptedAttachment
                        cacheKey={`${message.id}-${index}`}
                        url={attachment.url}
                        envelope={envelope}
                        onImageClick={handleImageClick}
                      />
                    ) : attachment.type === 'image' ? (
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
                );
              })}
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
                  width: isOwn ? '94px' : '74px',
                  height: '1px'
                }}
              />
            </Typography>
          )}

          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onOpenActions?.(event, message);
            }}
            aria-label="Действия с сообщением"
            sx={{
              position: 'absolute',
              right: actionsButtonRight,
              bottom: 6,
              p: 0.1,
              borderRadius: 1,
              bgcolor: isOwn ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)',
              color: isOwn ? 'rgba(255,255,255,0.95)' : 'text.secondary',
              '&:hover': {
                bgcolor: isOwn ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.1)'
              }
            }}
          >
            <MoreHorizIcon sx={{ fontSize: '14px' }} />
          </IconButton>

          <Typography
            variant="caption"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              position: 'absolute',
              right: 10,
              bottom: 5,
              lineHeight: 1,
              fontSize: '12px',
              opacity: isOwn ? 0.8 : 0.7,
              color: isOwn ? 'rgba(255,255,255,0.9)' : 'text.secondary'
            }}
          >
            {message.editedAt ? (
              <Box component="span" sx={{ mr: 0 }}>
                ред.
              </Box>
            ) : null}
            {formattedTime}
            {isOwn ? (
              isPending ? (
                <ScheduleIcon sx={{ fontSize: 13, ml: 0.25 }} />
              ) : message.isRead ? (
                <DoneAllIcon sx={{ fontSize: 14, ml: 0.25 }} />
              ) : (
                <DoneIcon sx={{ fontSize: 14, ml: 0.25 }} />
              )
            ) : null}
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