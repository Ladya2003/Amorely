import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import {
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { API_URL } from '../../config';

export interface ShareRecipientContact {
  id: string;
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
}

interface ShareRecipientDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (target: ShareRecipientContact) => void;
  title?: string;
  contacts: ShareRecipientContact[];
}

const GLOBAL_SEARCH_PAGE_SIZE = 20;

const ShareRecipientDialog: React.FC<ShareRecipientDialogProps> = ({
  open,
  onClose,
  onSelect,
  title,
  contacts
}) => {
  const { t } = useTranslation();
  const dialogTitle = title ?? t('chat.share.selectRecipient');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [globalResults, setGlobalResults] = useState<ShareRecipientContact[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setDebouncedQuery('');
      setGlobalResults([]);
      setIsSearching(false);
    }
  }, [open]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchGlobalSearch = useCallback(async (query: string) => {
    if (!query) {
      setGlobalResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/contacts/search`, {
        params: { query, page: 1, limit: GLOBAL_SEARCH_PAGE_SIZE },
        headers: { Authorization: `Bearer ${token}` }
      });

      const responseData = response.data;
      const items: ShareRecipientContact[] = Array.isArray(responseData)
        ? responseData
        : (responseData.items || []);
      setGlobalResults(items);
    } catch (error) {
      console.error('Ошибка поиска получателя:', error);
      setGlobalResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!debouncedQuery) {
      setGlobalResults([]);
      setIsSearching(false);
      return;
    }
    fetchGlobalSearch(debouncedQuery);
  }, [debouncedQuery, open, fetchGlobalSearch]);

  const immediateQuery = searchQuery.trim().toLowerCase();
  const filteredContacts = immediateQuery
    ? contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(immediateQuery) ||
          (contact.username || '').toLowerCase().includes(immediateQuery) ||
          (contact.email || '').toLowerCase().includes(immediateQuery)
      )
    : contacts;

  const filteredGlobalResults = globalResults.filter(
    (user) => !filteredContacts.some((contact) => contact.id === user.id)
  );

  return (
    <ResponsiveDialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>{dialogTitle}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Поиск чата, логина или почты"
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
                  <CircularProgress size={16} />
                ) : (
                  searchQuery && (
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
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
          {t('chat.share.yourChats')}
        </Typography>
        <List sx={{ p: 0 }}>
          {filteredContacts.map((contact) => (
            <ListItemButton
              key={`share-contact-${contact.id}`}
              onClick={(event) => {
                event.currentTarget.blur();
                onSelect(contact);
              }}
            >
              <ListItemAvatar>
                <Avatar alt={contact.name} src={contact.avatar} />
              </ListItemAvatar>
              <ListItemText
                primary={contact.name}
                secondary={
                  contact.username
                    ? `${contact.username}${contact.email ? ` • ${contact.email}` : ''}`
                    : contact.email
                }
              />
            </ListItemButton>
          ))}
        </List>
        {debouncedQuery && (
          <>
            <Divider sx={{ my: 1.25 }} />
            <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
              {t('chat.share.globalSearch')}
            </Typography>
            <List sx={{ p: 0 }}>
              {filteredGlobalResults.map((user) => (
                <ListItemButton
                  key={`share-global-${user.id}`}
                  onClick={(event) => {
                    event.currentTarget.blur();
                    onSelect(user);
                  }}
                >
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
                <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 1 }}>
                  {t('chat.share.usersNotFound')}
                </Typography>
              )}
            </List>
          </>
        )}
      </DialogContent>
    </ResponsiveDialog>
  );
};

export default ShareRecipientDialog;
