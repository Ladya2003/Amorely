import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Divider, 
  Alert, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { API_URL } from '../../config';

export interface Partner {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface PartnerFormProps {
  userId: string;
  partner: Partner | null;
  relationshipStartDate: string | null;
  onAddPartner: (partnerEmail: string, startDate: Date) => Promise<void>;
  onRemovePartner: () => Promise<void>;
  isLoading: boolean;
}

const PartnerForm: React.FC<PartnerFormProps> = ({ 
  userId, 
  partner, 
  relationshipStartDate, 
  onAddPartner, 
  onRemovePartner, 
  isLoading 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(relationshipStartDate ? new Date(relationshipStartDate) : null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (relationshipStartDate) {
      setStartDate(new Date(relationshipStartDate));
    }
  }, [relationshipStartDate]);

  useEffect(() => {
    if (searchQuery.length >= 3) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      setIsSearching(true);
      const response = await axios.get(`${API_URL}/api/settings/search`, {
        params: {
          query: searchQuery,
          userId
        }
      });
      setSearchResults(response.data);
      setIsSearching(false);
    } catch (error) {
      console.error('Ошибка при поиске пользователей:', error);
      setIsSearching(false);
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPartner(null);
    setError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSelectPartner = (partner: Partner) => {
    setSelectedPartner(partner);
  };

  const handleAddPartner = async () => {
    if (!selectedPartner || !startDate) {
      setError('Выберите партнера и укажите дату начала отношений');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddPartner(selectedPartner.email, startDate);
      setIsSubmitting(false);
      handleCloseDialog();
    } catch (error) {
      console.error('Ошибка при добавлении партнера:', error);
      setError('Не удалось добавить партнера. Пожалуйста, попробуйте еще раз.');
      setIsSubmitting(false);
    }
  };

  const handleOpenConfirmDialog = () => {
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  const handleRemovePartner = async () => {
    try {
      await onRemovePartner();
      handleCloseConfirmDialog();
    } catch (error) {
      console.error('Ошибка при удалении партнера:', error);
    }
  };

  const getPartnerName = (partner: Partner) => {
    if (partner.firstName && partner.lastName) {
      return `${partner.firstName} ${partner.lastName}`;
    } else if (partner.firstName) {
      return partner.firstName;
    } else {
      return partner.username;
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Партнер
        </Typography>
        {partner ? (
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={handleOpenConfirmDialog}
            disabled={isLoading}
          >
            Удалить
          </Button>
        ) : (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<PersonAddIcon />}
            onClick={handleOpenDialog}
            disabled={isLoading}
          >
            Добавить партнера
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: 3 }} />
      
      {partner ? (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              src={partner.avatar} 
              alt={getPartnerName(partner)}
              sx={{ width: 64, height: 64, mr: 2 }}
            />
            <Box>
              <Typography variant="h6">
                {getPartnerName(partner)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {partner.email}
              </Typography>
              {partner.username && partner.username !== partner.email && (
                <Typography variant="body2" color="text.secondary">
                  @{partner.username}
                </Typography>
              )}
            </Box>
          </Box>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <DatePicker
              label="Дата начала отношений"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              disabled
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  helperText: 'Дату начала отношений нельзя изменить после добавления партнера'
                }
              }}
            />
          </LocalizationProvider>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            У вас пока нет партнера
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Добавьте партнера, чтобы видеть количество дней, проведенных вместе, и обмениваться контентом
          </Typography>
        </Box>
      )}
      
      {/* Диалог добавления партнера */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить партнера</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Поиск по email или логину"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            margin="normal"
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            helperText="Введите минимум 3 символа для поиска"
          />
          
          {isSearching ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Поиск...
              </Typography>
            </Box>
          ) : searchResults.length > 0 ? (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {searchResults.map((user) => (
                <ListItem 
                  key={user._id}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="select" 
                      onClick={() => handleSelectPartner(user)}
                    >
                      <PersonAddIcon />
                    </IconButton>
                  }
                  sx={{
                    bgcolor: selectedPartner?._id === user._id ? 'action.selected' : 'transparent',
                    borderRadius: 1,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSelectPartner(user)}
                >
                  <ListItemAvatar>
                    <Avatar src={user.avatar} alt={user.username} />
                  </ListItemAvatar>
                  <ListItemText 
                    primary={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username} 
                    secondary={user.email} 
                  />
                </ListItem>
              ))}
            </List>
          ) : searchQuery.length >= 3 ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Пользователи не найдены
              </Typography>
            </Box>
          ) : null}
          
          {selectedPartner && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Выбранный партнер:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Avatar 
                  src={selectedPartner.avatar} 
                  alt={selectedPartner.username}
                  sx={{ mr: 2 }}
                />
                <Box>
                  <Typography variant="body1">
                    {selectedPartner.firstName && selectedPartner.lastName 
                      ? `${selectedPartner.firstName} ${selectedPartner.lastName}` 
                      : selectedPartner.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPartner.email}
                  </Typography>
                </Box>
              </Box>
              
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                <DatePicker
                  label="Дата начала отношений"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal',
                      variant: 'outlined',
                      required: true,
                      helperText: 'Укажите дату начала ваших отношений'
                    }
                  }}
                  disableFuture
                />
              </LocalizationProvider>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>Отмена</Button>
          <Button 
            onClick={handleAddPartner} 
            variant="contained" 
            color="primary"
            disabled={!selectedPartner || !startDate || isLoading || isSubmitting}
          >
            {isSubmitting ? 'Добавление...' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог подтверждения удаления */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Вы уверены, что хотите удалить партнера? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} disabled={isLoading}>Отмена</Button>
          <Button 
            onClick={handleRemovePartner} 
            variant="contained" 
            color="error"
            disabled={isLoading}
          >
            {isLoading ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PartnerForm; 