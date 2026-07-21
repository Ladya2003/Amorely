import React, { useEffect, useState } from 'react';
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
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  blockAdminUser,
  fetchAdminUsers,
  toggleAdminUserNewFlag,
  unblockAdminUser,
  AdminUserItem,
} from '../../services/adminService';
import { useAdminAlerts } from '../../contexts/AdminAlertsContext';
import { AppLocale, LOCALE_LABELS, SUPPORTED_LOCALES } from '../../localization/locale';
import { getAppPlainDialogPaperSx } from '../../theme/modalStyles';

const GAME_LABELS: Record<string, string> = {
  tap: 'Тыкалка',
  geo: 'Гео',
  draw: 'Рисовалка',
  quiz: 'Квиз',
};

const emptyBlockReasons = (): Partial<Record<AppLocale, string>> => ({});

const formatDate = (value?: string) => {
  if (!value) {
    return '—';
  }
  return format(new Date(value), 'dd MMM yyyy, HH:mm', { locale: ru });
};

const formatGames = (user: AdminUserItem) => {
  const entries = Object.entries(user.stats.games)
    .filter(([, info]) => info.score > 0 || info.rank !== null)
    .map(([gameId, info]) => {
      const rankText = info.rank ? `#${info.rank}` : '—';
      return `${GAME_LABELS[gameId]}: ${info.score} (${rankText})`;
    });

  return entries.length > 0 ? entries.join(' · ') : '—';
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [blockReasons, setBlockReasons] = useState<Partial<Record<AppLocale, string>>>(emptyBlockReasons());
  const [blockLocale, setBlockLocale] = useState<AppLocale>('ru');
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const { refreshAdminAlerts } = useAdminAlerts();

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminUsers({
        search: query,
        page: page + 1,
        limit: rowsPerPage,
      });
      setUsers(data.users);
      setTotal(data.pagination.total);
    } catch {
      setError('Не удалось загрузить пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [query, page, rowsPerPage]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    setQuery(search.trim());
  };

  const openBlockDialog = (user: AdminUserItem) => {
    setSelectedUser(user);
    setBlockReasons(emptyBlockReasons());
    setBlockLocale('ru');
  };

  const closeBlockDialog = () => {
    setSelectedUser(null);
    setBlockReasons(emptyBlockReasons());
  };

  const updateUserBlockedState = (userId: string, isBlocked: boolean) => {
    setUsers((prevUsers) =>
      prevUsers.map((item) => (item._id === userId ? { ...item, isBlocked } : item))
    );
    setSelectedUser((prev) => (prev?._id === userId ? { ...prev, isBlocked } : prev));
  };

  const handleBlockUser = async () => {
    if (!selectedUser?._id) return;

    try {
      setIsBlocking(true);
      await blockAdminUser(selectedUser._id, blockReasons);
      updateUserBlockedState(selectedUser._id, true);
      setActionSuccess(`Пользователь ${selectedUser.username} заблокирован`);
      closeBlockDialog();
    } catch (blockError) {
      console.error('Ошибка блокировки:', blockError);
      setError('Не удалось заблокировать пользователя');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedUser?._id) return;

    try {
      setIsUnblocking(true);
      await unblockAdminUser(selectedUser._id);
      updateUserBlockedState(selectedUser._id, false);
      setActionSuccess(`Пользователь ${selectedUser.username} разблокирован`);
      closeBlockDialog();
    } catch (unblockError) {
      console.error('Ошибка разблокировки:', unblockError);
      setError('Не удалось разблокировать пользователя');
    } finally {
      setIsUnblocking(false);
    }
  };

  const handleToggleNewUserFlag = async (user: AdminUserItem) => {
    if (user.role === 'admin' || togglingUserId) {
      return;
    }

    try {
      setTogglingUserId(user._id);
      const result = await toggleAdminUserNewFlag(user._id);
      setUsers((prevUsers) =>
        prevUsers.map((item) =>
          item._id === user._id
            ? {
                ...item,
                isNewForAdmin: result.isNewForAdmin,
                isNewForAdminEffective: result.isNewForAdminEffective,
              }
            : item
        )
      );
      await refreshAdminAlerts();
    } catch (toggleError) {
      console.error('Ошибка изменения флага нового пользователя:', toggleError);
      setError('Не удалось изменить статус нового пользователя');
    } finally {
      setTogglingUserId(null);
    }
  };

  const isSelectedAdmin = selectedUser?.role === 'admin';

  return (
    <Box>
      <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Поиск по email, логину или имени"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>Партнёр</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Блокировка</TableCell>
                  <TableCell>Новый</TableCell>
                  <TableCell align="right">События</TableCell>
                  <TableCell align="right">Лента</TableCell>
                  <TableCell>Игры (счёт / место)</TableCell>
                  <TableCell>Последний визит</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {user.username}
                        {user.role === 'admin' && (
                          <Chip label="admin" size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {user.partner ? (
                        <>
                          <Typography variant="body2">{user.partner.username}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {user.partner.email}
                          </Typography>
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {user.relationshipStatus === 'active' && <Chip label="пара" size="small" color="success" />}
                      {user.relationshipStatus === 'broken_up' && (
                        <Chip label="расстались" size="small" color="warning" />
                      )}
                      {!user.relationshipStatus && <Chip label="один" size="small" />}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isBlocked ? 'Заблокирован' : 'Нет'}
                        size="small"
                        color={user.isBlocked ? 'error' : 'default'}
                        onClick={() => openBlockDialog(user)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isNewForAdminEffective ? 'Да' : 'Нет'}
                        size="small"
                        color={user.isNewForAdminEffective ? 'primary' : 'default'}
                        onClick={() => handleToggleNewUserFlag(user)}
                        disabled={user.role === 'admin' || togglingUserId === user._id}
                        sx={{ cursor: user.role === 'admin' ? 'default' : 'pointer' }}
                      />
                    </TableCell>
                    <TableCell align="right">{user.stats.calendarEvents}</TableCell>
                    <TableCell align="right">{user.stats.feedMedia}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ display: 'block', maxWidth: 260 }}>
                        {formatGames(user)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{formatDate(user.lastSeen)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Пользователи не найдены
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Строк на странице"
          />
        </>
      )}

      <Dialog
        open={Boolean(selectedUser)}
        onClose={() => {
          if (!isBlocking && !isUnblocking) {
            closeBlockDialog();
          }
        }}
        fullWidth
        maxWidth={selectedUser?.isBlocked ? 'xs' : 'md'}
        PaperProps={{ sx: getAppPlainDialogPaperSx }}
      >
        {selectedUser && (
          <>
            <DialogTitle>
              {selectedUser.isBlocked ? 'Разблокировать пользователя' : 'Заблокировать пользователя'}
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1" fontWeight={500}>
                {selectedUser.username}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedUser.email}
              </Typography>
              <Chip
                label={selectedUser.isBlocked ? 'Заблокирован' : 'Активен'}
                size="small"
                color={selectedUser.isBlocked ? 'error' : 'success'}
                sx={{ mb: 2 }}
              />

              {isSelectedAdmin ? (
                <Alert severity="info">Администратора заблокировать нельзя</Alert>
              ) : selectedUser.isBlocked ? (
                <Typography variant="body2" color="text.secondary">
                  Разблокировать пользователя? Он снова сможет войти в приложение.
                </Typography>
              ) : (
                <>
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
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeBlockDialog} disabled={isBlocking || isUnblocking}>
                Отмена
              </Button>
              {!isSelectedAdmin && selectedUser.isBlocked && (
                <Button
                  color="success"
                  variant="contained"
                  onClick={handleUnblockUser}
                  disabled={isUnblocking}
                >
                  {isUnblocking ? 'Разблокировка...' : 'Разблокировать'}
                </Button>
              )}
              {!isSelectedAdmin && !selectedUser.isBlocked && (
                <Button
                  color="error"
                  variant="contained"
                  onClick={handleBlockUser}
                  disabled={isBlocking}
                >
                  {isBlocking ? 'Блокировка...' : 'Заблокировать'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminUsers;
