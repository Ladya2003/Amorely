import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  IconButton, 
  Avatar, 
  useMediaQuery,
  useTheme,
  Paper,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Badge,
  Alert
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined';
import ChatReportModal from './ChatReportModal';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ForwardOutlinedIcon from '@mui/icons-material/ForwardOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import TextDecreaseIcon from '@mui/icons-material/TextDecrease';
import TextIncreaseIcon from '@mui/icons-material/TextIncrease';
import { Contact } from './ChatList';
import Message from './Message';
import SharedEventCard from './SharedEventCard';
import SharedNoteCard from './SharedNoteCard';
import ContactProfileDialog from './ContactProfileDialog';
import AvatarGameRankMedal from '../Games/AvatarGameRankMedal';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';
import type { ChatMediaEnvelope } from '../../crypto/cryptoService';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';
import { validateAndFilterMediaFiles } from '../../utils/validateMediaFile';
import { isVideoFile } from '../../utils/videoMetadata';
import { captureVideoPosterFromFile } from '../../utils/videoPoster';
import MediaViewerDialog from '../common/MediaViewerDialog';
import EncryptedIndicator from '../common/EncryptedIndicator';
import { formatContactPresence } from '../../utils/formatContactPresence';
import { getContactDisplayName } from '../../utils/contactDisplayName';
import { formatChatDayBadge } from '../../localization/chatHelpers';
import { getOnlinePresenceColor } from '../UI/CustomSnackbar';
import { isIOSDevice } from '../../utils/isIOSDevice';
import socketService from '../../services/socketService';
import { useTypingAnimation } from '../../hooks/useTypingAnimation';
import { useChatMessageFontSize } from '../../hooks/useChatMessageFontSize';
import ChatMessageInput from './ChatMessageInput';

import { APP_FONT_FAMILY } from '../../theme/fonts';
import { playChatDeleteSound, playChatSendSound, unlockChatAudio } from '../../utils/chatSounds';
import { getChatDialogBackdropSx } from '../Feed/feedBannerStyles';
import {
  getChatComposerAttachmentSx,
  getChatComposerShellSx,
  getChatComposerWrapSx,
  getChatContextMenuItemSx,
  getChatContextMenuPaperSx,
  getChatDayBadgeSx,
  getChatDialogDraftBarSx,
  getChatDialogHeaderAvatarSx,
  getChatDialogHeaderSx,
  getChatDialogHeaderWrapSx,
  getChatDialogPresenceTextSx,
  getChatDialogMessagesAreaSx,
  getChatDialogModalActionsSx,
  getChatDialogModalContentSx,
  getChatDialogModalTitleSx,
  getChatDialogOptionsButtonSx,
  getChatDialogScrollButtonSx,
  getChatMessageFontSizeButtonSx,
  getChatMessageFontSizeControlSx,
  getChatOptionsActionButtonSx,
  CHAT_DIALOG_ACTION_RADIUS,
} from './chatDialogStyles';

const CHAT_FONT_FAMILY = APP_FONT_FAMILY;

export interface MessageReplyRef {
  id: string;
  text: string;
  senderId: string;
}

export type ForwardSourceContext = {
  message: MessageType;
  peerId: string;
};

export interface MessageForwardRef {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
}

export interface SharedEventMediaRef {
  id?: string;
  url: string;
  resourceType: 'image' | 'video';
  encrypted?: boolean;
  previewMediaEnvelope?: ContentMediaEnvelope;
  encryptedMediaEnvelope?: { ciphertext: string; iv: string };
}

export interface SharedEventRef {
  eventId: string;
  title: string;
  descriptionPreview?: string;
  /** @deprecated используйте media; первое медиа для обратной совместимости */
  previewUrl?: string;
  previewResourceType?: 'image' | 'video';
  previewEncrypted?: boolean;
  previewMediaEnvelope?: ContentMediaEnvelope;
  previewEncryptedMediaEnvelope?: { ciphertext: string; iv: string };
  previewMetadataSenderId?: string;
  previewMetadataRecipientId?: string;
  eventDate?: string;
  media?: SharedEventMediaRef[];
}

export interface SharedNoteMediaRef {
  id?: string;
  url: string;
  resourceType: 'image' | 'video';
  encrypted?: boolean;
  previewMediaEnvelope?: ContentMediaEnvelope;
  encryptedMediaEnvelope?: { ciphertext: string; iv: string };
}

export interface SharedNoteRef {
  noteId: string;
  title: string;
  category?: string;
  contentPreview?: string;
  /** @deprecated используйте media; первое медиа для обратной совместимости */
  previewUrl?: string;
  previewResourceType?: 'image' | 'video';
  previewEncrypted?: boolean;
  previewMediaEnvelope?: ContentMediaEnvelope;
  previewEncryptedMediaEnvelope?: { ciphertext: string; iv: string };
  previewMetadataSenderId?: string;
  previewMetadataRecipientId?: string;
  updatedAt?: string;
  media?: SharedNoteMediaRef[];
}

export interface SharedGameRef {
  gameId: string;
  title: string;
  imageUrl?: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
}

export const POPULAR_MESSAGE_REACTIONS = [
  '👍',
  '❤️',
  '❤️‍🔥',
  '🩷',
  '🧡',
  '💛',
  '💚',
  '🩵',
  '💙',
  '💜',
  '🖤',
  '🩶',
  '🤍',
  '🥰',
  '😍',
  '😘',
  '💋',
  '😂',
  '🥹',
  '😳',
  '😮',
  '😢',
  '😎',
  '💀',
  '🔥',
  '🎉',
  '🍓',
  '🍰',
  '🍺',
  '🍻',
  '💩',
  '⚽️',
  '🏀',
  '🏐',
  '🚗',
  '🏎️',
  '🏍️',
  '🚔',
] as const;

export interface MessageType {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  editedAt?: string;
  isRead?: boolean;
  replyTo?: MessageReplyRef;
  forwardFrom?: MessageForwardRef;
  sharedEvent?: SharedEventRef;
  sharedNote?: SharedNoteRef;
  sharedGame?: SharedGameRef;
  clientTempId?: string;
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
  mediaEnvelopes?: ChatMediaEnvelope[];
  reactions?: MessageReaction[];
}

