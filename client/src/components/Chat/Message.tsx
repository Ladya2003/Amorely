import React, { useMemo, useState } from 'react';
import { Box, Typography, Avatar, Paper, IconButton } from '@mui/material';
import MediaViewerDialog, { type MediaViewerContent } from '../common/MediaViewerDialog';
import type { ChatMediaEnvelope } from '../../crypto/cryptoService';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { MessageType, MessageForwardRef } from './ChatDialog';
import EncryptedAttachment from './EncryptedAttachment';
import ChatVideoPlayer from '../common/ChatVideoPlayer';
import SharedEventCard from './SharedEventCard';

const imagePreviewStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: '200px',
  objectFit: 'cover',
  borderRadius: '16px',
  display: 'block',
  cursor: 'pointer'
};

function getAttachmentResourceType(
  attachment: NonNullable<MessageType['attachments']>[number],
  envelope?: ChatMediaEnvelope
): 'image' | 'video' {
  if (attachment.type === 'video') return 'video';
  if (attachment.type === 'image') return 'image';
  return envelope?.displayType === 'video' ? 'video' : 'image';
}

interface MessageProps {
  message: MessageType;
  isOwn: boolean;
  contactName: string;
  contactAvatar: string;
  mb?: number;
  onOpenActions?: (event: React.MouseEvent, message: MessageType) => void;
  onReplyReferenceClick?: (messageId: string) => void;
  onForwardSourceClick?: (userId: string, forwardFrom: MessageForwardRef) => void;
  onSharedEventClick?: (eventId: string) => void;
  onContactAvatarClick?: () => void;
}

