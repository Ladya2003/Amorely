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
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  AdminAnnouncementItem,
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  fetchAdminAnnouncements,
  sendAdminAnnouncementPush,
  updateAdminAnnouncement,
} from '../../services/adminService';
import {
  AppLocale,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
} from '../../localization/locale';
import {
  AnnouncementLocaleContent,
  createEmptyAnnouncementTranslations,
  normalizeAnnouncementTranslations,
  PET_FEEDING_ANNOUNCEMENT_PRESET,
} from '../../localization/announcementContent';

type AnnouncementFormState = {
  key: string;
  translations: Record<AppLocale, AnnouncementLocaleContent>;
  pushTitle: string;
  pushBody: string;
  isActive: boolean;
  sendPush: boolean;
};

const emptyForm = (): AnnouncementFormState => ({
  key: '',
  translations: createEmptyAnnouncementTranslations(),
  pushTitle: 'Amorely',
  pushBody: '',
  isActive: true,
  sendPush: false,
});

const presetForm = (): AnnouncementFormState => ({
  key: PET_FEEDING_ANNOUNCEMENT_PRESET.key,
  translations: PET_FEEDING_ANNOUNCEMENT_PRESET.translations,
  pushTitle: PET_FEEDING_ANNOUNCEMENT_PRESET.pushTitle,
  pushBody: PET_FEEDING_ANNOUNCEMENT_PRESET.pushBody.ru,
  isActive: true,
  sendPush: false,
});

