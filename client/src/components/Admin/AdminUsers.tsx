import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { fetchAdminUsers, AdminUserItem } from '../../services/adminService';

const GAME_LABELS: Record<string, string> = {
  tap: 'Тыкалка',
  geo: 'Гео',
  draw: 'Рисовалка',
  quiz: 'Квиз',
};

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

  useEffect(() => {
    const load = async () => {
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

    void load();
  }, [query, page, rowsPerPage]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    setQuery(search.trim());
  };

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

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                    <TableCell colSpan={7} align="center">
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
    </Box>
  );
};

export default AdminUsers;
