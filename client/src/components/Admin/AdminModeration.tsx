import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ChatIcon from '@mui/icons-material/Chat';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import MediaViewerDialog, { MediaViewerContent } from '../common/MediaViewerDialog';
import {
  AdminCryptoRecoveryRequestItem,
  AdminReportItem,
  AdminReportUser,
  AdminUserRequestItem,
  blockAdminUser,
  fetchAdminCryptoRecoveryRequests,
  fetchAdminReports,
  fetchAdminUserRequests,
  unblockAdminUser,
  updateAdminCryptoRecoveryRequestStatus,
  updateAdminReportStatus,
  updateAdminUserRequestStatus,
} from '../../services/adminService';
import { getAppPlainDialogPaperSx } from '../../theme/modalStyles';
import { AppLocale, LOCALE_LABELS, SUPPORTED_LOCALES } from '../../localization/locale';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminAlerts } from '../../contexts/AdminAlertsContext';
import { saveOpenChatTarget, type StoredOpenChatTarget } from '../../utils/openChatTargetStorage';

const emptyBlockReasons = (): Partial<Record<AppLocale, string>> => ({});

const YES_NO_UNSURE_LABELS: Record<string, string> = {
  yes: 'Да',
  no: 'Нет',
  unsure: 'Не уверен(а)',
};

const REMEMBER_LABELS: Record<string, string> = {
  yes: 'Да, помнит',
  partial: 'Частично',
  no: 'Нет',
};

const CONTEXT_LABELS: Record<string, string> = {
  calendar: 'Календарь',
  feed: 'Лента',
  chat: 'Чат',
  plans: 'Планы',
  other: 'Другое',
};

const REQUEST_CATEGORY_LABELS: Record<string, string> = {
  question: 'Вопрос',
  feature: 'Идея',
  bug: 'Ошибка',
  other: 'Другое',
};

type ModerationSection = 'reports' | 'recovery' | 'requests';

const formatOptionalDate = (value?: string) => {
  if (!value) return '—';
  return format(new Date(value), 'dd.MM.yyyy HH:mm', { locale: ru });
};

const renderSectionDot = (label: string, showDot: boolean) => (
  <Badge
    color="error"
    variant="dot"
    invisible={!showDot}
    overlap="rectangular"
    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    sx={{
      '& .MuiBadge-badge': {
        top: 4,
        right: -6,
      },
    }}
  >
    <Box component="span" sx={{ pr: showDot ? 0.75 : 0 }}>
      {label}
    </Box>
  </Badge>
);