interface ChatDialogProps {
  contact: Contact | null;
  contactIsTyping?: boolean;
  messages: MessageType[];
  currentUserId: string;
  onBack: () => void;
  onSendMessage: (
    text: string,
    attachments?: File[],
    replyTo?: MessageReplyRef | null,
    forwardFrom?: MessageForwardRef | null,
    sharedEvent?: SharedEventRef | null,
    forwardSource?: ForwardSourceContext | null,
    sharedNote?: SharedNoteRef | null
  ) => void;
  onStartForwardMessage: (message: MessageType) => void;
  onOpenChatWithUser: (userId: string, forwardHint?: MessageForwardRef | null) => void;
  onEditMessage: (messageId: string, text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onClearChat?: () => Promise<void>;
  onSubmitReport?: (text: string, files: File[]) => Promise<void>;
  onBlockUser?: () => Promise<void>;
  onUnblockUser?: () => Promise<void>;
  onReachMessagesStart?: () => void;
  onReachMessagesEnd?: () => void;
  onAtBottomChange?: (atBottom: boolean) => void;
  pendingForwardMessage?: MessageForwardRef | null;
  onPendingForwardApplied?: () => void;
  onCancelPendingForward?: () => void;
  pendingForwardSource?: ForwardSourceContext | null;
  pendingForwardSharedEvent?: SharedEventRef | null;
  pendingForwardSharedNote?: SharedNoteRef | null;
  pendingSharedEvent?: SharedEventRef | null;
  onPendingSharedEventApplied?: () => void;
  pendingSharedNote?: SharedNoteRef | null;
  onPendingSharedNoteApplied?: () => void;
  onSharedEventClick?: (eventId: string) => void;
  onSharedNoteClick?: (noteId: string) => void;
  onSharedGameClick?: (gameId: string) => void;
  hasMoreMessages?: boolean;
  isLoadingOlder?: boolean;
  isLoading?: boolean;
}

const isMessageEditable = (message: MessageType, currentUserId: string) => {
  if (message.id.startsWith('temp-')) return false;
  if (message.senderId !== currentUserId) return false;
  if (message.forwardFrom) return false;
  if (message.sharedEvent && !message.text?.trim() && !message.encryptedPayload) return false;
  if (message.sharedNote && !message.text?.trim() && !message.encryptedPayload) return false;
  if (message.sharedGame && !message.text?.trim() && !message.encryptedPayload) return false;

  const hasMediaAttachments = Boolean(
    message.attachments?.some(
      (attachment) =>
        attachment.type === 'image' ||
        attachment.type === 'video' ||
        attachment.type === 'encrypted' ||
        attachment.encrypted
    )
  );

  if (hasMediaAttachments) return false;

  return Boolean(message.text?.trim() || message.encryptedPayload);
};

const ChatDialog: React.FC<ChatDialogProps> = ({ 
  contact, 
  contactIsTyping = false,
  messages, 
  currentUserId, 
  onBack, 
  onSendMessage,
  onStartForwardMessage,
  onOpenChatWithUser,
  onEditMessage,
  onDeleteMessage,
  onToggleReaction,
  onClearChat,
  onSubmitReport,
  onBlockUser,
  onUnblockUser,
  onReachMessagesStart,
  onReachMessagesEnd,
  onAtBottomChange,
  pendingForwardMessage = null,
  onPendingForwardApplied,
  onCancelPendingForward,
  pendingForwardSource = null,
  pendingForwardSharedEvent = null,
  pendingForwardSharedNote = null,
  pendingSharedEvent = null,
  onPendingSharedEventApplied,
  pendingSharedNote = null,
  onPendingSharedNoteApplied,
  onSharedEventClick,
  onSharedNoteClick,
  onSharedGameClick,
  hasMoreMessages = false,
  isLoadingOlder = false,
  isLoading = false
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const useIOSAccessoryFix = isMobile && isIOSDevice();
  const { otherUnreadCount } = useUnreadMessages();
  const {
    fontSizePx: messageFontSizePx,
    canDecrease: canDecreaseMessageFontSize,
    canIncrease: canIncreaseMessageFontSize,
    decrease: decreaseMessageFontSize,
    increase: increaseMessageFontSize,
  } = useChatMessageFontSize();
  const [messageText, setMessageText] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingActiveRef = useRef(false);
  const lastTypingEmitRef = useRef(0);
  const showTypingStatus = Boolean(contactIsTyping && contact?.isOnline);
  const typingStatusText = useTypingAnimation(showTypingStatus, t('chat.presence.typing'));
  const presenceText = showTypingStatus
    ? typingStatusText
    : formatContactPresence(contact?.isOnline, contact?.lastSeen, t, i18n.language);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentValidationError, setAttachmentValidationError] = useState<string | null>(null);
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<string[]>([]);
  const [attachmentVideoPosters, setAttachmentVideoPosters] = useState<Record<number, string>>({});
  const [isPickingAttachments, setIsPickingAttachments] = useState(false);
  const [attachmentLightbox, setAttachmentLightbox] = useState<{
    url: string;
    mediaType: 'image' | 'video';
  } | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [newMessagesBelowCount, setNewMessagesBelowCount] = useState(0);
  const [enteringMessageIds, setEnteringMessageIds] = useState<Set<string>>(() => new Set());
  const [isMessagesViewportReady, setIsMessagesViewportReady] = useState(false);
  const isAtBottomRef = useRef(true);
  const isAutoFollowingRef = useRef(false);
  const [hiddenDayBadgeKeys, setHiddenDayBadgeKeys] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<MessageReplyRef | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<MessageForwardRef | null>(null);
  const [forwardingSharedEvent, setForwardingSharedEvent] = useState<SharedEventRef | null>(null);
  const [forwardingSharedNote, setForwardingSharedNote] = useState<SharedNoteRef | null>(null);
  const [forwardingSource, setForwardingSource] = useState<ForwardSourceContext | null>(null);
  const [sharingEvent, setSharingEvent] = useState<SharedEventRef | null>(null);
  const [sharingNote, setSharingNote] = useState<SharedNoteRef | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    message: MessageType;
    anchorEl?: HTMLElement | null;
    mouseX?: number;
    mouseY?: number;
  } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessageType | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [unblockConfirmOpen, setUnblockConfirmOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContentRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousFirstMessageIdRef = useRef<string | null>(null);
  const pendingTopLoadAdjustmentRef = useRef<{
    prevScrollTop: number;
    prevScrollHeight: number;
    anchorMessageId: string | null;
    anchorOffsetFromTop: number;
  } | null>(null);
  const isTopLoadPendingRef = useRef(false);
  const dayBadgeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimeoutRef = useRef<number | null>(null);
  const initialScrollPinActiveRef = useRef(false);
  const userScrolledDuringPinRef = useRef(false);

  const stopTypingForContact = useCallback((receiverId?: string | null) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (!receiverId || !isTypingActiveRef.current) {
      return;
    }

    try {
      socketService.stopTyping(receiverId);
    } catch {
      // Socket may be unavailable during teardown.
    }

    isTypingActiveRef.current = false;
  }, []);

