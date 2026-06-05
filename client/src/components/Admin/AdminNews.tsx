import React, { useEffect, useMemo, useState } from 'react';
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
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import MediaFilePicker, { ExistingMediaItem } from '../common/MediaFilePicker';
import {
  AdminNewsItem,
  createAdminNews,
  deleteAdminNews,
  fetchAdminNews,
  updateAdminNews,
} from '../../services/adminService';
import { useUnreadNews } from '../../contexts/UnreadNewsContext';

type NewsFormState = {
  title: string;
  content: string;
  category: 'update' | 'event' | 'announcement';
  isPublished: boolean;
};

const emptyForm = (): NewsFormState => ({
  title: '',
  content: '',
  category: 'announcement',
  isPublished: true,
});

const getNewsExistingMedia = (item: AdminNewsItem): ExistingMediaItem[] => {
  const fromImages = (item.images ?? []).map((media, index) => ({
    id: media.publicId ?? `${item._id}-${index}`,
    url: media.url,
    resourceType: media.resourceType ?? 'image',
    publicId: media.publicId,
  }));

  if (item.image?.url && item.image.publicId) {
    const alreadyIncluded = fromImages.some((media) => media.publicId === item.image?.publicId);
    if (!alreadyIncluded) {
      return [
        {
          id: item.image.publicId,
          url: item.image.url,
          resourceType: 'image' as const,
          publicId: item.image.publicId,
        },
        ...fromImages,
      ];
    }
  }

  return fromImages;
};

const AdminNews: React.FC = () => {
  const { refreshUnreadNews } = useUnreadNews();
  const [news, setNews] = useState<AdminNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<AdminNewsItem | null>(null);
  const [form, setForm] = useState<NewsFormState>(emptyForm());
  const [files, setFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<ExistingMediaItem[]>([]);
  const [removedMediaPublicIds, setRemovedMediaPublicIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const visibleExistingMedia = useMemo(
    () =>
      existingMedia.filter(
        (media) => !media.publicId || !removedMediaPublicIds.includes(media.publicId)
      ),
    [existingMedia, removedMediaPublicIds]
  );

  const loadNews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminNews({ limit: 100 });
      setNews(data.news);
    } catch {
      setError('Не удалось загрузить новости');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNews();
  }, []);

  const resetMediaState = () => {
    setFiles([]);
    setExistingMedia([]);
    setRemovedMediaPublicIds([]);
  };

  const openCreateDialog = () => {
    setEditingNews(null);
    setForm(emptyForm());
    resetMediaState();
    setDialogOpen(true);
  };

  const openEditDialog = (item: AdminNewsItem) => {
    setEditingNews(item);
    setForm({
      title: item.title,
      content: item.content,
      category: item.category,
      isPublished: item.isPublished ?? true,
    });
    setFiles([]);
    setExistingMedia(getNewsExistingMedia(item));
    setRemovedMediaPublicIds([]);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingNews(null);
    setForm(emptyForm());
    resetMediaState();
  };

  const handleRemoveExisting = (id: string) => {
    const media = existingMedia.find((item) => item.id === id);
    if (media?.publicId) {
      setRemovedMediaPublicIds((prev) => [...prev, media.publicId!]);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Заполните заголовок и текст');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('content', form.content.trim());
      formData.append('category', form.category);
      formData.append('isPublished', String(form.isPublished));
      files.forEach((file) => formData.append('media', file));

      if (editingNews && removedMediaPublicIds.length > 0) {
        formData.append('removedMediaPublicIds', JSON.stringify(removedMediaPublicIds));
      }

      if (editingNews) {
        await updateAdminNews(editingNews._id, formData);
      } else {
        await createAdminNews(formData);
      }

      closeDialog();
      await loadNews();
      if (form.isPublished) {
        await refreshUnreadNews();
      }
    } catch {
      setError('Не удалось сохранить новость');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить эту новость?')) {
      return;
    }

    try {
      setError(null);
      await deleteAdminNews(id);
      await loadNews();
      await refreshUnreadNews();
    } catch {
      setError('Не удалось удалить новость');
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'update':
        return 'Обновление';
      case 'event':
        return 'Событие';
      default:
        return 'Анонс';
    }
  };

  const getMediaCount = (item: AdminNewsItem) => {
    const existing = getNewsExistingMedia(item);
    return existing.length;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Создание, редактирование и публикация новостей
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Новая новость
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Заголовок</TableCell>
                <TableCell>Категория</TableCell>
                <TableCell>Медиа</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {news.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{getCategoryLabel(item.category)}</TableCell>
                  <TableCell>{getMediaCount(item)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={item.isPublished ? 'опубликовано' : 'черновик'}
                      color={item.isPublished ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(item.publishDate), 'dd MMM yyyy', { locale: ru })}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(item)} aria-label="Редактировать">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(item._id)} aria-label="Удалить">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {news.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Новостей пока нет
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingNews ? 'Редактировать новость' : 'Новая новость'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Заголовок"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Текст"
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            fullWidth
            multiline
            minRows={5}
          />
          <FormControl fullWidth>
            <InputLabel>Категория</InputLabel>
            <Select
              label="Категория"
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  category: event.target.value as NewsFormState['category'],
                }))
              }
            >
              <MenuItem value="announcement">Анонс</MenuItem>
              <MenuItem value="update">Обновление</MenuItem>
              <MenuItem value="event">Событие</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={form.isPublished}
                onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
              />
            }
            label="Опубликовано"
          />
          <MediaFilePicker
            inputId="admin-news-media-upload"
            files={files}
            onFilesChange={setFiles}
            disabled={isSaving}
            existingMedia={visibleExistingMedia}
            onRemoveExisting={editingNews ? handleRemoveExisting : undefined}
            onError={(message) => setError(message)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Отмена</Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminNews;