const AdminModeration: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    newReportsCount,
    newRecoveryRequestsCount,
    newAdminRequestsCount,
    clearModerationTabBadge,
  } = useAdminAlerts();
  const [section, setSection] = useState<ModerationSection>('reports');
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<AdminCryptoRecoveryRequestItem[]>([]);
  const [adminRequests, setAdminRequests] = useState<AdminUserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | ''>('open');
  const [selectedReport, setSelectedReport] = useState<AdminReportItem | null>(null);
  const [selectedRecovery, setSelectedRecovery] = useState<AdminCryptoRecoveryRequestItem | null>(null);
  const [selectedAdminRequest, setSelectedAdminRequest] = useState<AdminUserRequestItem | null>(null);
  const [recoveryAdminNote, setRecoveryAdminNote] = useState('');
  const [requestAdminNote, setRequestAdminNote] = useState('');
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [blockReasons, setBlockReasons] = useState<Partial<Record<AppLocale, string>>>(emptyBlockReasons());
  const [blockLocale, setBlockLocale] = useState<AppLocale>('ru');
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingChatNavigation, setPendingChatNavigation] = useState<StoredOpenChatTarget | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminReports({
        limit: 100,
        status: statusFilter,
      });
      setReports(data.reports);
    } catch (loadError) {
      console.error('Ошибка загрузки жалоб:', loadError);
      setError('Не удалось загрузить жалобы');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  const loadRecoveryRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminCryptoRecoveryRequests({
        limit: 100,
        status: statusFilter,
      });
      setRecoveryRequests(data.requests);
    } catch (loadError) {
      console.error('Ошибка загрузки заявок на восстановление:', loadError);
      setError('Не удалось загрузить заявки на восстановление');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  const loadAdminRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminUserRequests({
        limit: 100,
        status: statusFilter,
      });
      setAdminRequests(data.requests);
    } catch (loadError) {
      console.error('Ошибка загрузки заявок админу:', loadError);
      setError('Не удалось загрузить заявки');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (section === 'reports') {
      void loadReports();
      void clearModerationTabBadge('reports');
      return;
    }
    if (section === 'recovery') {
      void loadRecoveryRequests();
      void clearModerationTabBadge('recovery');
      return;
    }
    void loadAdminRequests();
    void clearModerationTabBadge('requests');
  }, [section, loadReports, loadRecoveryRequests, loadAdminRequests, clearModerationTabBadge]);

  const openChatWithUser = (targetUser: AdminReportUser | null) => {
    if (!targetUser?._id) return;

    const target: StoredOpenChatTarget = {
      id: targetUser._id,
      name: targetUser.displayName || targetUser.username,
      username: targetUser.username,
      email: targetUser.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.username)}`,
    };

    if (user?._id) {
      saveOpenChatTarget(user._id, target);
    }
    setPendingChatNavigation(target);
    setSelectedReport(null);
    setSelectedRecovery(null);
    setSelectedAdminRequest(null);
  };

  const handleReportDialogExited = () => {
    if (!pendingChatNavigation) {
      return;
    }

    const target = pendingChatNavigation;
    setPendingChatNavigation(null);
    navigate(`/chat?contact=${encodeURIComponent(target.id)}`);
  };

  const handleRecoveryDialogExited = () => {
    handleReportDialogExited();
  };

  const handleAdminRequestDialogExited = () => {
    handleReportDialogExited();
  };

  const handleBlockUser = async () => {
    if (!selectedReport?.reportedUser?._id) return;

    try {
      setIsBlocking(true);
      await blockAdminUser(selectedReport.reportedUser._id, blockReasons);
      setBlockDialogOpen(false);
      setBlockReasons(emptyBlockReasons());
      setActionSuccess('Пользователь заблокирован');
      if (selectedReport.reportedUser) {
        setSelectedReport({
          ...selectedReport,
          reportedUser: {
            ...selectedReport.reportedUser,
            isBlocked: true,
          },
        });
      }
      await loadReports();
    } catch (blockError) {
      console.error('Ошибка блокировки:', blockError);
      setError('Не удалось заблокировать пользователя');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedReport?.reportedUser?._id) return;

    try {
      setIsUnblocking(true);
      await unblockAdminUser(selectedReport.reportedUser._id);
      setUnblockDialogOpen(false);
      setActionSuccess('Пользователь разблокирован');
      if (selectedReport.reportedUser) {
        setSelectedReport({
          ...selectedReport,
          reportedUser: {
            ...selectedReport.reportedUser,
            isBlocked: false,
          },
        });
      }
      await loadReports();
    } catch (unblockError) {
      console.error('Ошибка разблокировки:', unblockError);
      setError('Не удалось разблокировать пользователя');
    } finally {
      setIsUnblocking(false);
    }
  };

  const handleToggleStatus = async (report: AdminReportItem) => {
    const nextStatus = report.status === 'open' ? 'resolved' : 'open';
    try {
      await updateAdminReportStatus(report._id, nextStatus);
      await loadReports();
      if (selectedReport?._id === report._id) {
        setSelectedReport({ ...report, status: nextStatus });
      }
    } catch (statusError) {
      console.error('Ошибка обновления статуса:', statusError);
      setError('Не удалось обновить статус');
    }
  };

  const handleToggleRecoveryStatus = async (request: AdminCryptoRecoveryRequestItem) => {
    const nextStatus = request.status === 'open' ? 'resolved' : 'open';
    try {
      await updateAdminCryptoRecoveryRequestStatus(request._id, {
        status: nextStatus,
        adminNote: recoveryAdminNote,
      });
      await loadRecoveryRequests();
      if (selectedRecovery?._id === request._id) {
        setSelectedRecovery({ ...request, status: nextStatus, adminNote: recoveryAdminNote });
      }
      setActionSuccess(nextStatus === 'resolved' ? 'Заявка закрыта' : 'Заявка открыта снова');
    } catch (statusError) {
      console.error('Ошибка обновления заявки на восстановление:', statusError);
      setError('Не удалось обновить статус заявки');
    }
  };

  const handleToggleAdminRequestStatus = async (request: AdminUserRequestItem) => {
    const nextStatus = request.status === 'open' ? 'resolved' : 'open';
    try {
      await updateAdminUserRequestStatus(request._id, {
        status: nextStatus,
        adminNote: requestAdminNote,
      });
      await loadAdminRequests();
      if (selectedAdminRequest?._id === request._id) {
        setSelectedAdminRequest({ ...request, status: nextStatus, adminNote: requestAdminNote });
      }
      setActionSuccess(nextStatus === 'resolved' ? 'Заявка закрыта' : 'Заявка открыта снова');
    } catch (statusError) {
      console.error('Ошибка обновления заявки админу:', statusError);
      setError('Не удалось обновить статус заявки');
    }
  };

  const openRecoveryDetails = (request: AdminCryptoRecoveryRequestItem) => {
    setSelectedRecovery(request);
    setRecoveryAdminNote(request.adminNote || '');
  };

  const openAdminRequestDetails = (request: AdminUserRequestItem) => {
    setSelectedAdminRequest(request);
    setRequestAdminNote(request.adminNote || '');
  };

  const mediaGallery: MediaViewerContent[] =
    selectedReport?.media.map((item, index) => ({
      url: item.url,
      resourceType: item.resourceType,
      cacheKey: `report-${selectedReport._id}-${index}`,
    })) ?? [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
        <Typography variant="h6">Модерация</Typography>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Статус</InputLabel>
          <Select
            label="Статус"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'open' | 'resolved' | '')}
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="open">Открытые</MenuItem>
            <MenuItem value="resolved">Закрытые</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Tabs
        value={section}
        onChange={(_event, value: ModerationSection) => setSection(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab value="reports" label={renderSectionDot('Жалобы', newReportsCount > 0)} />
        <Tab
          value="recovery"
          label={renderSectionDot('Восстановление медиа', newRecoveryRequestsCount > 0)}
        />
        <Tab
          value="requests"
          label={renderSectionDot('Заявки', newAdminRequestsCount > 0)}
        />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : section === 'requests' ? (
        adminRequests.length === 0 ? (
          <Alert severity="info">Заявок пока нет</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>Тема</TableCell>
                  <TableCell>Текст</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adminRequests.map((request) => (
                  <TableRow key={request._id} hover>
                    <TableCell>
                      {format(new Date(request.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{request.user?.displayName || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.user?.email || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {REQUEST_CATEGORY_LABELS[request.category] || request.category}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" noWrap title={request.text}>
                        {request.text}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={request.status === 'open' ? 'Открыта' : 'Закрыта'}
                        color={request.status === 'open' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => openAdminRequestDetails(request)}
                        aria-label="Открыть"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : section === 'reports' ? (
        reports.length === 0 ? (
          <Alert severity="info">Жалоб пока нет</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>От кого</TableCell>
                  <TableCell>На кого</TableCell>
                  <TableCell>Текст</TableCell>
                  <TableCell>Медиа</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report._id} hover>
                    <TableCell>
                      {format(new Date(report.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell>{report.reporter?.displayName || '—'}</TableCell>
                    <TableCell>{report.reportedUser?.displayName || '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 240 }}>
                      <Typography variant="body2" noWrap title={report.text}>
                        {report.text}
                      </Typography>
                    </TableCell>
                    <TableCell>{report.media.length}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={report.status === 'open' ? 'Открыта' : 'Закрыта'}
                        color={report.status === 'open' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => setSelectedReport(report)} aria-label="Открыть">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : recoveryRequests.length === 0 ? (
        <Alert severity="info">Заявок на восстановление пока нет</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell>Пользователь</TableCell>
                <TableCell>Несколько фраз</TableCell>
                <TableCell>Старый браузер</TableCell>
                <TableCell>Backup'ов</TableCell>
                <TableCell>Контекст</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recoveryRequests.map((request) => (
                <TableRow key={request._id} hover>
                  <TableCell>
                    {format(new Date(request.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{request.user?.displayName || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {request.user?.email || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>{YES_NO_UNSURE_LABELS[request.multiplePassphrases] || request.multiplePassphrases}</TableCell>
                  <TableCell>{YES_NO_UNSURE_LABELS[request.hasOldDeviceAccess] || request.hasOldDeviceAccess}</TableCell>
                  <TableCell>
                    {request.backupCount}
                    {request.liveBackupCount !== request.backupCount
                      ? ` (сейчас ${request.liveBackupCount})`
                      : ''}
                  </TableCell>
                  <TableCell>{CONTEXT_LABELS[request.context] || request.context}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={request.status === 'open' ? 'Открыта' : 'Закрыта'}
                      color={request.status === 'open' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => openRecoveryDetails(request)}
                      aria-label="Открыть"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        fullWidth
        maxWidth="md"
        disableRestoreFocus
        TransitionProps={{ onExited: handleReportDialogExited }}
        PaperProps={{ sx: getAppPlainDialogPaperSx }}
      >
        {selectedReport && (
          <>
            <DialogTitle>Жалоба</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Дата: {format(new Date(selectedReport.createdAt), 'dd MMMM yyyy HH:mm', { locale: ru })}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Кто пожаловался</Typography>
                  <Typography variant="body1">{selectedReport.reporter?.displayName || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">{selectedReport.reporter?.email}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">На кого</Typography>
                  <Typography variant="body1">{selectedReport.reportedUser?.displayName || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">{selectedReport.reportedUser?.email}</Typography>
                  {selectedReport.reportedUser?.isBlocked && (
                    <Chip size="small" color="error" label="Заблокирован" sx={{ mt: 1 }} />
                  )}
                </Paper>
              </Box>

              <Typography variant="subtitle2" gutterBottom>Текст жалобы</Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedReport.text}
                </Typography>
              </Paper>

              {selectedReport.media.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Медиа</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedReport.media.map((media, index) => (
                      <Button
                        key={`${media.publicId}-${index}`}
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setMediaViewerIndex(index);
                          setMediaViewerOpen(true);
                        }}
                      >
                        {media.resourceType === 'video' ? 'Видео' : 'Фото'} {index + 1}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}

              {selectedReport.adminMessages.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Сообщения администратора</Typography>
                  {selectedReport.adminMessages.map((message, index) => (
                    <Paper key={`${message.sentAt}-${index}`} variant="outlined" sx={{ p: 1.25, mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {message.target === 'reporter' ? 'Отправителю жалобы' : 'Обвиняемому'} ·{' '}
                        {format(new Date(message.sentAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.text}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, py: 2 }}>
              {selectedReport.reporter?._id !== user?._id && (
                <Button
                  startIcon={<ChatIcon />}
                  onClick={() => openChatWithUser(selectedReport.reporter)}
                  disabled={!selectedReport.reporter?._id}
                >
                  Чат с отправителем
                </Button>
              )}
              <Button
                startIcon={<ChatIcon />}
                onClick={() => openChatWithUser(selectedReport.reportedUser)}
                disabled={!selectedReport.reportedUser?._id}
              >
                Чат с обвиняемым
              </Button>
              <Button onClick={() => handleToggleStatus(selectedReport)}>
                {selectedReport.status === 'open' ? 'Закрыть жалобу' : 'Открыть снова'}
              </Button>
              {selectedReport.reportedUser?.isBlocked ? (
                <Button
                  color="success"
                  startIcon={<LockOpenIcon />}
                  onClick={() => setUnblockDialogOpen(true)}
                  disabled={isUnblocking || !selectedReport.reportedUser?._id}
                >
                  Разблокировать пользователя
                </Button>
              ) : (
                <Button
                  color="error"
                  startIcon={<BlockIcon />}
                  onClick={() => {
                    setBlockReasons(emptyBlockReasons());
                    setBlockLocale('ru');
                    setBlockDialogOpen(true);
                  }}
                  disabled={!selectedReport.reportedUser?._id}
                >
                  Заблокировать пользователя
                </Button>
              )}
              <Button onClick={() => setSelectedReport(null)}>Закрыть</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={unblockDialogOpen}
        onClose={() => !isUnblocking && setUnblockDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: getAppPlainDialogPaperSx }}
      >
        <DialogTitle>Разблокировать пользователя</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {selectedReport?.reportedUser?.displayName
              ? `Разблокировать пользователя ${selectedReport.reportedUser.displayName}? Он снова сможет войти в приложение.`
              : 'Разблокировать пользователя? Он снова сможет войти в приложение.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnblockDialogOpen(false)} disabled={isUnblocking}>
            Отмена
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={handleUnblockUser}
            disabled={isUnblocking}
          >
            {isUnblocking ? 'Разблокировка...' : 'Разблокировать'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={blockDialogOpen}
        onClose={() => !isBlocking && setBlockDialogOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: getAppPlainDialogPaperSx }}
      >
        <DialogTitle>Заблокировать пользователя</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Укажите причину блокировки на нужных языках. Если поле пустое, пользователь увидит стандартный текст о нарушении правил сообщества.
          </Typography>
          <Tabs
            value={blockLocale}
            onChange={(_event, value: AppLocale) => setBlockLocale(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2 }}
          >
            {SUPPORTED_LOCALES.map((locale) => (
              <Tab key={locale} value={locale} label={LOCALE_LABELS[locale]} />
            ))}
          </Tabs>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={blockReasons[blockLocale] ?? ''}
            onChange={(event) =>
              setBlockReasons((prev) => ({ ...prev, [blockLocale]: event.target.value }))
            }
            placeholder={`Причина (${LOCALE_LABELS[blockLocale]})`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)} disabled={isBlocking}>Отмена</Button>
          <Button color="error" variant="contained" onClick={handleBlockUser} disabled={isBlocking}>
            Заблокировать
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(selectedRecovery)}
        onClose={() => setSelectedRecovery(null)}
        fullWidth
        maxWidth="md"
        disableRestoreFocus
        TransitionProps={{ onExited: handleRecoveryDialogExited }}
        PaperProps={{ sx: getAppPlainDialogPaperSx }}
      >
        {selectedRecovery && (
          <>
            <DialogTitle>Заявка на восстановление медиа</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Дата: {format(new Date(selectedRecovery.createdAt), 'dd MMMM yyyy HH:mm', { locale: ru })}
              </Typography>

              <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Пользователь
                </Typography>
                <Typography variant="body1">{selectedRecovery.user?.displayName || '—'}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {selectedRecovery.user?.email}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  userId: {selectedRecovery.user?._id || '—'}
                </Typography>
                {selectedRecovery.user?.isBlocked && (
                  <Chip size="small" color="error" label="Заблокирован" sx={{ mt: 1 }} />
                )}
              </Paper>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Создавал(а) больше одной фразы
                  </Typography>
                  <Typography variant="body2">
                    {YES_NO_UNSURE_LABELS[selectedRecovery.multiplePassphrases] ||
                      selectedRecovery.multiplePassphrases}
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Есть доступ к старому браузеру/устройству
                  </Typography>
                  <Typography variant="body2">
                    {YES_NO_UNSURE_LABELS[selectedRecovery.hasOldDeviceAccess] ||
                      selectedRecovery.hasOldDeviceAccess}
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Помнит старую фразу
                  </Typography>
                  <Typography variant="body2">
                    {REMEMBER_LABELS[selectedRecovery.rememberOldPassphrase] ||
                      selectedRecovery.rememberOldPassphrase}
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Где увидел(а) ошибку
                  </Typography>
                  <Typography variant="body2">
                    {CONTEXT_LABELS[selectedRecovery.context] || selectedRecovery.context}
                  </Typography>
                </Paper>
              </Box>

              {selectedRecovery.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Комментарий пользователя
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedRecovery.description}
                    </Typography>
                  </Paper>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Crypto snapshot (на момент заявки)
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                  <Typography variant="body2">
                    Backup'ов: {selectedRecovery.backupCount} (сейчас в БД: {selectedRecovery.liveBackupCount})
                  </Typography>
                  <Typography variant="body2">Устройств: {selectedRecovery.deviceCount}</Typography>
                  <Typography variant="body2">
                    Текущий deviceId клиента: {selectedRecovery.currentDeviceId || '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    UA: {selectedRecovery.userAgent || '—'}
                  </Typography>
                </Paper>

                {selectedRecovery.backups.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      EncryptedKeyBackup
                    </Typography>
                    {selectedRecovery.backups.map((backup) => (
                      <Typography key={`${backup.deviceId}-${backup.updatedAt}`} variant="body2" sx={{ mb: 0.5 }}>
                        {backup.deviceId} · updated {formatOptionalDate(backup.updatedAt)} · created{' '}
                        {formatOptionalDate(backup.createdAt)}
                      </Typography>
                    ))}
                  </Paper>
                )}

                {selectedRecovery.devices.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      CryptoDevice
                    </Typography>
                    {selectedRecovery.devices.map((device) => (
                      <Typography key={`${device.deviceId}-${device.updatedAt}`} variant="body2" sx={{ mb: 0.5 }}>
                        {device.deviceId} · lastSeen {formatOptionalDate(device.lastSeen)} · updated{' '}
                        {formatOptionalDate(device.updatedAt)}
                      </Typography>
                    ))}
                  </Paper>
                )}
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Заметка админа"
                value={recoveryAdminNote}
                onChange={(event) => setRecoveryAdminNote(event.target.value)}
                helperText="Например: какой backup оставить, что уже проверили"
              />
            </DialogContent>
            <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, py: 2 }}>
              {selectedRecovery.user?._id !== user?._id && (
                <Button
                  startIcon={<ChatIcon />}
                  onClick={() => openChatWithUser(selectedRecovery.user)}
                  disabled={!selectedRecovery.user?._id}
                >
                  Чат с пользователем
                </Button>
              )}
              <Button onClick={() => void handleToggleRecoveryStatus(selectedRecovery)}>
                {selectedRecovery.status === 'open' ? 'Закрыть заявку' : 'Открыть снова'}
              </Button>
              <Button onClick={() => setSelectedRecovery(null)}>Закрыть</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={Boolean(selectedAdminRequest)}
        onClose={() => setSelectedAdminRequest(null)}
        fullWidth
        maxWidth="md"
        disableRestoreFocus
        TransitionProps={{ onExited: handleAdminRequestDialogExited }}
        PaperProps={{ sx: getAppPlainDialogPaperSx }}
      >
        {selectedAdminRequest && (
          <>
            <DialogTitle>Заявка</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Дата:{' '}
                {format(new Date(selectedAdminRequest.createdAt), 'dd MMMM yyyy HH:mm', { locale: ru })}
              </Typography>

              <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Пользователь
                </Typography>
                <Typography variant="body1">{selectedAdminRequest.user?.displayName || '—'}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {selectedAdminRequest.user?.email}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  userId: {selectedAdminRequest.user?._id || '—'}
                </Typography>
                {selectedAdminRequest.locale && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Язык: {selectedAdminRequest.locale}
                  </Typography>
                )}
                {selectedAdminRequest.user?.isBlocked && (
                  <Chip size="small" color="error" label="Заблокирован" sx={{ mt: 1 }} />
                )}
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Тема
                </Typography>
                <Typography variant="body2">
                  {REQUEST_CATEGORY_LABELS[selectedAdminRequest.category] ||
                    selectedAdminRequest.category}
                </Typography>
              </Paper>

              <Typography variant="subtitle2" gutterBottom>
                Сообщение
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedAdminRequest.text}
                </Typography>
              </Paper>

              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Заметка админа"
                value={requestAdminNote}
                onChange={(event) => setRequestAdminNote(event.target.value)}
                helperText="Например: что уже ответили в чате"
              />
            </DialogContent>
            <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, py: 2 }}>
              <Button
                variant="contained"
                startIcon={<ChatIcon />}
                onClick={() => openChatWithUser(selectedAdminRequest.user)}
                disabled={!selectedAdminRequest.user?._id}
              >
                Перейти в чат
              </Button>
              <Button onClick={() => void handleToggleAdminRequestStatus(selectedAdminRequest)}>
                {selectedAdminRequest.status === 'open' ? 'Закрыть заявку' : 'Открыть снова'}
              </Button>
              <Button onClick={() => setSelectedAdminRequest(null)}>Закрыть</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <MediaViewerDialog
        open={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
        content={mediaGallery[mediaViewerIndex] ?? null}
        gallery={mediaGallery}
        initialIndex={mediaViewerIndex}
      />
    </Box>
  );
};

export default AdminModeration;
