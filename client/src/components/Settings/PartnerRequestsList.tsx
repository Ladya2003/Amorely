import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import BreakupContentDialog from './BreakupContentDialog';
import CustomSnackbar from '../UI/CustomSnackbar';
import {
  notifyBreakupInitiated,
  notifyPartnerChanged,
  notifyPartnerUnlinked
} from '../../hooks/useRelationship';
import { notifyCalendarEventsChanged } from '../../hooks/useCalendarEvents';
import {
  notifyPartnerRequestsChanged,
  type IncomingPartnerRequestItem,
  type OutgoingPartnerRequestItem,
  type PartnerRequestFilter,
  type PartnerRequestStatus
} from '../../hooks/usePartnerRequests';
import type { BreakupContentOptions, Partner } from './PartnerForm';
import { DATE_INPUT_FORMAT, getDateFnsLocale } from '../../localization/calendarHelpers';
import { format } from 'date-fns';

interface PartnerRequestsListProps {
  incomingRequests: IncomingPartnerRequestItem[];
  outgoingRequests: OutgoingPartnerRequestItem[];
  isIncomingLoading: boolean;
  isOutgoingLoading: boolean;
  incomingError: string | null;
  outgoingError: string | null;
  hasPartner: boolean;
  onAccepted: () => Promise<void>;
}