const Message: React.FC<MessageProps> = ({
  message,
  isOwn,
  contactName,
  contactAvatar,
  mb = 0.75,
  onOpenActions,
  onReplyReferenceClick,
  onForwardSourceClick,
  onSharedEventClick,
  onContactAvatarClick
}) => {
  const [imageGalleryInitialIndex, setImageGalleryInitialIndex] = useState<number | null>(null);

  const formattedTime = useMemo(() => (
    new Date(message.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  ), [message.timestamp]);

  const attachmentItems = message.attachments ?? [];

  const imageAttachmentIndices = useMemo(
    () =>
      attachmentItems
        .map((attachment, index) => ({ attachment, index }))
        .filter(
          ({ attachment, index }) =>
            getAttachmentResourceType(attachment, message.mediaEnvelopes?.[index]) === 'image'
        )
        .map(({ index }) => index),
    [attachmentItems, message.mediaEnvelopes]
  );

  const imageGallery = useMemo((): MediaViewerContent[] => {
    return imageAttachmentIndices.map((index) => {
      const attachment = attachmentItems[index];
      const envelope = message.mediaEnvelopes?.[index];
      const isEncrypted = attachment.encrypted || attachment.type === 'encrypted';

      return {
        url: attachment.url,
        resourceType: 'image' as const,
        cacheKey: isEncrypted ? `${message.id}-${index}` : undefined,
        encrypted: isEncrypted || undefined,
        mediaEnvelope: envelope
      };
    });
  }, [attachmentItems, imageAttachmentIndices, message.id, message.mediaEnvelopes]);

  const handleOpenImageGallery = (initialIndex = 0) => {
    setImageGalleryInitialIndex(initialIndex);
  };

  const handleCloseImageGallery = () => {
    setImageGalleryInitialIndex(null);
  };

  const bubbleColor = isOwn ? 'primary.light' : 'background.paper';
  const replyTo = message.replyTo;
  const forwardFrom = message.forwardFrom;
  const sharedEvent = message.sharedEvent;
  const isPending = message.id.startsWith('temp-');

  const hasVideoAttachment = useMemo(
    () =>
      Boolean(
        message.attachments?.some((attachment, index) => {
          if (attachment.type === 'video') return true;
          return message.mediaEnvelopes?.[index]?.displayType === 'video';
        })
      ),
    [message.attachments, message.mediaEnvelopes]
  );

  const isVideoOnlyBubble =
    hasVideoAttachment && !message.text?.trim() && !sharedEvent;

  const hasImageAttachment = imageAttachmentIndices.length > 0;
  const isImageOnlyBubble =
    hasImageAttachment && !hasVideoAttachment && !message.text?.trim() && !sharedEvent;

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
          onClick={onContactAvatarClick}
          sx={{
            width: 36,
            height: 36,
            mr: 1,
            mt: 0.5,
            cursor: onContactAvatarClick ? 'pointer' : 'default'
          }}
        />
      )}
      <Box
        sx={{
          maxWidth: isOwn ? '85%' : '72%',
          width: isImageOnlyBubble ? (isOwn ? '85%' : '72%') : 'fit-content'
        }}
      >
        <Paper 
          elevation={1} 
          sx={{ 
            position: 'relative',
            width: hasImageAttachment ? '100%' : 'fit-content',
            maxWidth: '100%',
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
                  Переслано от {forwardFrom.senderName || forwardFrom.senderId}
                </Typography>
              </Box>
            </Box>
          )}

          {attachmentItems.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                width: hasImageAttachment ? '100%' : 'fit-content',
                maxWidth: '100%',
                mb: message.text ? 1 : 0,
                pb: isVideoOnlyBubble || isImageOnlyBubble ? 2.5 : 0
              }}
            >
              {imageAttachmentIndices.length > 0 && (() => {
                const firstImageIndex = imageAttachmentIndices[0];
                const firstAttachment = attachmentItems[firstImageIndex];
                const firstEnvelope = message.mediaEnvelopes?.[firstImageIndex];
                const extraImageCount = imageAttachmentIndices.length - 1;
                const isFirstEncrypted =
                  firstAttachment.encrypted || firstAttachment.type === 'encrypted';

                return (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      mb: attachmentItems.some(
                        (attachment, index) =>
                          getAttachmentResourceType(attachment, message.mediaEnvelopes?.[index]) ===
                          'video'
                      )
                        ? 1
                        : 0,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      lineHeight: 0
                    }}
                  >
                    {isFirstEncrypted ? (
                      <EncryptedAttachment
                        cacheKey={`${message.id}-${firstImageIndex}`}
                        url={firstAttachment.url}
                        envelope={firstEnvelope}
                        onImageClick={() => handleOpenImageGallery(0)}
                        imageStyle={imagePreviewStyle}
                      />
                    ) : (
                      <img
                        src={firstAttachment.url}
                        alt="Attachment"
                        onClick={() => handleOpenImageGallery(0)}
                        style={imagePreviewStyle}
                      />
                    )}
                    {extraImageCount > 0 && (
                      <Box
                        aria-hidden
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          minWidth: 40,
                          height: 40,
                          px: 1,
                          borderRadius: '50%',
                          bgcolor: 'rgba(0, 0, 0, 0.55)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: 700,
                          lineHeight: 1,
                          pointerEvents: 'none'
                        }}
                      >
                        +{extraImageCount}
                      </Box>
                    )}
                  </Box>
                );
              })()}

              {attachmentItems.map((attachment, index) => {
                const envelope = message.mediaEnvelopes?.[index];
                if (getAttachmentResourceType(attachment, envelope) !== 'video') {
                  return null;
                }

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
                    {isEncrypted ? (
                      <EncryptedAttachment
                        cacheKey={`${message.id}-${index}`}
                        url={attachment.url}
                        envelope={envelope}
                      />
                    ) : (
                      <ChatVideoPlayer src={attachment.url} />
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
                fontSize: '14px',
                wordBreak: 'break-word',
                lineHeight: 1.3,
                mb: sharedEvent ? 0.8 : 0
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

          {sharedEvent && (
            <Box sx={{ mb: message.text ? 0 : 0.25, pb: message.text ? 0 : 2.5 }}>
              <SharedEventCard
                sharedEvent={sharedEvent}
                isOwn={isOwn}
                onClick={() => onSharedEventClick?.(sharedEvent.eventId)}
              />
            </Box>
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
              bgcolor: 'transparent',
              border: '1px solid',
              borderColor: isOwn ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.18)',
              color: isOwn ? 'rgba(255,255,255,0.95)' : 'text.secondary',
              '&:hover': {
                bgcolor: 'transparent',
                borderColor: isOwn ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.32)'
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

      <MediaViewerDialog
        open={imageGalleryInitialIndex !== null}
        onClose={handleCloseImageGallery}
        content={null}
        gallery={imageGallery}
        initialIndex={imageGalleryInitialIndex ?? 0}
      />
    </Box>
  );
};

export default React.memo(Message);