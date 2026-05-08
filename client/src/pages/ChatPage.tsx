import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress
  ,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ChatList, { Contact } from '../components/Chat/ChatList';
import ChatDialog, { MessageForwardRef, MessageReplyRef, MessageType } from '../components/Chat/ChatDialog';
import Games from '../components/Chat/Games';
import axios from 'axios';
import { API_URL } from '../config';
import socketService from '../services/socketService';
import { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';

// Временные данные для демонстрации
const MOCK_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Анна Смирнова',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    lastMessage: {
      text: 'Привет! Как дела? Что делаешь сегодня вечером?',
      timestamp: new Date().toISOString(),
      isRead: false
    }
  },
  {
    id: '2',
    name: 'Иван Петров',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    lastMessage: {
      text: 'Спасибо за фотографии! Они очень красивые.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: true
    }
  },
  {
    id: '3',
    name: 'Екатерина Иванова',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    lastMessage: {
      text: 'Давай встретимся завтра в 18:00 у кафе.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isRead: true
    }
  }
];

const MOCK_MESSAGES: Record<string, MessageType[]> = {
  '1': [
    {
      id: '1',
      senderId: '1',
      text: 'Привет! Как твои дела?',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '2',
      senderId: 'current-user',
      text: 'Привет! Все хорошо, спасибо. Как ты?',
      timestamp: new Date(Date.now() - 3500000).toISOString()
    },
    {
      id: '3',
      senderId: '1',
      text: 'У меня тоже все отлично! Что делаешь сегодня вечером?',
      timestamp: new Date(Date.now() - 3400000).toISOString()
    },
    {
      id: '4',
      senderId: 'current-user',
      text: 'Пока нет планов. Может, сходим куда-нибудь?',
      timestamp: new Date(Date.now() - 3300000).toISOString(),
      attachments: [
        {
          type: 'image',
          url: 'https://source.unsplash.com/random/400x300/?cafe'
        }
      ]
    },
    {
      id: '5',
      senderId: '1',
      text: 'Отличная идея! Давай сходим в это кафе.',
      timestamp: new Date().toISOString()
    }
  ],
  '2': [
    {
      id: '1',
      senderId: '2',
      text: 'Привет! Посмотри фотографии с нашей последней поездки.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      attachments: [
        {
          type: 'image',
          url: 'https://source.unsplash.com/random/400x300/?travel'
        },
        {
          type: 'image',
          url: 'https://source.unsplash.com/random/400x300/?nature'
        }
      ]
    },
    {
      id: '2',
      senderId: 'current-user',
      text: 'Вау! Очень красиво! Спасибо за фотографии.',
      timestamp: new Date(Date.now() - 82800000).toISOString()
    }
  ],
  '3': [
    {
      id: '1',
      senderId: 'current-user',
      text: 'Привет! Когда мы встречаемся завтра?',
      timestamp: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: '2',
      senderId: '3',
      text: 'Давай в 18:00 у кафе на Пушкинской.',
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '3',
      senderId: 'current-user',
      text: 'Отлично! Буду ждать.',
      timestamp: new Date(Date.now() - 82800000).toISOString()
    }
  ]
};

interface SearchUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  hasExistingChat: boolean;
}

const GLOBAL_SEARCH_PAGE_SIZE = 20;
const MESSAGE_PAGE_SIZE = 30;

type ChatContact = Contact & {
  isPartner?: boolean;
};

const getMessagePreviewText = (message: Pick<MessageType, 'text' | 'attachments' | 'forwardFrom'>) => {
  const hasMedia = Boolean(message.attachments && message.attachments.length > 0);
  if (hasMedia && !message.text) return 'Медиафайл';
  if (!message.text && message.forwardFrom) return 'Пересланное сообщение';
  return message.text || '';
};

const ChatPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [isRestoringChatPosition, setIsRestoringChatPosition] = useState(false);
  const [restoredScrollTop, setRestoredScrollTop] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMoreGlobalSearch, setIsLoadingMoreGlobalSearch] = useState(false);
  const [globalSearchPage, setGlobalSearchPage] = useState(1);
  const [hasMoreGlobalSearch, setHasMoreGlobalSearch] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardSourceMessage, setForwardSourceMessage] = useState<MessageType | null>(null);
  const [pendingForwardMessage, setPendingForwardMessage] = useState<MessageForwardRef | null>(null);
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');
  const [forwardDebouncedQuery, setForwardDebouncedQuery] = useState('');
  const [forwardGlobalResults, setForwardGlobalResults] = useState<SearchUser[]>([]);
  const [isForwardSearching, setIsForwardSearching] = useState(false);
  const [deleteToast, setDeleteToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const { user } = useAuth();
  const { setShowBottomNav } = useNavigation();
  const CURRENT_USER_ID = user?._id;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const selectedContactIdRef = useRef<string | null>(null);
  const pendingDeleteRef = useRef<{
    message: MessageType;
    index: number;
    contactId: string;
  } | null>(null);
  const hasRestoredSelectedChatRef = useRef(false);
  const selectedChatStorageKey = useCallback(() => {
    if (!CURRENT_USER_ID) return null;
    return `chat:selected:${CURRENT_USER_ID}`;
  }, [CURRENT_USER_ID]);

  const getChatScrollStorageKey = useCallback((contactId: string) => {
    if (!CURRENT_USER_ID) return null;
    return `chat:scroll:${CURRENT_USER_ID}:${contactId}`;
  }, [CURRENT_USER_ID]);

  const getSavedScrollState = useCallback((contactId: string) => {
    const key = getChatScrollStorageKey(contactId);
    if (!key) return null;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as { page?: number; scrollTop?: number };
      const page = Math.max(1, Number(parsed.page) || 1);
      const scrollTop = Math.max(0, Number(parsed.scrollTop) || 0);
      return { page, scrollTop };
    } catch (error) {
      return null;
    }
  }, [getChatScrollStorageKey]);

  const saveScrollState = useCallback((contactId: string, scrollTop: number) => {
    const key = getChatScrollStorageKey(contactId);
    if (!key) return;

    const payload = {
      page: Math.max(1, messagesPage),
      scrollTop: Math.max(0, Math.round(scrollTop)),
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(key, JSON.stringify(payload));
  }, [getChatScrollStorageKey, messagesPage]);

  const saveSelectedChatId = useCallback((contactId: string | null) => {
    const key = selectedChatStorageKey();
    if (!key) return;

    if (contactId) {
      localStorage.setItem(key, contactId);
      return;
    }

    localStorage.removeItem(key);
  }, [selectedChatStorageKey]);

  const prepareDialogRestoreState = useCallback((contactId: string) => {
    const savedState = getSavedScrollState(contactId);
    const targetPage = savedState?.page || 1;
    const needsRestore = Boolean(savedState && (targetPage > 1 || (savedState.scrollTop ?? 0) > 0));

    // Переключаемся в режим восстановления до первого рендера диалога
    setIsRestoringChatPosition(needsRestore);
    setRestoredScrollTop(null);
  }, [getSavedScrollState]);

  useEffect(() => {
    hasRestoredSelectedChatRef.current = false;
  }, [CURRENT_USER_ID]);

  useEffect(() => {
    if (!CURRENT_USER_ID || selectedContactId || hasRestoredSelectedChatRef.current) {
      return;
    }

    hasRestoredSelectedChatRef.current = true;
    const key = selectedChatStorageKey();
    if (!key) return;

    const savedContactId = localStorage.getItem(key);
    if (!savedContactId) return;

    setTabValue(0);
    prepareDialogRestoreState(savedContactId);
    setSelectedContactId(savedContactId);
  }, [CURRENT_USER_ID, selectedContactId, prepareDialogRestoreState, selectedChatStorageKey]);

  const sortContactsByLastMessageDesc = useCallback((contactsToSort: ChatContact[]) => {
    return [...contactsToSort].sort((a, b) => {
      if (a.isPartner && !b.isPartner) return -1;
      if (!a.isPartner && b.isPartner) return 1;

      const aTime = new Date(a.lastMessage.timestamp).getTime();
      const bTime = new Date(b.lastMessage.timestamp).getTime();
      return bTime - aTime;
    });
  }, []);

  // Функция обновления последнего сообщения в контакте
  const updateContactLastMessage = useCallback((
    contactId: string,
    text: string,
    timestamp: string,
    isRead: boolean,
    hasMedia?: boolean,
    senderId?: string,
    messageId?: string,
    isPending?: boolean
  ) => {
    setContacts(prevContacts => 
      sortContactsByLastMessageDesc(prevContacts.map(contact => 
        contact.id === contactId 
          ? {
              ...contact,
              lastMessage: {
                ...contact.lastMessage,
                id: messageId ?? contact.lastMessage.id,
                senderId: senderId ?? contact.lastMessage.senderId,
                text,
                timestamp,
                isRead,
                hasMedia,
                isPending: isPending ?? false
              }
            }
          : contact
      ))
    );
  }, [sortContactsByLastMessageDesc]);

  const updateContactLastMessageAfterDelete = useCallback((contactId: string, nextMessages: MessageType[]) => {
    setContacts((prevContacts) =>
      sortContactsByLastMessageDesc(prevContacts.map((contact) => {
        if (contact.id !== contactId) return contact;

        const nextLastMessage = nextMessages[nextMessages.length - 1];
        if (!nextLastMessage) {
          return {
            ...contact,
            lastMessage: {
              ...contact.lastMessage,
              id: '',
              senderId: '',
              text: 'Нет сообщений',
              timestamp: new Date().toISOString(),
              isRead: true,
              hasMedia: false,
              isPending: false
            },
            unreadCount: 0
          };
        }

        const hasMedia = Boolean(nextLastMessage.attachments && nextLastMessage.attachments.length > 0);
        return {
          ...contact,
          lastMessage: {
            ...contact.lastMessage,
            id: nextLastMessage.id,
            senderId: nextLastMessage.senderId,
            text: getMessagePreviewText(nextLastMessage),
            timestamp: nextLastMessage.timestamp,
            isRead: nextLastMessage.senderId === CURRENT_USER_ID || Boolean(nextLastMessage.isRead),
            hasMedia,
            isPending: nextLastMessage.id.startsWith('temp-')
          }
        };
      }))
    );
  }, [CURRENT_USER_ID, sortContactsByLastMessageDesc]);

  // Инициализация сокета
  useEffect(() => {
    if (!CURRENT_USER_ID) {
      return;
    }

    const newSocket = socketService.initialize(CURRENT_USER_ID);
    setSocket(newSocket);

    // Обработчики событий сокета
    newSocket.on('new_message', (message: MessageType) => {
      const isCurrentDialogOpen = selectedContactId === message.senderId;

      // Если открыт диалог с отправителем, добавляем сообщение и отмечаем как прочитанное
      if (isCurrentDialogOpen) {
        setMessages(prevMessages => [...prevMessages, message]);
        socketService.markMessageAsRead(message.id);
      }

      // Обновляем список контактов
      const hasMedia = message.attachments && message.attachments.length > 0;
      const displayText = getMessagePreviewText(message);
      setContacts(prevContacts =>
        sortContactsByLastMessageDesc(prevContacts.map(contact =>
          contact.id === message.senderId
            ? {
                ...contact,
                unreadCount: isCurrentDialogOpen ? 0 : (contact.unreadCount || 0) + 1,
                lastMessage: {
                  id: message.id,
                  senderId: message.senderId,
                  text: displayText,
                  timestamp: message.timestamp,
                  isRead: isCurrentDialogOpen,
                  hasMedia,
                  isPending: false
                }
              }
            : contact
        ))
      );
    });

    newSocket.on('message_sent', (message: MessageType) => {
      // Заменяем временное сообщение на реальное или добавляем новое
      setMessages(prevMessages => {
        const tempMessageIndex = prevMessages.findIndex((msg) =>
          msg.id.startsWith('temp-') &&
          (
            (Boolean(message.clientTempId) && msg.clientTempId === message.clientTempId) ||
            msg.text === message.text
          )
        );
        
        if (tempMessageIndex !== -1) {
          // Заменяем временное сообщение на реальное
          const newMessages = [...prevMessages];
          const tempMessage = newMessages[tempMessageIndex];
          newMessages[tempMessageIndex] = {
            ...message,
            replyTo: message.replyTo || tempMessage.replyTo,
            forwardFrom: message.forwardFrom || tempMessage.forwardFrom
          };
          return newMessages;
        } else {
          // Добавляем новое сообщение (если временного не было найдено)
          return [...prevMessages, message];
        }
      });
      
      // Обновляем последнее сообщение в списке контактов
      if (selectedContactId) {
        const hasMedia = message.attachments && message.attachments.length > 0;
        const displayText = getMessagePreviewText(message);
        updateContactLastMessage(
          selectedContactId,
          displayText,
          message.timestamp,
          false,
          hasMedia,
          message.senderId,
          message.id,
          false
        );
      }
    });

    newSocket.on('message_read', (messageId: string) => {
      // Обновляем статус сообщения как прочитанное
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );

      setContacts(prevContacts =>
        prevContacts.map(contact =>
          contact.lastMessage.id === messageId
            ? {
                ...contact,
                lastMessage: {
                  ...contact.lastMessage,
                  isRead: true
                }
              }
            : contact
        )
      );
    });

    newSocket.on('message_edited', (message: MessageType) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === message.id ? { ...msg, ...message } : msg))
      );

      setContacts((prevContacts) =>
        sortContactsByLastMessageDesc(prevContacts.map((contact) => {
          if (contact.lastMessage.id !== message.id) {
            return contact;
          }

          const hasMedia = Boolean(message.attachments && message.attachments.length > 0);
          return {
            ...contact,
            lastMessage: {
              ...contact.lastMessage,
              text: getMessagePreviewText(message),
              hasMedia
            }
          };
        }))
      );
    });

    newSocket.on('message_deleted', (payload: { messageId: string; senderId: string; receiverId: string }) => {
      const contactId = payload.senderId === CURRENT_USER_ID ? payload.receiverId : payload.senderId;
      setMessages((prevMessages) => {
        const nextMessages = prevMessages.filter((message) => message.id !== payload.messageId);
        if (selectedContactIdRef.current === contactId) {
          updateContactLastMessageAfterDelete(contactId, nextMessages);
        }
        return nextMessages;
      });

      if (pendingDeleteRef.current?.message.id === payload.messageId) {
        pendingDeleteRef.current = null;
        setDeleteToast({
          open: true,
          message: 'Сообщение удалено',
          severity: 'success'
        });
      }
    });

    newSocket.on('error', (payload: { message?: string }) => {
      if (!pendingDeleteRef.current) return;

      const rollback = pendingDeleteRef.current;
      pendingDeleteRef.current = null;

      setMessages((prevMessages) => {
        const alreadyExists = prevMessages.some((message) => message.id === rollback.message.id);
        if (alreadyExists) {
          return prevMessages;
        }

        const nextMessages = [...prevMessages];
        nextMessages.splice(rollback.index, 0, rollback.message);

        if (selectedContactIdRef.current === rollback.contactId) {
          updateContactLastMessageAfterDelete(rollback.contactId, nextMessages);
        }

        return nextMessages;
      });

      setDeleteToast({
        open: true,
        message: payload?.message || 'Не удалось удалить сообщение',
        severity: 'error'
      });
    });

    return () => {
      socketService.disconnect();
    };
  }, [CURRENT_USER_ID, selectedContactId, updateContactLastMessage, updateContactLastMessageAfterDelete]);

  // Загрузка контактов
  useEffect(() => {
    fetchContacts();
  }, []);

  // Загрузка сообщений при выборе контакта
  useEffect(() => {
    selectedContactIdRef.current = selectedContactId;
  }, [selectedContactId]);

  // Загрузка сообщений при выборе контакта
  useEffect(() => {
    if (selectedContactId) {
      const initializeChat = async () => {
        const savedState = getSavedScrollState(selectedContactId);
        const targetPage = savedState?.page || 1;
        const needsRestore = Boolean(savedState && (targetPage > 1 || (savedState.scrollTop ?? 0) > 0));

        setRestoredScrollTop(null);
        setIsRestoringChatPosition(needsRestore);
        await fetchMessages(selectedContactId, 1, false);

        try {
          for (let page = 2; page <= targetPage; page += 1) {
            if (selectedContactIdRef.current !== selectedContactId) {
              return;
            }
            await fetchMessages(selectedContactId, page, true);
          }

          if (selectedContactIdRef.current === selectedContactId) {
            setRestoredScrollTop(savedState?.scrollTop ?? null);
          }
        } finally {
          if (selectedContactIdRef.current === selectedContactId) {
            setIsRestoringChatPosition(false);
          }
        }
      };

      initializeChat();
    } else {
      setIsRestoringChatPosition(false);
    }
  }, [selectedContactId, getSavedScrollState]);

  // Управление видимостью нижнего меню
  useEffect(() => {
    if (isMobile) {
      // Скрываем меню когда открыт чат с контактом
      if (selectedContactId) {
        setShowBottomNav(false);
      } else {
        // Показываем меню когда в списке контактов
        setShowBottomNav(true);
      }
    }
    
    // При размонтировании компонента возвращаем меню
    return () => {
      if (isMobile) {
        setShowBottomNav(true);
      }
    };
  }, [isMobile, selectedContactId, setShowBottomNav]);

  // Дебаунс ввода поиска
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setForwardDebouncedQuery(forwardSearchQuery.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [forwardSearchQuery]);

  const fetchGlobalSearchPage = useCallback(async (query: string, page: number, append: boolean) => {
    if (!query) return;

    try {
      if (append) {
        setIsLoadingMoreGlobalSearch(true);
      } else {
        setIsSearching(true);
      }

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/contacts/search`, {
        params: { query, page, limit: GLOBAL_SEARCH_PAGE_SIZE },
        headers: { Authorization: `Bearer ${token}` }
      });

      const responseData = response.data;
      const items: SearchUser[] = Array.isArray(responseData) ? responseData : (responseData.items || []);
      const hasMore = Array.isArray(responseData)
        ? items.length >= GLOBAL_SEARCH_PAGE_SIZE
        : Boolean(responseData.hasMore);

      setGlobalSearchResults(prev =>
        append
          ? [...prev, ...items.filter(item => !prev.some(existing => existing.id === item.id))]
          : items
      );
      setGlobalSearchPage(page);
      setHasMoreGlobalSearch(hasMore);
    } catch (error) {
      console.error('Ошибка глобального поиска пользователей:', error);
      if (!append) {
        setGlobalSearchResults([]);
      }
      setHasMoreGlobalSearch(false);
    } finally {
      setIsSearching(false);
      setIsLoadingMoreGlobalSearch(false);
    }
  }, []);

  const fetchForwardGlobalSearch = useCallback(async (query: string) => {
    if (!query) {
      setForwardGlobalResults([]);
      return;
    }

    try {
      setIsForwardSearching(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/contacts/search`, {
        params: { query, page: 1, limit: GLOBAL_SEARCH_PAGE_SIZE },
        headers: { Authorization: `Bearer ${token}` }
      });

      const responseData = response.data;
      const items: SearchUser[] = Array.isArray(responseData) ? responseData : (responseData.items || []);
      setForwardGlobalResults(items);
    } catch (error) {
      console.error('Ошибка поиска для пересылки:', error);
      setForwardGlobalResults([]);
    } finally {
      setIsForwardSearching(false);
    }
  }, []);

  // Глобальный поиск пользователей по username/email
  useEffect(() => {
    if (!debouncedSearchQuery) {
      setGlobalSearchResults([]);
      setGlobalSearchPage(1);
      setHasMoreGlobalSearch(false);
      setIsSearching(false);
      setIsLoadingMoreGlobalSearch(false);
      return;
    }

    fetchGlobalSearchPage(debouncedSearchQuery, 1, false);
  }, [debouncedSearchQuery, fetchGlobalSearchPage]);

  useEffect(() => {
    if (!forwardModalOpen) return;
    if (!forwardDebouncedQuery) {
      setForwardGlobalResults([]);
      setIsForwardSearching(false);
      return;
    }
    fetchForwardGlobalSearch(forwardDebouncedQuery);
  }, [forwardDebouncedQuery, forwardModalOpen, fetchForwardGlobalSearch]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      // Реальный запрос к API (userId берется из токена через authMiddleware)
      const response = await axios.get(`${API_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(sortContactsByLastMessageDesc(response.data));
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке контактов:', error);
      setIsLoading(false);
    }
  };

  const ensureContactInList = (user: {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar: string;
  }) => {
    setContacts(prevContacts => {
      const existing = prevContacts.find(contact => contact.id === user.id);
      if (existing) {
        return prevContacts;
      }

      const newContact: ChatContact = {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isPartner: false,
        unreadCount: 0,
        lastMessage: {
          id: '',
          senderId: '',
          text: 'Нет сообщений',
          timestamp: new Date().toISOString(),
          isRead: true,
          hasMedia: false,
          isPending: false
        }
      };

      return sortContactsByLastMessageDesc([newContact, ...prevContacts]);
    });
  };

  const fetchMessages = async (contactId: string, page = 1, appendOlder = false) => {
    try {
      if (appendOlder) {
        setIsLoadingOlderMessages(true);
      } else {
        setIsLoading(true);
      }
      const token = localStorage.getItem('token');
      
      if (!token) {
        if (appendOlder) {
          setIsLoadingOlderMessages(false);
        } else {
          setIsLoading(false);
        }
        return;
      }
      
      // Реальный запрос к API (userId берется из токена через authMiddleware)
      const response = await axios.get(`${API_URL}/api/messages`, {
        params: { contactId, page, limit: MESSAGE_PAGE_SIZE },
        headers: { Authorization: `Bearer ${token}` }
      });

      const responseData = response.data;
      const items: MessageType[] = Array.isArray(responseData) ? responseData : (responseData.items || []);
      const hasMore = Array.isArray(responseData)
        ? false
        : Boolean(responseData.hasMore);

      setMessages((prevMessages) => appendOlder ? [...items, ...prevMessages] : items);
      setMessagesPage(page);
      setHasMoreMessages(hasMore);
    } catch (error: any) {
      console.error('Ошибка при загрузке сообщений:', error);
    } finally {
      if (appendOlder) {
        setIsLoadingOlderMessages(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const loadOlderMessages = useCallback(() => {
    if (!selectedContactId || isLoading || isLoadingOlderMessages || isRestoringChatPosition || !hasMoreMessages) {
      return;
    }

    fetchMessages(selectedContactId, messagesPage + 1, true);
  }, [selectedContactId, isLoading, isLoadingOlderMessages, isRestoringChatPosition, hasMoreMessages, messagesPage]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1) {
      saveSelectedChatId(null);
      setSelectedContactId(null);
      // Показываем нижнее меню при переходе на вкладку игр
      if (isMobile) {
        setShowBottomNav(true);
      }
    }
  };

  const handleSelectContact = (contactId: string) => {
    prepareDialogRestoreState(contactId);
    saveSelectedChatId(contactId);
    setSelectedContactId(contactId);
    // Скрываем нижнее меню на мобильных при открытии чата
    if (isMobile) {
      setShowBottomNav(false);
    }
  };

  const handleSelectGlobalUser = (user: SearchUser) => {
    ensureContactInList(user);
    prepareDialogRestoreState(user.id);
    saveSelectedChatId(user.id);
    setSelectedContactId(user.id);
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setGlobalSearchResults([]);

    if (isMobile) {
      setShowBottomNav(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setGlobalSearchResults([]);
    setGlobalSearchPage(1);
    setHasMoreGlobalSearch(false);
    setIsSearching(false);
    setIsLoadingMoreGlobalSearch(false);
  };

  const handleStartForwardMessage = (message: MessageType) => {
    setForwardSourceMessage(message);
    setForwardModalOpen(true);
    setForwardSearchQuery('');
    setForwardDebouncedQuery('');
    setForwardGlobalResults([]);
    setIsForwardSearching(false);
  };

  const resolveForwardSenderMeta = (message: MessageType) => {
    if (!CURRENT_USER_ID) {
      return { senderName: undefined, senderAvatar: undefined };
    }

    if (message.senderId === CURRENT_USER_ID) {
      const selfName = user?.firstName || user?.username || 'Вы';
      const selfAvatar = user?.avatar || '';
      return { senderName: selfName, senderAvatar: selfAvatar };
    }

    if (selectedContactId && message.senderId === selectedContactId) {
      const senderContact = contacts.find((contact) => contact.id === selectedContactId);
      return {
        senderName: senderContact?.name || senderContact?.username || selectedContactId,
        senderAvatar: senderContact?.avatar || ''
      };
    }

    const knownContact = contacts.find((contact) => contact.id === message.senderId);
    return {
      senderName: knownContact?.name || knownContact?.username || message.senderId,
      senderAvatar: knownContact?.avatar || ''
    };
  };

  const handleSelectForwardTarget = (target: SearchUser | ChatContact) => {
    ensureContactInList({
      id: target.id,
      name: target.name,
      username: (target as SearchUser).username || target.username || '',
      email: (target as SearchUser).email || target.email || '',
      avatar: target.avatar
    });

    if (forwardSourceMessage) {
      const forwardSenderMeta = resolveForwardSenderMeta(forwardSourceMessage);
      setPendingForwardMessage({
        id: forwardSourceMessage.id,
        text: forwardSourceMessage.text || (forwardSourceMessage.attachments?.length ? 'Медиафайл' : ''),
        senderId: forwardSourceMessage.senderId,
        senderName: forwardSenderMeta.senderName,
        senderAvatar: forwardSenderMeta.senderAvatar
      });
    }

    prepareDialogRestoreState(target.id);
    saveSelectedChatId(target.id);
    setSelectedContactId(target.id);
    setForwardModalOpen(false);
    setForwardSourceMessage(null);
    if (isMobile) {
      setShowBottomNav(false);
    }
  };

  const handleOpenChatWithUser = (userId: string) => {
    if (!userId || userId === CURRENT_USER_ID) return;
    prepareDialogRestoreState(userId);
    saveSelectedChatId(userId);
    setSelectedContactId(userId);
    if (isMobile) {
      setShowBottomNav(false);
    }
  };

  const loadMoreGlobalSearch = useCallback(() => {
    if (!debouncedSearchQuery || isSearching || isLoadingMoreGlobalSearch || !hasMoreGlobalSearch) {
      return;
    }

    fetchGlobalSearchPage(debouncedSearchQuery, globalSearchPage + 1, true);
  }, [
    debouncedSearchQuery,
    fetchGlobalSearchPage,
    globalSearchPage,
    hasMoreGlobalSearch,
    isLoadingMoreGlobalSearch,
    isSearching
  ]);

  const handleSearchListScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (!searchQuery.trim()) return;

    const element = event.currentTarget;
    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distanceToBottom < 120) {
      loadMoreGlobalSearch();
    }
  }, [loadMoreGlobalSearch, searchQuery]);

  const handleReachMessagesEnd = useCallback(() => {
    if (!selectedContactId) {
      return;
    }

    const unreadIncomingMessageIds = messages
      .filter((message) => message.senderId === selectedContactId && message.isRead === false)
      .map((message) => message.id);

    if (unreadIncomingMessageIds.length === 0) {
      return;
    }

    unreadIncomingMessageIds.forEach((messageId) => {
      socketService.markMessageAsRead(messageId);
    });

    setMessages((prevMessages) =>
      prevMessages.map((message) =>
        unreadIncomingMessageIds.includes(message.id)
          ? { ...message, isRead: true }
          : message
      )
    );

    setContacts((prevContacts) =>
      prevContacts.map((contact) =>
        contact.id === selectedContactId
          ? {
              ...contact,
              lastMessage: {
                ...contact.lastMessage,
                isRead: true
              },
              unreadCount: 0
            }
          : contact
      )
    );
  }, [messages, selectedContactId]);

  const handleBackToList = (scrollTop = 0) => {
    if (selectedContactId) {
      saveScrollState(selectedContactId, scrollTop);
    }
    saveSelectedChatId(null);
    setSelectedContactId(null);
    setRestoredScrollTop(null);
    // Показываем нижнее меню на мобильных при возврате к списку
    if (isMobile) {
      setShowBottomNav(true);
    }
  };

  const handleDialogScrollPositionChange = useCallback((scrollTop: number) => {
    setRestoredScrollTop(scrollTop);
    if (selectedContactId) {
      saveScrollState(selectedContactId, scrollTop);
    }
  }, [selectedContactId, saveScrollState]);

  const handleSendMessage = (
    text: string,
    attachments?: File[],
    replyTo?: MessageReplyRef | null,
    forwardFrom?: MessageForwardRef | null
  ) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    if (!selectedContactId || !CURRENT_USER_ID) return;
    const trimmedText = text.trim();
    const isForwardOnly = Boolean(forwardFrom);
    if (!isForwardOnly && !trimmedText) return;

    // Загрузка вложений в Cloudinary (если есть)
    const uploadAttachments = async () => {
      if (!attachments || attachments.length === 0) {
        return [];
      }

      const formData = new FormData();
      attachments.forEach(file => {
        formData.append('media', file);
      });

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/api/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
        });

        return response.data.uploads.map((item: any) => ({
          type: item.resourceType,
          url: item.url,
          publicId: item.publicId
        }));
      } catch (error) {
        console.error('Ошибка при загрузке вложений:', error);
        return [];
      }
    };

    // Отправка сообщения через сокет после загрузки вложений
    const sendMessageWithAttachments = async () => {
      const uploadedAttachments = await uploadAttachments();
      
      // Отправляем сообщение через сокет
      const tempClientId = newMessage.clientTempId;
      socketService.sendMessage(
        selectedContactId,
        trimmedText,
        uploadedAttachments,
        replyTo || null,
        forwardFrom || null,
        tempClientId
      );
    };

    // Временно добавляем сообщение локально для мгновенного отображения
    const newMessage: MessageType = {
      id: `temp-${uniqueSuffix}`,
      clientTempId: `client-temp-${uniqueSuffix}`,
      senderId: CURRENT_USER_ID,
      text: trimmedText,
      timestamp: new Date().toISOString(),
      replyTo: replyTo || undefined,
      forwardFrom: forwardFrom || undefined,
      attachments: attachments?.map(file => ({
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: URL.createObjectURL(file)
      }))
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    updateContactLastMessage(
      selectedContactId,
      trimmedText || (forwardFrom ? 'Пересланное сообщение' : (attachments && attachments.length > 0 ? 'Медиафайл' : '')),
      newMessage.timestamp,
      false,
      Boolean(attachments && attachments.length > 0),
      CURRENT_USER_ID,
      newMessage.id,
      true
    );
    
    // Вызываем функцию для отправки сообщения через API
    sendMessageWithAttachments();
  };

  const handleEditMessage = (messageId: string, text: string) => {
    if (!selectedContactId || !CURRENT_USER_ID) return;

    const trimmedText = text.trim();
    if (!trimmedText) return;

    setMessages((prevMessages) =>
      prevMessages.map((message) =>
        message.id === messageId
          ? { ...message, text: trimmedText, editedAt: new Date().toISOString() }
          : message
      )
    );

    setContacts((prevContacts) =>
      sortContactsByLastMessageDesc(prevContacts.map((contact) => {
        if (contact.id !== selectedContactId || contact.lastMessage.id !== messageId) {
          return contact;
        }

        return {
          ...contact,
          lastMessage: {
            ...contact.lastMessage,
            text: trimmedText,
            hasMedia: false
          }
        };
      }))
    );

    socketService.editMessage(messageId, trimmedText);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!selectedContactId || !CURRENT_USER_ID) return;

    setMessages((prevMessages) => {
      const index = prevMessages.findIndex((message) => message.id === messageId);
      const messageToDelete = prevMessages[index];
      if (!messageToDelete) {
        setDeleteToast({
          open: true,
          message: 'Не удалось удалить сообщение',
          severity: 'error'
        });
        return prevMessages;
      }

      pendingDeleteRef.current = {
        message: messageToDelete,
        index,
        contactId: selectedContactId
      };

      const nextMessages = prevMessages.filter((message) => message.id !== messageId);
      updateContactLastMessageAfterDelete(selectedContactId, nextMessages);
      return nextMessages;
    });

    socketService.deleteMessage(messageId);
  };

  const selectedContact = contacts.find(contact => contact.id === selectedContactId);
  const immediateQuery = searchQuery.trim().toLowerCase();
  const hasSearch = Boolean(immediateQuery);
  const filteredExistingContacts = hasSearch
    ? contacts.filter(contact =>
        contact.name.toLowerCase().includes(immediateQuery) ||
        (contact.username || '').toLowerCase().includes(immediateQuery) ||
        (contact.email || '').toLowerCase().includes(immediateQuery)
      )
    : contacts;
  const filteredGlobalResults = globalSearchResults.filter(
    user => !filteredExistingContacts.some(contact => contact.id === user.id)
  );
  const forwardImmediateQuery = forwardSearchQuery.trim().toLowerCase();
  const forwardFilteredContacts = forwardImmediateQuery
    ? contacts.filter(contact =>
        contact.name.toLowerCase().includes(forwardImmediateQuery) ||
        (contact.username || '').toLowerCase().includes(forwardImmediateQuery) ||
        (contact.email || '').toLowerCase().includes(forwardImmediateQuery)
      )
    : contacts;
  const forwardFilteredGlobalResults = forwardGlobalResults.filter(
    (user) => !forwardFilteredContacts.some((contact) => contact.id === user.id)
  );

  const pageHeight = isMobile
    ? selectedContactId
      ? '100vh'
      : 'calc(100vh - 72px)'
    : 'calc(100vh - 64px)';

  return (
    <Box sx={{ 
      height: pageHeight, // На мобильных убираем резерв под BottomNav в открытом диалоге
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden' // Блокируем скролл страницы, скролл только во внутренних контейнерах
    }}>
      {/* Скрываем табы когда открыт чат с контактом на мобильных */}
      {(!isMobile || !selectedContactId) && (
        <Box sx={{ 
          borderBottom: 0,
          flexShrink: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          bgcolor: 'background.paper',
          boxShadow: 'none'
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="chat tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-iconWrapper': {
                fontSize: '1rem'
              },
              '& .MuiTab-root': {
                minHeight: 'auto',
                padding: 0,
                paddingTop: 2,
                fontSize: '12px'
              }
            }}
          >
            <Tab icon={<ChatIcon fontSize="small" />} iconPosition="start" label="Чат" />
            <Tab icon={<SportsEsportsIcon fontSize="small" />} iconPosition="start" label="Игры" />
          </Tabs>
          {tabValue === 0 && (!isMobile || !selectedContactId) && (
            <Box sx={{ px: 2, pb: 1, pt: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Поиск по логину или почте"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {isSearching ? (
                        <CircularProgress size={18} />
                      ) : (
                        searchQuery && (
                          <IconButton size="small" onClick={handleClearSearch} aria-label="Очистить поиск">
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        )
                      )}
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tabValue === 0 ? (
          <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
            {/* На мобильных устройствах показываем либо список, либо диалог */}
            {(!isMobile || !selectedContactId) && (
              <Box sx={{ 
                width: isMobile || selectedContactId ? '100%' : '30%', 
                borderRight: selectedContactId && !isMobile ? 1 : 0, 
                borderColor: 'divider',
                display: isMobile && selectedContactId ? 'none' : 'block',
                overflow: 'auto'
              }}
              onScroll={handleSearchListScroll}
              >
                {hasSearch ? (
                  <Box>
                    {filteredExistingContacts.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
                          Ваши чаты
                        </Typography>
                        <ChatList
                          contacts={filteredExistingContacts}
                          onSelectContact={handleSelectContact}
                          selectedContactId={selectedContactId}
                          currentUserId={CURRENT_USER_ID || ''}
                        />
                      </Box>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
                      Глобальный поиск
                    </Typography>
                    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
                      {filteredGlobalResults.map((user) => (
                        <ListItemButton key={user.id} onClick={() => handleSelectGlobalUser(user)}>
                          <ListItemAvatar>
                            <Avatar alt={user.name} src={user.avatar} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={user.name}
                            secondary={`${user.username} • ${user.email}`}
                          />
                        </ListItemButton>
                      ))}
                      {!isSearching && filteredGlobalResults.length === 0 && (
                        <Box sx={{ px: 2, py: 1.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Ничего не найдено
                          </Typography>
                        </Box>
                      )}
                      {isLoadingMoreGlobalSearch && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                          <CircularProgress size={18} />
                        </Box>
                      )}
                    </List>
                  </Box>
                ) : (
                  <ChatList 
                    contacts={contacts} 
                    onSelectContact={handleSelectContact}
                    selectedContactId={selectedContactId}
                    currentUserId={CURRENT_USER_ID || ''}
                  />
                )}
              </Box>
            )}
            
            {/* Диалог с выбранным контактом */}
            {(!isMobile || selectedContactId) && (
              <Box sx={{ 
                width: isMobile || !selectedContactId ? '100%' : '70%',
                display: isMobile && !selectedContactId ? 'none' : 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                overflow: 'hidden',
                height: '100%'
              }}>
                {selectedContactId && CURRENT_USER_ID ? (
                  <ChatDialog 
                    contact={selectedContact || null}
                    messages={messages}
                    currentUserId={CURRENT_USER_ID}
                    onBack={handleBackToList}
                    onSendMessage={handleSendMessage}
                    onStartForwardMessage={handleStartForwardMessage}
                    onOpenChatWithUser={handleOpenChatWithUser}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onReachMessagesStart={loadOlderMessages}
                    onReachMessagesEnd={handleReachMessagesEnd}
                    onScrollPositionChange={handleDialogScrollPositionChange}
                    pendingForwardMessage={pendingForwardMessage}
                    onPendingForwardApplied={() => setPendingForwardMessage(null)}
                    hasMoreMessages={hasMoreMessages}
                    isLoadingOlder={isLoadingOlderMessages}
                    initialScrollTop={restoredScrollTop}
                    isLoading={isLoading || isRestoringChatPosition}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      bgcolor: 'background.default'
                    }}
                  >
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                      <ChatIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Box sx={{ typography: 'h6', color: 'text.secondary' }}>
                        Выберите контакт для начала общения
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        ) : (
          <Games />
        )}
      </Box>
      <Dialog open={forwardModalOpen} onClose={() => setForwardModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>Переслать сообщение</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Поиск чата, логина или почты"
            value={forwardSearchQuery}
            onChange={(e) => setForwardSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {isForwardSearching ? (
                    <CircularProgress size={16} />
                  ) : (
                    forwardSearchQuery && (
                      <IconButton size="small" onClick={() => setForwardSearchQuery('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )
                  )}
                </InputAdornment>
              )
            }}
            sx={{ mb: 1.5 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
            Ваши чаты
          </Typography>
          <List sx={{ p: 0 }}>
            {forwardFilteredContacts.map((contact) => (
              <ListItemButton key={`forward-contact-${contact.id}`} onClick={() => handleSelectForwardTarget(contact)}>
                <ListItemAvatar>
                  <Avatar alt={contact.name} src={contact.avatar} />
                </ListItemAvatar>
                <ListItemText
                  primary={contact.name}
                  secondary={contact.username ? `${contact.username}${contact.email ? ` • ${contact.email}` : ''}` : contact.email}
                />
              </ListItemButton>
            ))}
          </List>
          {forwardDebouncedQuery && (
            <>
              <Divider sx={{ my: 1.25 }} />
              <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                Глобальный поиск
              </Typography>
              <List sx={{ p: 0 }}>
                {forwardFilteredGlobalResults.map((user) => (
                  <ListItemButton key={`forward-global-${user.id}`} onClick={() => handleSelectForwardTarget(user)}>
                    <ListItemAvatar>
                      <Avatar alt={user.name} src={user.avatar} />
                    </ListItemAvatar>
                    <ListItemText primary={user.name} secondary={`${user.username} • ${user.email}`} />
                  </ListItemButton>
                ))}
                {!isForwardSearching && forwardFilteredGlobalResults.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 1 }}>
                    Ничего не найдено
                  </Typography>
                )}
              </List>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Snackbar
        open={deleteToast.open}
        autoHideDuration={3000}
        onClose={() => setDeleteToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setDeleteToast((prev) => ({ ...prev, open: false }))}
          severity={deleteToast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {deleteToast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatPage; 