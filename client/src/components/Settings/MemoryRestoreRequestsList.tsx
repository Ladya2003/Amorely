import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme
} from '@mui/material';
import { useMemoryRestore } from '../../contexts/MemoryRestoreContext';
import type { MemoryRestoreRequestItem, MemoryRestoreStatus } from '../../services/memoryRestoreService';
import type { Partner } from './PartnerForm';
import CustomSnackbar from '../UI/CustomSnackbar';
import { PartnerRequestsSkeleton } from './SettingsSkeletons';
import {
  getSettingsEmptyStateSx,
  getSettingsListItemSx,
  getSettingsSectionDividerSx,
  getSettingsSectionTitleSx,
  getSettingsToggleGroupSx
} from './settingsPageStyles';
import { CheckIcon, CloseIcon } from '../UI/icons';

const getUserName = (user?: Partner) => {
  if (!user) return '';
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.username;
};

const FilterBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) {
    return null;
  }

  return (
    <Chip
      label={count}
      size="small"
      color="primary"
      sx={{ ml: 1, height: 20, minWidth: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.75rem' } }}
    />
  );
};

const MemoryRestoreRequestsList: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    incomingRequests,
    outgoingRequests,
    isLoading,
    isSubmitting,
    acceptAndRestore,
    declineRequest,
    cancelRequest
  } = useMemoryRestore();
  const [filter, setFilter] = useState<'incoming' | 'outgoing'>('incoming');
  const [actionError, setActionError] = useState<string | null>(null);
  const [successToastOpen, setSuccessToastOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const pendingIncomingCount = incomingRequests.filter((item) => item.status === 'pending').length;
  const pendingOutgoingCount = outgoingRequests.filter((item) => item.status === 'pending').length;
  const items = filter === 'incoming' ? incomingRequests : outgoingRequests;

  const getStatusLabel = (status: MemoryRestoreStatus) => {
    switch (status) {
      case 'in_progress':
        return t('crypto.memoryRestore.status.inProgress');
      case 'completed':
        return t('crypto.memoryRestore.status.completed');
      case 'declined':
        return t('crypto.memoryRestore.status.declined');
      case 'cancelled':
        return t('crypto.memoryRestore.status.cancelled');
      case 'failed':
        return t('crypto.memoryRestore.status.failed');
      case 'pending':
      default:
        return t('crypto.memoryRestore.status.pending');
    }
  };

  const handleAccept = async (request: MemoryRestoreRequestItem) => {
    setActionError(null);
    try {
      await acceptAndRestore(request._id);
      setSuccessMessage(t('crypto.memoryRestore.acceptSuccess'));
      setSuccessToastOpen(true);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setActionError(message || t('crypto.memoryRestore.acceptFailed'));
    }
  };

  const handleDecline = async (request: MemoryRestoreRequestItem) => {
    setActionError(null);
    try {
      await declineRequest(request._id);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setActionError(message || t('crypto.memoryRestore.declineFailed'));
    }
  };

  const handleCancel = async (request: MemoryRestoreRequestItem) => {
    setActionError(null);
    try {
      await cancelRequest(request._id);
      setSuccessMessage(t('crypto.memoryRestore.cancelSuccess'));
      setSuccessToastOpen(true);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setActionError(message || t('crypto.memoryRestore.cancelFailed'));
    }
  };

  if (!isLoading && incomingRequests.length === 0 && outgoingRequests.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography component="h2" sx={getSettingsSectionTitleSx()}>
        {t('crypto.memoryRestore.listTitle')}
      </Typography>

      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_event, next) => {
          if (next) {
            setFilter(next);
            setActionError(null);
          }
        }}
        aria-label={t('crypto.memoryRestore.filterAria')}
        sx={{ ...getSettingsToggleGroupSx, my: 1.5 }}
      >
        <ToggleButton value="incoming" aria-label={t('settings.partner.requests.incoming')}>
          {t('settings.partner.requests.incoming')}
          <FilterBadge count={pendingIncomingCount} />
        </ToggleButton>
        <ToggleButton value="outgoing" aria-label={t('settings.partner.requests.outgoing')}>
          {t('settings.partner.requests.outgoing')}
          <FilterBadge count={pendingOutgoingCount} />
        </ToggleButton>
      </ToggleButtonGroup>

      <Box component="hr" sx={getSettingsSectionDividerSx(theme)} />

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {isLoading ? (
        <PartnerRequestsSkeleton />
      ) : items.length === 0 ? (
        <Box sx={getSettingsEmptyStateSx(theme)}>
          <Typography variant="body2" color="text.secondary">
            {filter === 'incoming'
              ? t('crypto.memoryRestore.emptyIncoming')
              : t('crypto.memoryRestore.emptyOutgoing')}
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {items.map((request) => (
            <ListItem key={request._id} disableGutters sx={getSettingsListItemSx(theme)}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                <ListItemAvatar sx={{ minWidth: 56 }}>
                  <Avatar
                    src={request.peerUser?.avatar}
                    alt={getUserName(request.peerUser)}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={getUserName(request.peerUser)}
                  secondary={
                    <Typography component="span" variant="body2" color="text.secondary">
                      {t('crypto.memoryRestore.listHint')}
                    </Typography>
                  }
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
                {request.status !== 'pending' && (
                  <Chip
                    label={getStatusLabel(request.status)}
                    size="small"
                    variant="outlined"
                    color={request.status === 'failed' ? 'error' : 'default'}
                  />
                )}
                {filter === 'incoming' &&
                  (request.status === 'pending' ||
                    request.status === 'failed' ||
                    request.status === 'in_progress') && (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<CheckIcon />}
                        onClick={() => void handleAccept(request)}
                        disabled={isSubmitting}
                      >
                        {request.status === 'pending'
                          ? t('crypto.memoryRestore.restore')
                          : t('crypto.memoryRestore.retry')}
                      </Button>
                      {request.status === 'pending' && (
                        <Button
                          variant="outlined"
                          color="inherit"
                          size="small"
                          startIcon={<CloseIcon />}
                          onClick={() => void handleDecline(request)}
                          disabled={isSubmitting}
                        >
                          {t('settings.partner.requests.decline')}
                        </Button>
                      )}
                    </>
                  )}
                {filter === 'outgoing' && request.status === 'pending' && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CloseIcon />}
                    onClick={() => void handleCancel(request)}
                    disabled={isSubmitting}
                  >
                    {t('settings.partner.requests.cancel')}
                  </Button>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      <CustomSnackbar
        open={successToastOpen}
        message={successMessage}
        severity="success"
        onClose={() => setSuccessToastOpen(false)}
      />
    </Box>
  );
};

export default MemoryRestoreRequestsList;