const getUserName = (user: Partner) => {
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

const PartnerRequestsList: React.FC<PartnerRequestsListProps> = ({
  incomingRequests,
  outgoingRequests,
  isIncomingLoading,
  isOutgoingLoading,
  incomingError,
  outgoingError,
  hasPartner,
  onAccepted
}) => {
  const { t, i18n } = useTranslation();
  const { token, user, updateUser } = useAuth();
  const dateFnsLocale = getDateFnsLocale(i18n.language);

  const [filter, setFilter] = useState<PartnerRequestFilter>('incoming');
  const [selectedRequest, setSelectedRequest] = useState<IncomingPartnerRequestItem | null>(null);
  const [confirmSwitchOpen, setConfirmSwitchOpen] = useState(false);
  const [breakupDialogOpen, setBreakupDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successToastOpen, setSuccessToastOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const isLoading = filter === 'incoming' ? isIncomingLoading : isOutgoingLoading;
  const error = filter === 'incoming' ? incomingError : outgoingError;
  const pendingIncomingCount = incomingRequests.filter((request) => request.status === 'pending').length;
  const pendingOutgoingCount = outgoingRequests.filter((request) => request.status === 'pending').length;

  const getStatusLabel = (status: PartnerRequestStatus, direction: PartnerRequestFilter) => {
    if (status === 'declined') {
      return direction === 'incoming'
        ? t('settings.partner.requests.status.declinedIncoming')
        : t('settings.partner.requests.status.declinedOutgoing');
    }
    if (status === 'cancelled') {
      return t('settings.partner.requests.status.cancelled');
    }
    return t('settings.partner.requests.status.pending');
  };

  const getStatusChipColor = (status: PartnerRequestStatus): 'default' | 'error' | 'warning' => {
    if (status === 'declined') {
      return 'error';
    }
    if (status === 'cancelled') {
      return 'default';
    }
    return 'default';
  };

  const renderStatusChip = (status: PartnerRequestStatus, direction: PartnerRequestFilter) => {
    if (status === 'pending') {
      return null;
    }

    return (
      <Chip
        label={getStatusLabel(status, direction)}
        size="small"
        color={getStatusChipColor(status)}
        variant="outlined"
        sx={{ flexShrink: 0 }}
      />
    );
  };

  const resetDialogs = () => {
    setSelectedRequest(null);
    setConfirmSwitchOpen(false);
    setBreakupDialogOpen(false);
    setActionError(null);
  };

  const handleFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextFilter: PartnerRequestFilter | null
  ) => {
    if (nextFilter) {
      setFilter(nextFilter);
      setActionError(null);
    }
  };

  const handleAcceptClick = (request: IncomingPartnerRequestItem) => {
    setActionError(null);
    setSelectedRequest(request);

    if (hasPartner) {
      setConfirmSwitchOpen(true);
      return;
    }

    void acceptRequest(request, { keepEvents: true, keepPlans: true });
  };

  const handleConfirmSwitch = () => {
    setConfirmSwitchOpen(false);
    setBreakupDialogOpen(true);
  };

  const acceptRequest = async (
    request: IncomingPartnerRequestItem,
    options: BreakupContentOptions
  ) => {
    if (!token) {
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);

      const response = await axios.post(
        `${API_URL}/api/relationships/requests/${request._id}/accept`,
        hasPartner ? options : {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (hasPartner) {
        notifyBreakupInitiated();
        notifyPartnerUnlinked();
        notifyCalendarEventsChanged();
      }

      if (user && response.data.partner?._id) {
        updateUser({
          ...user,
          partnerId: String(response.data.partner._id),
          relationshipStartDate: response.data.relationship.startDate
        });
      }

      await onAccepted();
      notifyPartnerChanged();
      notifyPartnerRequestsChanged();
      resetDialogs();
      setSuccessMessage(t('settings.partner.requests.acceptSuccess'));
      setSuccessToastOpen(true);
    } catch (acceptError: any) {
      console.error('Ошибка при принятии заявки:', acceptError);
      const message = acceptError.response?.data?.error;
      setActionError(message || t('settings.partner.requests.errors.acceptFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBreakupConfirm = async (options: BreakupContentOptions) => {
    if (!selectedRequest) {
      return;
    }

    await acceptRequest(selectedRequest, options);
  };

  const handleDecline = async (request: IncomingPartnerRequestItem) => {
    if (!token) {
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);

      await axios.post(
        `${API_URL}/api/relationships/requests/${request._id}/decline`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      notifyPartnerRequestsChanged();
    } catch (declineError: any) {
      console.error('Ошибка при отклонении заявки:', declineError);
      const message = declineError.response?.data?.error;
      setActionError(message || t('settings.partner.requests.errors.declineFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (request: OutgoingPartnerRequestItem) => {
    if (!token) {
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);

      await axios.delete(`${API_URL}/api/relationships/requests/${request._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      notifyPartnerRequestsChanged();
      setSuccessMessage(t('settings.partner.requests.cancelSuccess'));
      setSuccessToastOpen(true);
    } catch (cancelError: any) {
      console.error('Ошибка при отмене заявки:', cancelError);
      const message = cancelError.response?.data?.error;
      setActionError(message || t('settings.partner.requests.errors.cancelFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRequestDate = (value: string) => {
    try {
      return format(new Date(value), DATE_INPUT_FORMAT, { locale: dateFnsLocale });
    } catch {
      return value;
    }
  };

  const renderUserInfo = (requestUser: Partner, relationshipStartDate: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
      <ListItemAvatar sx={{ minWidth: 56 }}>
        <Avatar src={requestUser.avatar} alt={getUserName(requestUser)} />
      </ListItemAvatar>
      <ListItemText
        primary={getUserName(requestUser)}
        secondary={
          <>
            <Typography component="span" variant="body2" color="text.secondary" display="block">
              {requestUser.email}
            </Typography>
            <Typography component="span" variant="body2" color="text.secondary" display="block">
              {t('settings.partner.requests.startDate', {
                date: formatRequestDate(relationshipStartDate)
              })}
            </Typography>
          </>
        }
      />
    </Box>
  );

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'transparent', mt: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 400, mb: 2 }}>
        {t('settings.partner.requests.title')}
      </Typography>

      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={handleFilterChange}
        aria-label={t('settings.partner.requests.filterAria')}
        size="small"
        sx={{ mb: 2, flexWrap: 'wrap' }}
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

      <Divider sx={{ mb: 3 }} />

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : error ? (
        <Alert severity="error">{t('settings.partner.requests.errors.loadFailed')}</Alert>
      ) : filter === 'incoming' ? (
        incomingRequests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {t('settings.partner.requests.emptyIncoming')}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {incomingRequests.map((request) => (
              <ListItem
                key={request._id}
                disableGutters
                sx={{
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  gap: 2,
                  py: 2,
                  borderBottom: 1,
                  borderColor: 'divider'
                }}
              >
                {renderUserInfo(request.fromUser, request.relationshipStartDate)}
                <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
                  {renderStatusChip(request.status, 'incoming')}
                  {request.status === 'pending' && (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<CheckIcon />}
                        onClick={() => handleAcceptClick(request)}
                        disabled={isSubmitting}
                      >
                        {t('settings.partner.requests.accept')}
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        startIcon={<CloseIcon />}
                        onClick={() => handleDecline(request)}
                        disabled={isSubmitting}
                      >
                        {t('settings.partner.requests.decline')}
                      </Button>
                    </>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        )
      ) : outgoingRequests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {t('settings.partner.requests.emptyOutgoing')}
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {outgoingRequests.map((request) => (
            <ListItem
              key={request._id}
              disableGutters
              sx={{
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
                py: 2,
                borderBottom: 1,
                borderColor: 'divider'
              }}
            >
              {renderUserInfo(request.toUser, request.relationshipStartDate)}
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
                {renderStatusChip(request.status, 'outgoing')}
                {request.status === 'pending' && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CloseIcon />}
                    onClick={() => handleCancel(request)}
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

      <ResponsiveDialog
        open={confirmSwitchOpen}
        onClose={() => !isSubmitting && resetDialogs()}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('settings.partner.requests.switchConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {t('settings.partner.requests.switchConfirmBody', {
              name: selectedRequest ? getUserName(selectedRequest.fromUser) : ''
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetDialogs} disabled={isSubmitting}>
            {t('settings.partner.cancel')}
          </Button>
          <Button
            onClick={handleConfirmSwitch}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {t('settings.partner.requests.switchConfirmYes')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>

      <BreakupContentDialog
        open={breakupDialogOpen}
        mode="initiator"
        isLoading={isSubmitting}
        onClose={() => !isSubmitting && resetDialogs()}
        onConfirm={handleBreakupConfirm}
      />

      <CustomSnackbar
        open={successToastOpen}
        message={successMessage}
        severity="success"
        onClose={() => setSuccessToastOpen(false)}
      />
    </Paper>
  );
};

export default PartnerRequestsList;
