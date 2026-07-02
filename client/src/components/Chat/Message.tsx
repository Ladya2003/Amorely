import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Avatar, Paper, IconButton, useTheme } from '@mui/material';
import MediaViewerDialog, { type MediaViewerContent } from '../common/MediaViewerDialog';
import type { ChatMediaEnvelope } from '../../crypto/cryptoService';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { MessageType, MessageForwardRef, MessageReaction } from './ChatDialog';
import EncryptedAttachment from './EncryptedAttachment';
import ChatVideoPlayer from '../common/ChatVideoPlayer';
import SharedEventCard from './SharedEventCard';
import SharedNoteCard from './SharedNoteCard';
import {
  CHAT_MESSAGE_FONT_SIZE_BASE_PX,
} from '../../utils/chatMessageFontSize';
import {
  CHAT_DIALOG_INNER_RADIUS,
  getChatMessageActionsButtonSx,
  getChatMessageBubbleSx,
  getChatMessageQuoteSx,
  getChatMessageReactionChipSx,
} from './chatDialogStyles';

const imagePreviewStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: '200px',
  objectFit: 'cover',
  borderRadius: `${CHAT_DIALOG_INNER_RADIUS}px`,
  display: 'block',
  cursor: 'pointer',
};

function groupMessageReactions(reactions: MessageReaction[]) {
  const grouped = new Map<string, { count: number; userIds: string[] }>();

  reactions.forEach((reaction) => {
    const existing = grouped.get(reaction.emoji) ?? { count: 0, userIds: [] };
    existing.count += 1;
    existing.userIds.push(reaction.userId);
    grouped.set(reaction.emoji, existing);
  });

  return Array.from(grouped.entries()).map(([emoji, data]) => ({
    emoji,
    count: data.count,
    userIds: data.userIds,
  }));
}

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
  onToggleReaction?: (messageId: string, emoji: string) => void;
  currentUserId?: string;
  onReplyReferenceClick?: (messageId: string) => void;
  onForwardSourceClick?: (userId: string, forwardFrom: MessageForwardRef) => void;
  onSharedEventClick?: (eventId: string) => void;
  onSharedNoteClick?: (noteId: string) => void;
  onContactAvatarClick?: () => void;
  messageFontSizePx?: number;
}

