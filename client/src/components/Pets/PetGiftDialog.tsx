import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { searchUsers } from '../../services/petsService';

interface SearchUser {
  _id: string;
  username: string;
  firstName?: string;
  avatar?: string;
}

interface PetGiftDialogProps {
  open: boolean;
  onClose: () => void;
  onGift: (recipientUserId: string) => Promise<void>;
}

const PetGiftDialog: React.FC<PetGiftDialogProps> = ({ open, onClose, onGift }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobileDrawer = useMediaQuery(theme.breakpoints.down('sm'));
  const surfaceColor =
    isMobileDrawer && theme.palette.mode === 'dark'
      ? '#2a2a2a'
      : theme.palette.background.paper;
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<SearchUser | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setUsers([]);
      setSelected(null);
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setUsers([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(query);
        setUsers(results);
      } catch {
        setUsers([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleGift = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await onGift(selected._id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{t('pets.giftTitle')}</DialogTitle>
      <DialogContent sx={{ pt: 2.5, overflow: 'visible' }}>
        <TextField
          fullWidth
          label={t('pets.giftSearch')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mb: 2 }}
          autoFocus
          slotProps={{
            inputLabel: {
              sx: {
                px: 0.75,
                '&.MuiInputLabel-shrink': {
                  bgcolor: surfaceColor,
                },
              },
            },
          }}
        />
        {searching && <CircularProgress size={24} />}
        {!searching && query.length >= 2 && users.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t('pets.giftNoResults')}
          </Typography>
        )}
        <List dense>
          {users.map((u) => (
            <ListItemButton
              key={u._id}
              selected={selected?._id === u._id}
              onClick={() => setSelected(u)}
            >
              <ListItemAvatar>
                <Avatar src={u.avatar}>{u.username[0]?.toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={u.firstName || u.username} secondary={`@${u.username}`} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={() => void handleGift()} disabled={!selected || submitting}>
          {submitting ? <CircularProgress size={22} /> : t('pets.giftConfirm')}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default PetGiftDialog;
