import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
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
  AdminReportItem,
  AdminReportUser,
  blockAdminUser,
  fetchAdminReports,
  unblockAdminUser,
  updateAdminReportStatus,
} from '../../services/adminService';
import { AppLocale, LOCALE_LABELS, SUPPORTED_LOCALES } from '../../localization/locale';
import { useAuth } from '../../contexts/AuthContext';
import { saveOpenChatTarget, type StoredOpenChatTarget } from '../../utils/openChatTargetStorage';

const emptyBlockReasons = (): Partial<Record<AppLocale, string>> => ({});

const AdminModeration: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | ''>('open');
  const [selectedReport, setSelectedReport] = useState<AdminReportItem | null>(null);
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

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

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
  };

  const handleReportDialogExited = () => {
    if (!pendingChatNavigation) {
      return;
    }

    const target = pendingChatNavigation;
    setPendingChatNavigation(null);
    navigate(`/chat?contact=${encodeURIComponent(target.id)}`);
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
      ) : reports.length === 0 ? (
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
      )}

      <Dialog
        open={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        fullWidth
        maxWidth="md"
        disableRestoreFocus
        TransitionProps={{ onExited: handleReportDialogExited }}
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

      <Dialog open={unblockDialogOpen} onClose={() => !isUnblocking && setUnblockDialogOpen(false)} fullWidth maxWidth="xs">
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

      <Dialog open={blockDialogOpen} onClose={() => !isBlocking && setBlockDialogOpen(false)} fullWidth maxWidth="md">
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