const Message: React.FC<MessageProps> = ({
  message,
  isOwn,
  contactName,
  contactAvatar,
  mb = 0.75,
  onOpenActions,
  onToggleReaction,
  currentUserId,
  onReplyReferenceClick,
  onForwardSourceClick,
  onSharedEventClick,
  onSharedNoteClick,
  onContactAvatarClick,
  messageFontSizePx = CHAT_MESSAGE_FONT_SIZE_BASE_PX,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [imageGalleryInitialIndex, setImageGalleryInitialIndex] = useState<number | null>(null);
  const messageFontScale = messageFontSizePx / CHAT_MESSAGE_FONT_SIZE_BASE_PX;
  const quoteTextFontSizePx = Math.max(10, Math.round(12 * messageFontScale));

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

  const replyTo = message.replyTo;
  const forwardFrom = message.forwardFrom;
  const sharedEvent = message.sharedEvent;
  const sharedNote = message.sharedNote;
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
    hasVideoAttachment && !message.text?.trim() && !sharedEvent && !sharedNote;

  const hasImageAttachment = imageAttachmentIndices.length > 0;
  const isImageOnlyBubble =
    hasImageAttachment && !hasVideoAttachment && !message.text?.trim() && !sharedEvent && !sharedNote;

  const footerReserveWidth = isOwn
    ? (message.editedAt ? 118 : 94)
    : (message.editedAt ? 96 : 74);

  const groupedReactions = useMemo(
    () => groupMessageReactions(message.reactions ?? []),
    [message.reactions]
  );
  const hasReactions = groupedReactions.length > 0;
  const canToggleReactions = Boolean(onToggleReaction && !isPending);

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
          position: 'relative',
          maxWidth: isOwn ? '85%' : '72%',
          width: isImageOnlyBubble ? (isOwn ? '85%' : '72%') : 'fit-content',
          pb: hasReactions ? 1.25 : 0,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            ...getChatMessageBubbleSx(theme, isOwn),
            width: hasImageAttachment ? '100%' : 'fit-content',
          }}
        >
          {replyTo && (
            <Box
              onClick={() => onReplyReferenceClick?.(replyTo.id)}
              sx={{
                mb: (message.text || (message.attachments?.length || 0) > 0) ? 0.8 : 0.25,
                ...getChatMessageQuoteSx(theme, isOwn),
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
                {t('chat.messageBubble.reply')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: `${quoteTextFontSizePx}px`,
                  color: isOwn ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {replyTo.text || t('chat.message.media')}
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
                  {t('chat.messageBubble.forwardedFrom', {
                    name: forwardFrom.senderName || forwardFrom.senderId,
                  })}
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
                      borderRadius: `${CHAT_DIALOG_INNER_RADIUS}px`,
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
                fontSize: `${messageFontSizePx}px`,
                wordBreak: 'break-word',
                lineHeight: 1.3,
                mb: sharedEvent || sharedNote ? 0.8 : 0
              }}
            >
              {message.text}
              <Box
                component="span"
                aria-hidden
                sx={{
                  display: 'inline-block',
                  width: `${footerReserveWidth}px`,
                  height: '1px'
                }}
              />
            </Typography>
          )}

          {sharedEvent && (
            <Box sx={{ mb: message.text ? 0 : 0.25, pb: 2.5 }}>
              <SharedEventCard
                sharedEvent={sharedEvent}
                isOwn={isOwn}
                onClick={() => onSharedEventClick?.(sharedEvent.eventId)}
              />
            </Box>
          )}

          {sharedNote && (
            <Box sx={{ mb: message.text ? 0 : 0.25, pb: 2.5 }}>
              <SharedNoteCard
                sharedNote={sharedNote}
                isOwn={isOwn}
                onClick={() => onSharedNoteClick?.(sharedNote.noteId)}
              />
            </Box>
          )}

          <Box
            sx={{
              position: 'absolute',
              right: 10,
              bottom: 5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              lineHeight: 1,
            }}
          >
            {message.editedAt ? (
              <Typography
                component="span"
                variant="caption"
                sx={{
                  fontSize: '12px',
                  opacity: isOwn ? 0.8 : 0.7,
                  color: isOwn ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('chat.message.edited')}
              </Typography>
            ) : null}
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                onOpenActions?.(event, message);
              }}
              aria-label={t('chat.dialog.messageActions')}
              sx={getChatMessageActionsButtonSx(theme, isOwn)}
            >
              <MoreHorizIcon sx={{ fontSize: '14px' }} />
            </IconButton>
            <Typography
              component="span"
              variant="caption"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.25,
                fontSize: '12px',
                opacity: isOwn ? 0.8 : 0.7,
                color: isOwn ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
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
          </Box>
        </Paper>

        {hasReactions && (
          <Box
            sx={{
              position: 'absolute',
              left: 6,
              bottom: -2,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.375,
              maxWidth: '100%',
              zIndex: 2,
              pointerEvents: canToggleReactions ? 'auto' : 'none',
            }}
          >
            {groupedReactions.map(({ emoji, count, userIds }) => {
              const isActive = Boolean(currentUserId && userIds.includes(currentUserId));

              return (
                <Box
                  key={emoji}
                  component="button"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!canToggleReactions) return;
                    onToggleReaction?.(message.id, emoji);
                  }}
                  aria-label={t('chat.dialog.react', { emoji })}
                  sx={{
                    ...getChatMessageReactionChipSx(theme, { isActive }),
                    font: 'inherit',
                    appearance: 'none',
                  }}
                >
                  <Box component="span" aria-hidden sx={{ fontSize: '15px', lineHeight: 1 }}>
                    {emoji}
                  </Box>
                  {count > 1 && (
                    <Box
                      component="span"
                      aria-hidden
                      sx={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'text.secondary',
                        lineHeight: 1,
                      }}
                    >
                      {count}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
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