const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AdminAnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminAnnouncementItem | null>(null);
  const [form, setForm] = useState<AnnouncementFormState>(emptyForm());
  const [activeLocale, setActiveLocale] = useState<AppLocale>('ru');
  const [isSaving, setIsSaving] = useState(false);
  const [pushingId, setPushingId] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminAnnouncements();
      setAnnouncements(data.announcements);
    } catch {
      setError('Не удалось загрузить уведомления');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAnnouncements();
  }, []);

  const openCreateDialog = () => {
    setEditingItem(null);
    setForm(emptyForm());
    setActiveLocale('ru');
    setDialogOpen(true);
  };

  const openPresetDialog = () => {
    setEditingItem(null);
    setForm(presetForm());
    setActiveLocale('ru');
    setDialogOpen(true);
  };

  const openEditDialog = (item: AdminAnnouncementItem) => {
    setEditingItem(item);
    setForm({
      key: item.key,
      translations: normalizeAnnouncementTranslations(item),
      pushTitle: item.pushTitle || 'Amorely',
      pushBody: item.pushBody || '',
      isActive: item.isActive,
      sendPush: false,
    });
    setActiveLocale('ru');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setForm(emptyForm());
    setActiveLocale('ru');
  };

  const updateLocaleField = (
    locale: AppLocale,
    field: keyof AnnouncementLocaleContent,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: {
          ...prev.translations[locale],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    const russian = form.translations.ru;
    if (!russian.title.trim() || !russian.preview.trim() || !russian.content.trim()) {
      setError('Заполните заголовок, краткий текст и полный текст на русском языке');
      setActiveLocale('ru');
      return;
    }

    if (form.sendPush && !form.pushBody.trim()) {
      setError('Укажите текст push-уведомления или снимите галочку отправки push');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        translations: form.translations,
        pushTitle: form.pushTitle.trim() || 'Amorely',
        pushBody: form.pushBody.trim(),
        isActive: form.isActive,
        sendPush: form.sendPush,
      };

      const result = editingItem
        ? await updateAdminAnnouncement(editingItem._id, payload)
        : await createAdminAnnouncement({
            ...payload,
            key: form.key.trim() || undefined,
          });

      closeDialog();
      await loadAnnouncements();

      if (result.pushResult?.sent) {
        setSuccess(`Уведомление сохранено. Push отправлен ${result.pushResult.sent} пользователям.`);
      } else {
        setSuccess('Уведомление сохранено');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Не удалось сохранить уведомление');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить это уведомление?')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await deleteAdminAnnouncement(id);
      await loadAnnouncements();
      setSuccess('Уведомление удалено');
    } catch {
      setError('Не удалось удалить уведомление');
    }
  };

  const handleSendPush = async (id: string) => {
    if (!window.confirm('Отправить push всем пользователям с активной подпиской?')) {
      return;
    }

    try {
      setPushingId(id);
      setError(null);
      setSuccess(null);
      const result = await sendAdminAnnouncementPush(id);
      await loadAnnouncements();
      setSuccess(`Push отправлен ${result.pushResult.sent} пользователям`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Не удалось отправить push');
    } finally {
      setPushingId(null);
    }
  };

  const getFilledLocales = (item: AdminAnnouncementItem) => {
    const translations = normalizeAnnouncementTranslations(item);
    return SUPPORTED_LOCALES.filter((locale) => translations[locale].title.trim().length > 0);
  };

  const activeTranslation = form.translations[activeLocale];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          In-app уведомления в колокольчике на главной. Можно отправить push всем с активной подпиской.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={openPresetDialog}>
            Шаблон: кормление
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            Новое уведомление
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Заголовок (RU)</TableCell>
                <TableCell>Ключ</TableCell>
                <TableCell>Языки</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Push</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {announcements.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>{normalizeAnnouncementTranslations(item).ru.title}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {item.key}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {getFilledLocales(item).map((locale) => (
                        <Chip key={locale} size="small" label={locale.toUpperCase()} variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={item.isActive ? 'активно' : 'скрыто'}
                      color={item.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {item.pushSentAt ? (
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(item.pushSentAt), 'dd MMM yyyy HH:mm', { locale: ru })}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        не отправлялся
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(item.publishedAt), 'dd MMM yyyy', { locale: ru })}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => void handleSendPush(item._id)}
                      aria-label="Отправить push"
                      disabled={pushingId === item._id || !item.isActive}
                    >
                      {pushingId === item._id ? (
                        <CircularProgress size={18} />
                      ) : (
                        <SendIcon fontSize="small" />
                      )}
                    </IconButton>
                    <IconButton size="small" onClick={() => openEditDialog(item)} aria-label="Редактировать">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => void handleDelete(item._id)} aria-label="Удалить">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {announcements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Уведомлений пока нет
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>{editingItem ? 'Редактировать уведомление' : 'Новое уведомление'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {!editingItem && (
            <TextField
              label="Ключ (необязательно)"
              value={form.key}
              onChange={(event) => setForm((prev) => ({ ...prev, key: event.target.value }))}
              helperText="Латиница и цифры, например pet-feeding-v1. Если пусто — сгенерируется автоматически."
              fullWidth
            />
          )}
          {editingItem && (
            <TextField label="Ключ" value={form.key} fullWidth disabled />
          )}

          <Tabs
            value={activeLocale}
            onChange={(_event, value: AppLocale) => setActiveLocale(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {SUPPORTED_LOCALES.map((locale) => {
              const hasContent = Boolean(form.translations[locale].title.trim());
              return (
                <Tab
                  key={locale}
                  value={locale}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>{LOCALE_LABELS[locale]}</span>
                      {locale === 'ru' && (
                        <Chip size="small" label="*" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                      )}
                      {hasContent && locale !== 'ru' && (
                        <Chip size="small" label="✓" color="success" sx={{ height: 18, minWidth: 22, fontSize: '0.65rem' }} />
                      )}
                    </Box>
                  }
                />
              );
            })}
          </Tabs>

          <TextField
            label={`Заголовок (${LOCALE_LABELS[activeLocale]})`}
            value={activeTranslation.title}
            onChange={(event) => updateLocaleField(activeLocale, 'title', event.target.value)}
            fullWidth
            required={activeLocale === 'ru'}
          />
          <TextField
            label={`Краткий текст для списка (${LOCALE_LABELS[activeLocale]})`}
            value={activeTranslation.preview}
            onChange={(event) => updateLocaleField(activeLocale, 'preview', event.target.value)}
            fullWidth
            multiline
            minRows={2}
            required={activeLocale === 'ru'}
          />
          <TextField
            label={`Полный текст (${LOCALE_LABELS[activeLocale]})`}
            value={activeTranslation.content}
            onChange={(event) => updateLocaleField(activeLocale, 'content', event.target.value)}
            fullWidth
            multiline
            minRows={8}
            required={activeLocale === 'ru'}
          />

          {activeLocale === 'ru' && (
            <Typography variant="caption" color="text.secondary">
              Русский заголовок, краткий и полный текст обязательны. Остальные языки можно заполнить по желанию.
            </Typography>
          )}

          <TextField
            label="Заголовок push"
            value={form.pushTitle}
            onChange={(event) => setForm((prev) => ({ ...prev, pushTitle: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Текст push (RU)"
            value={form.pushBody}
            onChange={(event) => setForm((prev) => ({ ...prev, pushBody: event.target.value }))}
            fullWidth
            multiline
            minRows={2}
            helperText="Используется при отправке push. Обычно короткая фраза на русском."
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
            }
            label="Активно (видно пользователям)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.sendPush}
                onChange={(event) => setForm((prev) => ({ ...prev, sendPush: event.target.checked }))}
              />
            }
            label="Отправить push при сохранении"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Отмена</Button>
          <Button variant="contained" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAnnouncements;