  const notifyTypingActivity = useCallback((text: string, receiverId?: string | null) => {
    if (!receiverId) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (!text.trim()) {
      stopTypingForContact(receiverId);
      return;
    }

    const now = Date.now();
    if (!isTypingActiveRef.current || now - lastTypingEmitRef.current > 2000) {
      try {
        socketService.startTyping(receiverId);
      } catch {
        return;
      }

      isTypingActiveRef.current = true;
      lastTypingEmitRef.current = now;
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTypingForContact(receiverId);
    }, 3000);
  }, [stopTypingForContact]);

  useEffect(() => {
    return () => {
      stopTypingForContact(contact?.id);
    };
  }, [contact?.id, stopTypingForContact]);

  const getScrollMetrics = () => {
    const container = messagesContainerRef.current;
    if (!container) return null;

    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

    return {
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
      maxTop,
      distanceToBottom,
      atBottom: distanceToBottom <= 40
    };
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    const endEl = messagesEndRef.current;
    if (!container) return;

    if (endEl) {
      endEl.scrollIntoView({ block: 'end', inline: 'nearest', behavior });
      return;
    }

    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);

    if (behavior === 'auto') {
      container.scrollTop = maxTop;
    } else {
      container.scrollTo({ top: maxTop, behavior });
    }
  };

  const isScrolledToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return false;

    const thresholdPx = 40;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= thresholdPx;
  };

  const pinScrollForKeyboard = () => {
    scrollToBottom('auto');
    isAtBottomRef.current = isScrolledToBottom();
    if (isAtBottomRef.current) {
      setShowScrollToBottom(false);
      setNewMessagesBelowCount(0);
    }
  };

  const schedulePinScrollForKeyboard = () => {
    pinScrollForKeyboard();
    requestAnimationFrame(() => {
      requestAnimationFrame(pinScrollForKeyboard);
    });
    window.setTimeout(pinScrollForKeyboard, 100);
    window.setTimeout(pinScrollForKeyboard, 300);
  };

  const handleMessageInputFocus = () => {
    if (!isMobile) {
      return;
    }
    schedulePinScrollForKeyboard();
  };

  // Сброс при смене контакта — useLayoutEffect, чтобы выполняться до эффекта готовности viewport
  useLayoutEffect(() => {
    isInitialLoadRef.current = true;
    initialScrollPinActiveRef.current = false;
    userScrolledDuringPinRef.current = false;
    previousMessagesLengthRef.current = 0;
    previousFirstMessageIdRef.current = null;
    pendingTopLoadAdjustmentRef.current = null;
    isTopLoadPendingRef.current = false;
    isAtBottomRef.current = true;
    isAutoFollowingRef.current = false;
    setNewMessagesBelowCount(0);
    setEnteringMessageIds(new Set());
    setAttachmentLightbox(null);
    setAttachmentVideoPosters({});
    setIsMessagesViewportReady(false);
    setShowScrollToBottom(false);
    dayBadgeRefs.current = {};
    messageRefs.current = {};
    setHiddenDayBadgeKeys({});
    setReplyingTo(null);
    setForwardingMessage(null);
    setForwardingSharedEvent(null);
    setForwardingSource(null);
    setSharingEvent(null);
    setEditingMessage(null);
    setContextMenu(null);
    setHighlightedMessageId(null);
    setDeleteModalOpen(false);
    setMessageToDelete(null);
    setProfileDialogOpen(false);
  }, [contact?.id]);

  useLayoutEffect(() => {
    if (isLoading) {
      setIsMessagesViewportReady(false);
      initialScrollPinActiveRef.current = false;
      return;
    }

    if (!isInitialLoadRef.current) {
      return;
    }

    if (messages.length === 0) {
      return;
    }

    scrollToBottom('auto');
    isAtBottomRef.current = isScrolledToBottom();
    setNewMessagesBelowCount(0);
    previousMessagesLengthRef.current = messages.length;
    isInitialLoadRef.current = false;
    previousFirstMessageIdRef.current = messages[0]?.id || null;
    setIsMessagesViewportReady(true);
    initialScrollPinActiveRef.current = true;

    onAtBottomChange?.(isScrolledToBottom());

    if (isScrolledToBottom()) {
      onReachMessagesEnd?.();
    }
  }, [messages, isLoading, onReachMessagesEnd, onAtBottomChange]);

  useEffect(() => {
    if (!isMessagesViewportReady) {
      return;
    }

    const content = messagesContentRef.current;
    const container = messagesContainerRef.current;
    if (!content || !container) {
      return;
    }

    userScrolledDuringPinRef.current = false;

    const markUserScroll = () => {
      userScrolledDuringPinRef.current = true;
    };

    container.addEventListener('wheel', markUserScroll, { passive: true });
    container.addEventListener('touchmove', markUserScroll, { passive: true });
    container.addEventListener('pointerdown', markUserScroll);

    const pinScrollToBottom = () => {
      if (!initialScrollPinActiveRef.current || userScrolledDuringPinRef.current) {
        return;
      }

      const metrics = getScrollMetrics();
      if (metrics && metrics.distanceToBottom > 2) {
        scrollToBottom('auto');
        isAtBottomRef.current = isScrolledToBottom();
      }
    };

    const observer = new ResizeObserver(() => {
      pinScrollToBottom();
    });
    observer.observe(content);

    const rafId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        pinScrollToBottom();
      });
    });

    const timeoutId = window.setTimeout(() => {
      initialScrollPinActiveRef.current = false;
    }, 5000);

    return () => {
      observer.disconnect();
      container.removeEventListener('wheel', markUserScroll);
      container.removeEventListener('touchmove', markUserScroll);
      container.removeEventListener('pointerdown', markUserScroll);
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [isMessagesViewportReady, messages.length]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const handleViewportChange = () => {
      if (!document.activeElement?.closest('[data-chat-composer]')) {
        return;
      }
      schedulePinScrollForKeyboard();
    };

    viewport.addEventListener('resize', handleViewportChange);
    return () => viewport.removeEventListener('resize', handleViewportChange);
  }, [isMobile]);

  const restoreScrollAfterPrepend = useCallback(() => {
    const container = messagesContainerRef.current;
    const pending = pendingTopLoadAdjustmentRef.current;
    if (!container || !pending) {
      return;
    }

    const { prevScrollTop, prevScrollHeight, anchorMessageId, anchorOffsetFromTop } = pending;

    if (anchorMessageId) {
      const anchorEl = messageRefs.current[anchorMessageId];
      if (anchorEl) {
        const currentOffset =
          anchorEl.getBoundingClientRect().top - container.getBoundingClientRect().top;
        container.scrollTop += currentOffset - anchorOffsetFromTop;
        return;
      }
    }

    const scrollDelta = container.scrollHeight - prevScrollHeight;
    container.scrollTop = prevScrollTop + scrollDelta;
  }, []);

  useLayoutEffect(() => {
    if (isInitialLoadRef.current) {
      return;
    }

    const currentFirstMessageId = messages[0]?.id || null;
    const hasPrependedMessages =
      messages.length > previousMessagesLengthRef.current &&
      previousFirstMessageIdRef.current !== null &&
      currentFirstMessageId !== previousFirstMessageIdRef.current;

    if (hasPrependedMessages) {
      restoreScrollAfterPrepend();
      pendingTopLoadAdjustmentRef.current = null;
      isTopLoadPendingRef.current = false;
      return;
    }

    if (!isLoadingOlder && isTopLoadPendingRef.current) {
      pendingTopLoadAdjustmentRef.current = null;
      isTopLoadPendingRef.current = false;
    }
  }, [messages, isLoadingOlder, restoreScrollAfterPrepend]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      return;
    }

    // При добавлении новых сообщений в конец
    if (messages.length > previousMessagesLengthRef.current) {
      const currentFirstMessageId = messages[0]?.id || null;
      const hasPrependedMessages =
        previousFirstMessageIdRef.current !== null &&
        currentFirstMessageId !== previousFirstMessageIdRef.current;

      if (!hasPrependedMessages) {
        const newMessages = messages.slice(previousMessagesLengthRef.current);
        const incomingFromOtherCount = newMessages.filter(
          (message) => message.senderId !== currentUserId
        ).length;

        const isBulkInitialAppend =
          previousMessagesLengthRef.current === 0 && newMessages.length > 1;

        if (newMessages.length > 0 && !isBulkInitialAppend) {
          const enteringIds = newMessages.map((message) => message.id);
          setEnteringMessageIds((prev) => {
            const next = new Set(prev);
            enteringIds.forEach((id) => next.add(id));
            return next;
          });
          window.setTimeout(() => {
            setEnteringMessageIds((prev) => {
              const next = new Set(prev);
              enteringIds.forEach((id) => next.delete(id));
              return next;
            });
          }, 280);
        }

        if (isAtBottomRef.current) {
          isAutoFollowingRef.current = true;
          setShowScrollToBottom(false);
          setNewMessagesBelowCount(0);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              scrollToBottom('auto');
              isAtBottomRef.current = true;
              isAutoFollowingRef.current = false;
              if (isScrolledToBottom()) {
                onReachMessagesEnd?.();
              }
            });
          });
        } else if (incomingFromOtherCount > 0) {
          setNewMessagesBelowCount((prev) => prev + incomingFromOtherCount);
          setShowScrollToBottom(true);
        } else {
          scrollToBottom('smooth');
          setTimeout(() => {
            if (isScrolledToBottom()) {
              isAtBottomRef.current = true;
              setShowScrollToBottom(false);
              onReachMessagesEnd?.();
            }
          }, 200);
        }
      }

      previousMessagesLengthRef.current = messages.length;
    }

    previousFirstMessageIdRef.current = messages[0]?.id || null;
    if (!isAutoFollowingRef.current) {
      setShowScrollToBottom(!isAtBottomRef.current);
    }
  }, [messages, isLoading, onReachMessagesEnd, currentUserId]);

  useEffect(() => {
    const nextUrls = attachments
      .filter((file) => file.type.startsWith('image/') || isVideoFile(file))
      .map((file) => URL.createObjectURL(file));

    setAttachmentPreviewUrls(nextUrls);

    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments]);

  useEffect(() => {
    let cancelled = false;

    const loadVideoPosters = async () => {
      const posterEntries = await Promise.all(
        attachments.map(async (file, index) => {
          if (!isVideoFile(file)) {
            return null;
          }

          const poster = await captureVideoPosterFromFile(file);
          return poster ? ([index, poster] as const) : null;
        })
      );

      if (cancelled) {
        return;
      }

      const nextPosters: Record<number, string> = {};
      posterEntries.forEach((entry) => {
        if (entry) {
          nextPosters[entry[0]] = entry[1];
        }
      });
      setAttachmentVideoPosters(nextPosters);
    };

    void loadVideoPosters();

    return () => {
      cancelled = true;
    };
  }, [attachments]);

  const cancelForwardDraft = () => {
    setForwardingMessage(null);
    setForwardingSharedEvent(null);
    setForwardingSharedNote(null);
    setForwardingSource(null);
    onCancelPendingForward?.();
  };

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingForwardMessage) return;
    setEditingMessage(null);
    setReplyingTo(null);
    setSharingEvent(null);
    setSharingNote(null);
    setForwardingMessage(pendingForwardMessage);
    setForwardingSharedEvent(pendingForwardSharedEvent || null);
    setForwardingSharedNote(pendingForwardSharedNote || null);
    setForwardingSource(pendingForwardSource || null);
    onPendingForwardApplied?.();
  }, [pendingForwardMessage, pendingForwardSharedEvent, pendingForwardSharedNote, pendingForwardSource, onPendingForwardApplied]);

  useEffect(() => {
    if (!pendingSharedEvent) return;
    setEditingMessage(null);
    setReplyingTo(null);
    setForwardingMessage(null);
    setForwardingSharedEvent(null);
    setForwardingSharedNote(null);
    setSharingNote(null);
    setSharingEvent(pendingSharedEvent);
    onPendingSharedEventApplied?.();
  }, [pendingSharedEvent, onPendingSharedEventApplied]);

  useEffect(() => {
    if (!pendingSharedNote) return;
    setEditingMessage(null);
    setReplyingTo(null);
    setForwardingMessage(null);
    setForwardingSharedEvent(null);
    setForwardingSharedNote(null);
    setSharingEvent(null);
    setSharingNote(pendingSharedNote);
    onPendingSharedNoteApplied?.();
  }, [pendingSharedNote, onPendingSharedNoteApplied]);

  const scrollMessageIntoView = (messageId: string, behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    const target = messageRefs.current[messageId];
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = targetRect.top - containerRect.top + container.scrollTop;
    const centeredTop = targetTop - container.clientHeight / 2 + targetRect.height / 2;
    const maxTop = container.scrollHeight - container.clientHeight;
    const nextTop = Math.max(0, Math.min(centeredTop, maxTop));

    if (behavior === 'auto') {
      container.scrollTop = nextTop;
      return;
    }

    container.scrollTo({ top: nextTop, behavior });
  };

  const handleSendMessage = () => {
    stopTypingForContact(contact?.id);

    const trimmedText = messageText.trim();
    if (editingMessage) {
      if (!trimmedText) return;
      onEditMessage(editingMessage.id, trimmedText);
      setMessageText('');
      setEditingMessage(null);
      setAttachments([]);
      return;
    }

    if (forwardingMessage) {
      unlockChatAudio();
      void playChatSendSound();
      if (trimmedText) {
        onSendMessage(trimmedText, [], null, null, null);
      }
      onSendMessage(
        forwardingSharedEvent || forwardingSharedNote ? '' : (forwardingMessage.text || t('chat.message.forwarded')),
        [],
        null,
        forwardingMessage,
        forwardingSharedEvent,
        forwardingSource,
        forwardingSharedNote
      );
      setMessageText('');
      setAttachments([]);
      setReplyingTo(null);
      cancelForwardDraft();
      return;
    }

    if (sharingEvent) {
      unlockChatAudio();
      void playChatSendSound();
      if (trimmedText) {
        onSendMessage(trimmedText, [], null, null, null);
      }
      onSendMessage('', [], null, null, sharingEvent);
      setMessageText('');
      setAttachments([]);
      setReplyingTo(null);
      setSharingEvent(null);
      return;
    }

    if (sharingNote) {
      unlockChatAudio();
      void playChatSendSound();
      if (trimmedText) {
        onSendMessage(trimmedText, [], null, null, null);
      }
      onSendMessage('', [], null, null, null, null, sharingNote);
      setMessageText('');
      setAttachments([]);
      setReplyingTo(null);
      setSharingNote(null);
      return;
    }

    if (trimmedText || attachments.length > 0) {
      unlockChatAudio();
      void playChatSendSound();
      onSendMessage(trimmedText, attachments, replyingTo, null);
      setMessageText('');
      setAttachments([]);
      setReplyingTo(null);
    }
  };

  const processSelectedFiles = useCallback(async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      return;
    }

    setIsPickingAttachments(true);

    try {
      const { accepted, errors } = await validateAndFilterMediaFiles(selectedFiles);

      if (errors.length > 0) {
        setAttachmentValidationError(errors.join(' '));
      } else {
        setAttachmentValidationError(null);
      }

      if (accepted.length === 0) {
        return;
      }

      setAttachments((prev) => [...prev, ...accepted]);
    } finally {
      setIsPickingAttachments(false);
    }
  }, []);

  const handleAttachmentClick = () => {
    if (isPickingAttachments) {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,.mov,video/quicktime';
    input.style.display = 'none';

    const cleanup = () => {
      input.remove();
    };

    input.addEventListener('change', () => {
      const selectedFiles = input.files ? Array.from(input.files) : [];
      cleanup();
      void processSelectedFiles(selectedFiles);
    });

    input.addEventListener('cancel', cleanup);

    document.body.appendChild(input);
    input.click();
  };

  const updateHiddenDayBadges = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const stickyTop = 8;
    const containerRect = container.getBoundingClientRect();
    const stickyLineY = containerRect.top + stickyTop;
    const badgeEntries = Object.entries(dayBadgeRefs.current)
      .filter(([, element]) => Boolean(element))
      .sort((a, b) => (a[1]?.offsetTop || 0) - (b[1]?.offsetTop || 0));

    if (badgeEntries.length <= 1) {
      setHiddenDayBadgeKeys((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    const nextHidden: Record<string, boolean> = {};
    for (let index = 0; index < badgeEntries.length - 1; index += 1) {
      const [currentKey, currentEl] = badgeEntries[index];
      const [, nextEl] = badgeEntries[index + 1];

      if (!currentEl || !nextEl) continue;

      const currentRect = currentEl.getBoundingClientRect();
      const nextRect = nextEl.getBoundingClientRect();
      const nextDistanceToStickyTop = nextRect.top - stickyLineY;
      const isTouchingNext = nextDistanceToStickyTop <= currentRect.height;

      if (isTouchingNext) {
        nextHidden[currentKey] = true;
      }
    }

    setHiddenDayBadgeKeys((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(nextHidden);
      if (
        prevKeys.length === nextKeys.length &&
        prevKeys.every((key) => prev[key] === nextHidden[key])
      ) {
        return prev;
      }
      return nextHidden;
    });
  }, []);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      updateHiddenDayBadges();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [messages, updateHiddenDayBadges]);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    let atBottom = isScrolledToBottom();

    if (!atBottom && initialScrollPinActiveRef.current) {
      if (userScrolledDuringPinRef.current) {
        initialScrollPinActiveRef.current = false;
      } else {
        scrollToBottom('auto');
        atBottom = isScrolledToBottom();
      }
    }

    isAtBottomRef.current = atBottom;
    onAtBottomChange?.(atBottom);
    if (!isAutoFollowingRef.current) {
      setShowScrollToBottom(!atBottom);
    }
    updateHiddenDayBadges();

    if (
      container &&
      onReachMessagesStart &&
      hasMoreMessages &&
      !isLoadingOlder &&
      !isTopLoadPendingRef.current &&
      container.scrollTop <= 120
    ) {
      const anchorMessageId = messages[0]?.id ?? null;
      const anchorEl = anchorMessageId ? messageRefs.current[anchorMessageId] : null;
      const anchorOffsetFromTop = anchorEl
        ? anchorEl.getBoundingClientRect().top - container.getBoundingClientRect().top
        : 0;

      pendingTopLoadAdjustmentRef.current = {
        prevScrollTop: container.scrollTop,
        prevScrollHeight: container.scrollHeight,
        anchorMessageId,
        anchorOffsetFromTop
      };
      isTopLoadPendingRef.current = true;
      onReachMessagesStart();
    }

    if (atBottom) {
      setNewMessagesBelowCount(0);
      onReachMessagesEnd?.();
    }
  };

  const handleBackClick = () => {
    onBack();
  };

  const handleScrollToBottomClick = () => {
    scrollToBottom('smooth');
    isAtBottomRef.current = true;
    setNewMessagesBelowCount(0);
    setTimeout(() => {
      setShowScrollToBottom(false);
      if (isScrolledToBottom()) {
        onReachMessagesEnd?.();
      }
    }, 250);
  };

  const scrollDownBadgeLabel =
    newMessagesBelowCount > 99 ? '99+' : String(newMessagesBelowCount);

  const handleMessageContextMenu = (event: React.MouseEvent, message: MessageType) => {
    if (event.type === 'contextmenu') {
      event.preventDefault();
    }

    if (isMobile) {
      setContextMenu({ message });
      return;
    }

    if (event.type === 'contextmenu') {
      setContextMenu({
        message,
        mouseX: event.clientX + 2,
        mouseY: event.clientY - 6,
      });
      return;
    }

    setContextMenu({
      message,
      anchorEl: event.currentTarget as HTMLElement,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleReplyFromContextMenu = () => {
    if (!contextMenu) return;
    setEditingMessage(null);
    cancelForwardDraft();
    setSharingEvent(null);
    setReplyingTo({
      id: contextMenu.message.id,
      text: contextMenu.message.text || (contextMenu.message.attachments?.length ? t('chat.message.media') : ''),
      senderId: contextMenu.message.senderId
    });
    setContextMenu(null);
  };

  const handleForwardFromContextMenu = () => {
    if (!contextMenu) return;
    onStartForwardMessage(contextMenu.message);
    setContextMenu(null);
  };

  const handleEditFromContextMenu = () => {
    if (!contextMenu) return;
    if (!isMessageEditable(contextMenu.message, currentUserId)) {
      setContextMenu(null);
      return;
    }

    setReplyingTo(null);
    setAttachments([]);
    setEditingMessage(contextMenu.message);
    setMessageText(contextMenu.message.text || '');
    setContextMenu(null);
  };

  const handleDeleteFromContextMenu = () => {
    if (!contextMenu) return;
    setMessageToDelete(contextMenu.message);
    setDeleteModalOpen(true);
    setContextMenu(null);
  };

  const handleReactionFromContextMenu = (emoji: string) => {
    if (!contextMenu) return;
    if (contextMenu.message.id.startsWith('temp-')) {
      setContextMenu(null);
      return;
    }
    onToggleReaction(contextMenu.message.id, emoji);
    setContextMenu(null);
  };

  const renderReactionPicker = () => (
    <>
      <Divider sx={{ my: 0.5 }} />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 0.25,
          px: 1,
          py: 0.75,
        }}
      >
        {POPULAR_MESSAGE_REACTIONS.map((emoji) => (
          <IconButton
            key={emoji}
            size="small"
            onClick={() => handleReactionFromContextMenu(emoji)}
            aria-label={t('chat.dialog.react', { emoji })}
            sx={{
              fontSize: '20px',
              width: 36,
              height: 36,
              borderRadius: `${CHAT_DIALOG_ACTION_RADIUS}px`,
              lineHeight: 1,
            }}
          >
            {emoji}
          </IconButton>
        ))}
      </Box>
    </>
  );

  const renderMessageActionItems = () => (
    <>
      <MenuItem onClick={handleReplyFromContextMenu} sx={getChatContextMenuItemSx(theme)}>
        <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
          <ForwardOutlinedIcon sx={{ fontSize: 18 }} />
        </ListItemIcon>
        {t('chat.dialog.reply')}
      </MenuItem>
      {contextMenu && isMessageEditable(contextMenu.message, currentUserId) && (
        <MenuItem onClick={handleEditFromContextMenu} sx={getChatContextMenuItemSx(theme)}>
          <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
            <EditOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          {t('chat.dialog.edit')}
        </MenuItem>
      )}
      <MenuItem onClick={handleForwardFromContextMenu} sx={getChatContextMenuItemSx(theme)}>
        <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
          <ReplyOutlinedIcon sx={{ fontSize: 18 }} />
        </ListItemIcon>
        {t('chat.dialog.forward')}
      </MenuItem>
      <MenuItem onClick={handleDeleteFromContextMenu} sx={getChatContextMenuItemSx(theme, { danger: true })}>
        <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
        </ListItemIcon>
        {t('chat.dialog.delete')}
      </MenuItem>
      {renderReactionPicker()}
    </>
  );

  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false);
    setMessageToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!messageToDelete) return;
    unlockChatAudio();
    void playChatDeleteSound();
    onDeleteMessage(messageToDelete.id);
    handleDeleteModalClose();
  };

  const highlightMessage = (messageId: string) => {
    scrollMessageIntoView(messageId, 'smooth');
    setHighlightedMessageId(messageId);

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedMessageId((current) => (current === messageId ? null : current));
      highlightTimeoutRef.current = null;
    }, 3000);
  };

  const handleReplyReferenceClick = (messageId: string) => {
    highlightMessage(messageId);
  };

  const handleForwardSourceClick = (userId: string, forwardFrom: MessageForwardRef) => {
    if (userId === contact?.id && forwardFrom.id) {
      highlightMessage(forwardFrom.id);
      return;
    }
    onOpenChatWithUser(userId, forwardFrom);
  };

  const contactName = contact?.name || '';
  const contactAvatar = contact?.avatar || '';
  const renderedMessages = useMemo(() => {
    const isSameDay = (a: Date, b: Date) =>
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();

    const nodes: React.ReactNode[] = [];

    messages.forEach((message, index) => {
      const nextMessage = messages[index + 1];
      const previousMessage = messages[index - 1];
      let messageSpacing = 0.75;

      if (nextMessage) {
        const currentTs = new Date(message.timestamp).getTime();
        const nextTs = new Date(nextMessage.timestamp).getTime();
        const minutesDiff = (nextTs - currentTs) / (1000 * 60);

        if (minutesDiff >= 30) {
          messageSpacing = 2.5;
        }
      }

      const currentDate = new Date(message.timestamp);
      const previousDate = previousMessage ? new Date(previousMessage.timestamp) : null;
      const shouldShowDateBadge =
        !Number.isNaN(currentDate.getTime()) &&
        (!previousDate || Number.isNaN(previousDate.getTime()) || !isSameDay(previousDate, currentDate));

      if (shouldShowDateBadge) {
        const dayBadgeKey = `date-badge-${message.id}`;
        nodes.push(
          <Box
            key={dayBadgeKey}
            ref={(el: HTMLDivElement | null) => {
              dayBadgeRefs.current[dayBadgeKey] = el;
            }}
            sx={{
              position: 'sticky',
              top: 8,
              zIndex: 3,
              display: 'flex',
              justifyContent: 'center',
              my: 1,
              pointerEvents: 'none',
              opacity: hiddenDayBadgeKeys[dayBadgeKey] ? 0 : 1,
              transition: 'opacity 120ms linear'
            }}
          >
            <Box sx={getChatDayBadgeSx(theme)}>
              {formatChatDayBadge(currentDate, i18n.language)}
            </Box>
          </Box>
        );
      }

      nodes.push(
        <Box
          key={message.id}
          ref={(el: HTMLDivElement | null) => {
            messageRefs.current[message.id] = el;
          }}
          onContextMenu={(event) => handleMessageContextMenu(event, message)}
          sx={{
            borderRadius: 2,
            transition: 'background-color 200ms ease',
            bgcolor: highlightedMessageId === message.id ? 'rgba(255, 235, 59, 0.35)' : 'transparent',
            ...(enteringMessageIds.has(message.id)
              ? {
                  '@keyframes chatMessageEnter': {
                    from: { opacity: 0, transform: 'translateY(6px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                  },
                  animation: 'chatMessageEnter 0.22s ease-out'
                }
              : {})
          }}
        >
          <Message
            message={message}
            isOwn={message.senderId === currentUserId}
            contactName={contactName}
            contactAvatar={contactAvatar}
            mb={messageSpacing}
            messageFontSizePx={messageFontSizePx}
            onOpenActions={handleMessageContextMenu}
            onToggleReaction={onToggleReaction}
            currentUserId={currentUserId}
            onReplyReferenceClick={handleReplyReferenceClick}
            onForwardSourceClick={handleForwardSourceClick}
            onSharedEventClick={onSharedEventClick}
            onSharedNoteClick={onSharedNoteClick}
            onSharedGameClick={onSharedGameClick}
            onContactAvatarClick={() => setProfileDialogOpen(true)}
          />
        </Box>
      );
    });

    return nodes;
  }, [messages, currentUserId, contactName, contactAvatar, hiddenDayBadgeKeys, highlightedMessageId, enteringMessageIds, handleForwardSourceClick, onSharedEventClick, onSharedNoteClick, onSharedGameClick, theme, i18n.language, messageFontSizePx]);

  const attachmentPreviewByIndex = useMemo(() => {
    const result: Record<number, { url: string; mediaType: 'image' | 'video' }> = {};
    let mediaCursor = 0;

    attachments.forEach((file, index) => {
      if (file.type.startsWith('image/') || isVideoFile(file)) {
        result[index] = {
          url: attachmentPreviewUrls[mediaCursor] || '',
          mediaType: file.type.startsWith('image/') ? 'image' : 'video'
        };
        mediaCursor += 1;
      }
    });

    return result;
  }, [attachments, attachmentPreviewUrls]);

  const handleRemoveAttachment = (index: number) => {
    const removedPreview = attachmentPreviewByIndex[index];

    setAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index));

    if (removedPreview?.url) {
      setAttachmentLightbox((current) =>
        current?.url === removedPreview.url ? null : current
      );
    }
  };

  const handleAttachmentPreviewOpen = (index: number) => {
    const preview = attachmentPreviewByIndex[index];
    if (!preview?.url) return;

    setAttachmentLightbox(preview);
  };

  if (!contact) return null;

  const contactDisplayName = getContactDisplayName(contact, t('chat.systemMessages'));

  return (
    <Box sx={(theme) => ({
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: CHAT_FONT_FAMILY,
      ...getChatDialogBackdropSx(theme),
      '& .MuiTypography-root': { fontFamily: CHAT_FONT_FAMILY },
      '& .MuiInputBase-root': { fontFamily: CHAT_FONT_FAMILY },
      '& .MuiMenuItem-root': { fontFamily: CHAT_FONT_FAMILY },
    })}>
      {/* Заголовок чата - фиксированный */}
      <Box sx={getChatDialogHeaderWrapSx()}>
      <Paper
        elevation={0}
        sx={getChatDialogHeaderSx(theme)}
      >
        <IconButton edge="start" onClick={handleBackClick} sx={{ mr: 1 }}>
          <Badge
            badgeContent={otherUnreadCount}
            color="error"
            max={99}
            invisible={otherUnreadCount === 0}
          >
            <ArrowBackIcon />
          </Badge>
        </IconButton>
        <AvatarGameRankMedal
          badges={contact.badges}
          displayGameId={contact.displayBadgeGameId}
          showBadge={contact.showDisplayBadge !== false}
          avatarSize={44}
        >
          <Avatar
            alt={contactDisplayName}
            src={contact.avatar}
            onClick={() => setProfileDialogOpen(true)}
            sx={getChatDialogHeaderAvatarSx()}
          />
        </AvatarGameRankMedal>
        <Box
          sx={{ flexGrow: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => setProfileDialogOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setProfileDialogOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={t('chat.dialog.profileAria', { name: contactDisplayName })}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <Typography
              variant="subtitle1"
              noWrap
              sx={{
                fontWeight: 600,
                lineHeight: 1.25,
                fontSize: '0.95rem',
                minWidth: 0,
                flexShrink: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {contactDisplayName}
            </Typography>
          </Box>
          <Typography
            component="span"
            noWrap
            sx={(muiTheme) => ({
              ...getChatDialogPresenceTextSx({
                isActive: showTypingStatus || contact.isOnline,
              }),
              color: showTypingStatus || contact.isOnline
                ? getOnlinePresenceColor(muiTheme)
                : muiTheme.palette.text.secondary,
            })}
          >
            {presenceText}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            alignSelf: 'stretch',
            justifyContent: 'space-between',
            ml: 0.5,
            mr: 0,
            pt: 0.25,
            pb: 0.25,
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => setOptionsModalOpen(true)}
            aria-label={t('chat.dialog.optionsAria')}
            sx={getChatDialogOptionsButtonSx(theme)}
          >
            <Typography
              variant="caption"
              component="span"
              sx={{
                fontSize: '0.8125rem',
                lineHeight: 1.1,
                fontWeight: 500,
              }}
            >
              {t('chat.dialog.optionsTitle')}
            </Typography>
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </Box>
          <EncryptedIndicator />
        </Box>
      </Paper>
      </Box>

      {/* Область сообщений */}
      <Box
        sx={getChatDialogMessagesAreaSx()}
      ref={messagesContainerRef}
      onScroll={handleMessagesScroll}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Box
            ref={messagesContentRef}
            sx={{
              visibility: isMessagesViewportReady ? 'visible' : 'hidden'
            }}
          >
            {isLoadingOlder && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                <CircularProgress size={18} color="primary" />
              </Box>
            )}
            {renderedMessages}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {showScrollToBottom && !isLoading && (
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            bottom: 120,
            zIndex: 120
          }}
        >
          <Badge
            badgeContent={scrollDownBadgeLabel}
            color="primary"
            overlap="circular"
            invisible={newMessagesBelowCount === 0}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                minWidth: 18,
                height: 18,
                fontWeight: 700
              }
            }}
          >
            <IconButton
              color="primary"
              onClick={handleScrollToBottomClick}
              sx={getChatDialogScrollButtonSx(theme)}
              aria-label={
                newMessagesBelowCount > 0
                  ? t('chat.dialog.scrollDownNew', { count: newMessagesBelowCount })
                  : t('chat.dialog.scrollDown')
              }
            >
              <KeyboardArrowDownIcon />
            </IconButton>
          </Badge>
        </Box>
      )}

      {/* Область ввода сообщения - фиксированная */}
      <Box sx={getChatComposerWrapSx()}>
      <Paper
        elevation={0}
        sx={getChatComposerShellSx(theme)}
      >
        {contact?.isBlocked ? (
          <Alert
            severity="info"
            icon={<BlockIcon fontSize="inherit" />}
            sx={{
              alignItems: 'center',
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            <Typography variant="body2">
              {contact.blockedByMe
                ? t('chat.dialog.blockedByMeBanner')
                : t('chat.dialog.blockedByPeerBanner')}
            </Typography>
          </Alert>
        ) : (
          <>
        {attachmentValidationError && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {attachmentValidationError}
          </Alert>
        )}
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
                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                sx={getChatComposerAttachmentSx(theme)}
              >
                {attachmentPreviewByIndex[index] ? (
                  <Box
                    component="button"
                    type="button"
                    aria-label={
                      attachmentPreviewByIndex[index]?.mediaType === 'video'
                        ? t('chat.dialog.openVideoFullscreen')
                        : t('chat.dialog.openPreviewFullscreen')
                    }
                    onClick={() => handleAttachmentPreviewOpen(index)}
                    sx={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      border: 0,
                      p: 0,
                      cursor: 'pointer',
                      bgcolor: 'transparent',
                      position: 'relative'
                    }}
                  >
                    {attachmentPreviewByIndex[index]?.mediaType === 'video' ? (
                      <>
                        {attachmentVideoPosters[index] ? (
                          <img
                            src={attachmentVideoPosters[index]}
                            alt=""
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              pointerEvents: 'none'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              bgcolor: 'grey.800',
                              pointerEvents: 'none'
                            }}
                          />
                        )}
                        <PlayCircleOutlineIcon
                          sx={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#fff',
                            fontSize: 28,
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
                            pointerEvents: 'none'
                          }}
                        />
                      </>
                    ) : (
                      <img
                        src={attachmentPreviewByIndex[index]?.url || ''}
                        alt={t('chat.dialog.attachmentAlt', { index: index + 1 })}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    )}
                  </Box>
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
                <IconButton
                  size="small"
                  aria-label={t('chat.dialog.removeAttachment')}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveAttachment(index);
                  }}
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    zIndex: 2,
                    width: 20,
                    height: 20,
                    p: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.55)',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.75)'
                    }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {replyingTo && (
          <Box sx={getChatDialogDraftBarSx(theme, 'primary')}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                {t('chat.dialog.replyTo')}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {replyingTo.text || t('chat.message.media')}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setReplyingTo(null)} aria-label="Отменить ответ">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {forwardingMessage && (
          <Box sx={getChatDialogDraftBarSx(theme, 'info')}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="caption" color="info.main" sx={{ fontWeight: 600 }}>
                {t('chat.dialog.forwarding')}
              </Typography>
              {forwardingSharedEvent ? (
                <SharedEventCard sharedEvent={forwardingSharedEvent} compact />
              ) : forwardingSharedNote ? (
                <SharedNoteCard sharedNote={forwardingSharedNote} compact />
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {forwardingMessage.text || t('chat.message.forwarded')}
                </Typography>
              )}
            </Box>
            <IconButton
              size="small"
              onClick={cancelForwardDraft}
              aria-label={t('chat.dialog.cancelForward')}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {sharingEvent && (
          <Box sx={getChatDialogDraftBarSx(theme, 'primary')}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                {t('chat.dialog.shareEvent')}
              </Typography>
              <SharedEventCard sharedEvent={sharingEvent} compact />
            </Box>
            <IconButton size="small" onClick={() => setSharingEvent(null)} aria-label={t('chat.dialog.cancelShareEvent')}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {sharingNote && (
          <Box sx={getChatDialogDraftBarSx(theme, 'primary')}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                {t('chat.dialog.shareNote')}
              </Typography>
              <SharedNoteCard sharedNote={sharingNote} compact />
            </Box>
            <IconButton size="small" onClick={() => setSharingNote(null)} aria-label={t('chat.dialog.cancelShareNote')}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {editingMessage && (
          <Box sx={getChatDialogDraftBarSx(theme, 'warning')}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                {t('chat.dialog.editing')}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {editingMessage.text || t('chat.message.noText')}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => {
                setEditingMessage(null);
                setMessageText('');
              }}
              aria-label={t('chat.dialog.cancelEdit')}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <ChatMessageInput
          value={messageText}
          onChange={(nextText) => {
            setMessageText(nextText);
            notifyTypingActivity(nextText, contact?.id);
          }}
          onSend={handleSendMessage}
          onFocus={handleMessageInputFocus}
          useIOSAccessoryFix={useIOSAccessoryFix}
          onAttachmentClick={handleAttachmentClick}
          attachmentDisabled={isPickingAttachments}
          placeholder={t('chat.input.placeholder')}
          sendDisabled={
            editingMessage
              ? !messageText.trim()
              : !forwardingMessage && !sharingEvent && !sharingNote && !messageText.trim() && attachments.length === 0
          }
        />
          </>
        )}
      </Paper>
      </Box>
      {isMobile ? (
        <ResponsiveDialog
          open={contextMenu !== null}
          onClose={handleContextMenuClose}
          mobileMaxHeight="auto"
        >
          <Box sx={{ py: 0.5 }}>
            {renderMessageActionItems()}
          </Box>
        </ResponsiveDialog>
      ) : (
        <Menu
          open={contextMenu !== null}
          onClose={handleContextMenuClose}
          anchorReference={contextMenu?.anchorEl ? 'anchorEl' : 'anchorPosition'}
          anchorEl={contextMenu?.anchorEl ?? null}
          anchorPosition={
            contextMenu?.mouseX != null && contextMenu?.mouseY != null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          slotProps={{
            paper: {
              sx: getChatContextMenuPaperSx(theme),
            },
          }}
        >
          {renderMessageActionItems()}
        </Menu>
      )}
      <ResponsiveDialog
        open={deleteModalOpen}
        onClose={handleDeleteModalClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={getChatDialogModalTitleSx()}>{t('chat.dialog.deleteTitle')}</DialogTitle>
        <DialogContent sx={getChatDialogModalContentSx()}>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            {t('chat.dialog.deleteConfirm')}
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 1.25,
              borderColor: 'divider',
              bgcolor: 'background.default'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {messageToDelete?.text || (messageToDelete?.attachments?.length ? t('chat.message.media') : t('chat.message.noTextPreview'))}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={getChatDialogModalActionsSx()}>
          <Button onClick={handleDeleteModalClose} variant="text">
            {t('chat.dialog.cancel')}
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            {t('chat.dialog.delete')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>

      <MediaViewerDialog
        open={Boolean(attachmentLightbox)}
        onClose={() => setAttachmentLightbox(null)}
        content={
          attachmentLightbox
            ? {
                url: attachmentLightbox.url,
                resourceType: attachmentLightbox.mediaType
              }
            : null
        }
      />

      <ContactProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        contact={contact}
      />

      <ResponsiveDialog
        open={optionsModalOpen}
        onClose={() => setOptionsModalOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={getChatDialogModalTitleSx()}>{t('chat.dialog.optionsTitle')}</DialogTitle>
        <DialogContent sx={getChatDialogModalContentSx()}>
          <Box sx={getChatMessageFontSizeControlSx(theme)}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {t('chat.dialog.messageFontSize')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('chat.dialog.messageFontSizeValue', { size: messageFontSizePx })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
              <IconButton
                size="small"
                onClick={decreaseMessageFontSize}
                disabled={!canDecreaseMessageFontSize}
                aria-label={t('chat.dialog.decreaseMessageFontSize')}
                sx={getChatMessageFontSizeButtonSx(theme)}
              >
                <TextDecreaseIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={increaseMessageFontSize}
                disabled={!canIncreaseMessageFontSize}
                aria-label={t('chat.dialog.increaseMessageFontSize')}
                sx={getChatMessageFontSizeButtonSx(theme)}
              >
                <TextIncreaseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ReportOutlinedIcon />}
            onClick={() => {
              setOptionsModalOpen(false);
              setReportModalOpen(true);
            }}
            disabled={!onSubmitReport}
            sx={getChatOptionsActionButtonSx(theme, 'warning')}
          >
            {t('chat.dialog.report')}
          </Button>
          {contact?.isBlocked && contact.blockedByMe && onUnblockUser ? (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LockOpenIcon />}
              onClick={() => {
                setOptionsModalOpen(false);
                setUnblockConfirmOpen(true);
              }}
              sx={getChatOptionsActionButtonSx(theme, 'primary')}
            >
              {t('chat.dialog.unblockUser')}
            </Button>
          ) : !contact?.isBlocked && onBlockUser ? (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<BlockIcon />}
              onClick={() => {
                setOptionsModalOpen(false);
                setBlockConfirmOpen(true);
              }}
              sx={getChatOptionsActionButtonSx(theme, 'error')}
            >
              {t('chat.dialog.blockUser')}
            </Button>
          ) : null}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => {
              setOptionsModalOpen(false);
              setClearConfirmOpen(true);
            }}
            sx={{ ...getChatOptionsActionButtonSx(theme, 'error'), mb: 0 }}
          >
            {t('chat.dialog.clearChat')}
          </Button>
        </DialogContent>
        <DialogActions sx={getChatDialogModalActionsSx()}>
          <Button onClick={() => setOptionsModalOpen(false)} variant="text" sx={{ textTransform: 'none', fontWeight: 600 }}>
            {t('chat.dialog.cancel')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>

      {onSubmitReport && contact && (
        <ChatReportModal
          open={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          contactName={contactDisplayName}
          onSubmit={onSubmitReport}
        />
      )}

      <ResponsiveDialog
        open={clearConfirmOpen}
        onClose={() => {
          if (!isClearingChat) {
            setClearConfirmOpen(false);
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={getChatDialogModalTitleSx()}>{t('chat.dialog.clearChatTitle')}</DialogTitle>
        <DialogContent sx={getChatDialogModalContentSx()}>
          <Typography variant="body2">
            {t('chat.dialog.clearChatConfirm')}
          </Typography>
        </DialogContent>
        <DialogActions sx={getChatDialogModalActionsSx()}>
          <Button
            onClick={() => setClearConfirmOpen(false)}
            variant="text"
            disabled={isClearingChat}
          >
            {t('chat.dialog.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={isClearingChat || !onClearChat}
            onClick={async () => {
              if (!onClearChat) return;
              try {
                setIsClearingChat(true);
                await onClearChat();
                setClearConfirmOpen(false);
              } finally {
                setIsClearingChat(false);
              }
            }}
          >
            {t('chat.dialog.clearChat')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={blockConfirmOpen}
        onClose={() => {
          if (!isBlocking) {
            setBlockConfirmOpen(false);
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={getChatDialogModalTitleSx()}>{t('chat.dialog.blockUserTitle')}</DialogTitle>
        <DialogContent sx={getChatDialogModalContentSx()}>
          <Typography variant="body2">
            {t('chat.dialog.blockUserConfirm', { name: contact?.name || '' })}
          </Typography>
        </DialogContent>
        <DialogActions sx={getChatDialogModalActionsSx()}>
          <Button
            onClick={() => setBlockConfirmOpen(false)}
            variant="text"
            disabled={isBlocking}
          >
            {t('chat.dialog.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={isBlocking || !onBlockUser}
            onClick={async () => {
              if (!onBlockUser) return;
              try {
                setIsBlocking(true);
                await onBlockUser();
                setBlockConfirmOpen(false);
              } finally {
                setIsBlocking(false);
              }
            }}
          >
            {t('chat.dialog.blockUser')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={unblockConfirmOpen}
        onClose={() => {
          if (!isUnblocking) {
            setUnblockConfirmOpen(false);
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={getChatDialogModalTitleSx()}>{t('chat.dialog.unblockUserTitle')}</DialogTitle>
        <DialogContent sx={getChatDialogModalContentSx()}>
          <Typography variant="body2">
            {t('chat.dialog.unblockUserConfirm', { name: contact?.name || '' })}
          </Typography>
        </DialogContent>
        <DialogActions sx={getChatDialogModalActionsSx()}>
          <Button
            onClick={() => setUnblockConfirmOpen(false)}
            variant="text"
            disabled={isUnblocking}
          >
            {t('chat.dialog.cancel')}
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={isUnblocking || !onUnblockUser}
            onClick={async () => {
              if (!onUnblockUser) return;
              try {
                setIsUnblocking(true);
                await onUnblockUser();
                setUnblockConfirmOpen(false);
              } finally {
                setIsUnblocking(false);
              }
            }}
          >
            {t('chat.dialog.unblockUser')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </Box>
  );
};

export default ChatDialog; 