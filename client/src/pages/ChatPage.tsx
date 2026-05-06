import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ChatList, { Contact } from '../components/Chat/ChatList';
import ChatDialog, { MessageType } from '../components/Chat/ChatDialog';
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

type ChatContact = Contact & {
  isPartner?: boolean;
};

const ChatPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { user } = useAuth();
  const { setShowBottomNav } = useNavigation();
  const CURRENT_USER_ID = user?._id;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      const displayText = hasMedia && !message.text ? 'Медиафайл' : message.text;
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
        // Ищем временное сообщение с похожим текстом
        const tempMessageIndex = prevMessages.findIndex(msg => 
          msg.id.startsWith('temp-') && msg.text === message.text
        );
        
        if (tempMessageIndex !== -1) {
          // Заменяем временное сообщение на реальное
          const newMessages = [...prevMessages];
          newMessages[tempMessageIndex] = message;
          return newMessages;
        } else {
          // Добавляем новое сообщение (если временного не было найдено)
          return [...prevMessages, message];
        }
      });
      
      // Обновляем последнее сообщение в списке контактов
      if (selectedContactId) {
        const hasMedia = message.attachments && message.attachments.length > 0;
        const displayText = hasMedia && !message.text ? 'Медиафайл' : message.text;
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

    return () => {
      socketService.disconnect();
    };
  }, [selectedContactId, updateContactLastMessage]);

  // Загрузка контактов
  useEffect(() => {
    fetchContacts();
  }, []);

  // Загрузка сообщений при выборе контакта
  useEffect(() => {
    if (selectedContactId) {
      fetchMessages(selectedContactId);
    }
  }, [selectedContactId]);

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

  // Глобальный поиск пользователей по username/email
  useEffect(() => {
    const fetchGlobalSearch = async () => {
      if (!debouncedSearchQuery) {
        setGlobalSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/contacts/search`, {
          params: { query: debouncedSearchQuery },
          headers: { Authorization: `Bearer ${token}` }
        });
        setGlobalSearchResults(response.data || []);
      } catch (error) {
        console.error('Ошибка глобального поиска пользователей:', error);
        setGlobalSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchGlobalSearch();
  }, [debouncedSearchQuery]);

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

  const fetchMessages = async (contactId: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      // Реальный запрос к API (userId берется из токена через authMiddleware)
      const response = await axios.get(`${API_URL}/api/messages`, {
        params: { contactId },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(response.data);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Ошибка при загрузке сообщений:', error);
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1) {
      setSelectedContactId(null);
      // Показываем нижнее меню при переходе на вкладку игр
      if (isMobile) {
        setShowBottomNav(true);
      }
    }
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId);
    // Скрываем нижнее меню на мобильных при открытии чата
    if (isMobile) {
      setShowBottomNav(false);
    }
  };

  const handleSelectGlobalUser = (user: SearchUser) => {
    ensureContactInList(user);
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
    setIsSearching(false);
  };

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

  const handleBackToList = () => {
    setSelectedContactId(null);
    // Показываем нижнее меню на мобильных при возврате к списку
    if (isMobile) {
      setShowBottomNav(true);
    }
  };

  const handleSendMessage = (text: string, attachments?: File[]) => {
    if (!selectedContactId || !CURRENT_USER_ID) return;

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
      socketService.sendMessage(selectedContactId, text, uploadedAttachments);
    };

    // Временно добавляем сообщение локально для мгновенного отображения
    const newMessage: MessageType = {
      id: `temp-${Date.now()}`,
      senderId: CURRENT_USER_ID,
      text,
      timestamp: new Date().toISOString(),
      attachments: attachments?.map(file => ({
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: URL.createObjectURL(file)
      }))
    };

    setMessages([...messages, newMessage]);
    updateContactLastMessage(
      selectedContactId,
      text || (attachments && attachments.length > 0 ? 'Медиафайл' : ''),
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

  return (
    <Box sx={{ 
      height: isMobile ? 'calc(100vh - 72px)' : 'calc(100vh - 64px)', // Аналогично CalendarPage: фиксируем рабочую область
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
              }}>
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
                    onReachMessagesEnd={handleReachMessagesEnd}
                    isLoading={isLoading}
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
    </Box>
  );
};

export default ChatPage; 