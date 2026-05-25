import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import axios from 'axios';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { useCrypto } from '../../contexts/CryptoContext';
import {
  enrichItemWithDecryptedMedia,
  type ContentMediaEnvelope,
  type EncryptedTextPayload
} from '../../crypto/contentCryptoService';
import { encryptAndUploadContentFiles } from '../../crypto/encryptedUploadService';
import { loadLocalKeys, type LocalDeviceKeys } from '../../crypto/cryptoService';
import { useEncryptionRecipientId, usePartnerId } from '../../hooks/usePartnerId';
import { VIDEO_LIMITS_HINT } from '../../utils/mediaLimits';
import { validateAndFilterMediaFiles } from '../../utils/validateMediaFile';
import ConfirmDeleteDialog from '../UI/ConfirmDeleteDialog';
import DecryptedMedia from '../common/DecryptedMedia';
import { getUserDisplayName } from '../UI/UserProfileChip';

interface PlanNoteUser {
  _id?: string;
  username: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
}

export interface PlanNoteMedia {
  _id: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  fileSize?: number;
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
  encryptedMediaEnvelope?: EncryptedTextPayload;
  metadataSenderId?: string;
  metadataRecipientId?: string;
}

export interface PlanNote {
  _id: string;
  title: string;
  content: string;
  category: string;
  media?: PlanNoteMedia[];
  createdAt: string;
  updatedAt: string;
  createdBy?: PlanNoteUser;
  lastEditedBy?: PlanNoteUser;
}

type NoteFormState = {
  title: string;
  content: string;
  category: string;
};

const emptyForm: NoteFormState = {
  title: '',
  content: '',
  category: ''
};

const PlansNotes: React.FC = () => {
  const { user } = useAuth();
  const { localDeviceKeys, ensureLocalKeys } = useCrypto();
  const encryptionRecipientId = useEncryptionRecipientId();
  const partnerId = usePartnerId();

  const [notes, setNotes] = useState<PlanNote[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PlanNote | null>(null);
  const [viewingNote, setViewingNote] = useState<PlanNote | null>(null);
  const [form, setForm] = useState<NoteFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<PlanNoteMedia[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<PlanNote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [viewerMedia, setViewerMedia] = useState<{
    noteId: string;
    media: PlanNoteMedia;
  } | null>(null);

  const resolveKeys = useCallback(async (): Promise<LocalDeviceKeys> => {
    if (localDeviceKeys) return localDeviceKeys;
    await ensureLocalKeys();
    if (localDeviceKeys) return localDeviceKeys;
    if (!user?._id) {
      throw new Error('Пользователь не авторизован');
    }
    const loaded = await loadLocalKeys(user._id);
    if (!loaded) {
      throw new Error('Разблокируйте ключи шифрования на странице /crypto/unlock');
    }
    return loaded;
  }, [localDeviceKeys, ensureLocalKeys, user?._id]);

  const decryptNoteMedia = useCallback(
    async (note: PlanNote): Promise<PlanNote> => {
      if (!note.media?.length) return note;

      try {
        const keys = await resolveKeys();
        const media = await Promise.all(
          note.media.map(async (item) =>
            enrichItemWithDecryptedMedia(keys, item, user?._id, partnerId || undefined)
          )
        );
        return { ...note, media };
      } catch {
        return note;
      }
    },
    [resolveKeys, user?._id, partnerId]
  );

  const decryptNotesList = useCallback(
    async (items: PlanNote[]): Promise<PlanNote[]> => Promise.all(items.map(decryptNoteMedia)),
    [decryptNoteMedia]
  );

  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = selectedCategory ? { category: selectedCategory } : undefined;
      const response = await axios.get(`${API_URL}/api/calendar/plans`, { params });
      const rawNotes: PlanNote[] = response.data.notes || [];
      const decryptedNotes = await decryptNotesList(rawNotes);
      setNotes(decryptedNotes);
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Ошибка загрузки заметок:', err);
      setError('Не удалось загрузить заметки');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, decryptNotesList]);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  const resetMediaState = () => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    setExistingMedia([]);
    setRemovedMediaIds([]);
  };

  const openCreateForm = () => {
    setEditingNote(null);
    setForm(emptyForm);
    setFormError(null);
    resetMediaState();
    setFormOpen(true);
  };

  const openEditForm = (note: PlanNote) => {
    setEditingNote(note);
    setForm({
      title: note.title,
      content: note.content,
      category: note.category
    });
    setFormError(null);
    resetMediaState();
    setExistingMedia(note.media || []);
    setFormOpen(true);
    setViewOpen(false);
  };

  const openView = async (note: PlanNote) => {
    const decrypted = await decryptNoteMedia(note);
    setViewingNote(decrypted);
    setViewOpen(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const { accepted, errors } = await validateAndFilterMediaFiles(Array.from(event.target.files));
    event.target.value = '';

    if (errors.length > 0) {
      setFormError(errors.join(' '));
    }

    if (accepted.length === 0) return;

    setFiles((prev) => [...prev, ...accepted]);
    setPreviews((prev) => [...prev, ...accepted.map((file) => URL.createObjectURL(file))]);
  };

  const handleRemoveNewFile = (index: number) => {
    setFiles((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setPreviews((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index]);
      next.splice(index, 1);
      return next;
    });
  };

  const handleRemoveExistingMedia = (mediaId: string) => {
    setExistingMedia((prev) => prev.filter((item) => item._id !== mediaId));
    setRemovedMediaIds((prev) => [...prev, mediaId]);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError('Укажите заголовок');
      return;
    }
    if (!form.category.trim()) {
      setFormError('Укажите категорию');
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      const keys = await resolveKeys();
      if (!encryptionRecipientId) {
        throw new Error('Не удалось определить получателя шифрования');
      }

      const uploaded =
        files.length > 0
          ? await encryptAndUploadContentFiles(files, keys, encryptionRecipientId)
          : [];

      const mediaPayload = uploaded.map((item) => ({
        url: item.url,
        publicId: item.publicId,
        fileSize: item.fileSize,
        mediaEnvelope: item.mediaEnvelope,
        encryptedMediaEnvelope: item.encryptedMediaEnvelope
      }));

      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category.trim(),
        encryptionRecipientId
      };

      if (editingNote) {
        const response = await axios.put(`${API_URL}/api/calendar/plans/${editingNote._id}`, {
          ...payload,
          newMedia: mediaPayload,
          removeMediaIds: removedMediaIds
        });
        const decrypted = await decryptNoteMedia(response.data);
        setNotes((prev) => prev.map((n) => (n._id === editingNote._id ? decrypted : n)));
        if (viewingNote?._id === editingNote._id) {
          setViewingNote(decrypted);
        }
      } else {
        const response = await axios.post(`${API_URL}/api/calendar/plans`, {
          ...payload,
          media: mediaPayload
        });
        const decrypted = await decryptNoteMedia(response.data);
        setNotes((prev) => [decrypted, ...prev]);
        if (!categories.includes(decrypted.category)) {
          setCategories((prev) => [...prev, decrypted.category].sort((a, b) => a.localeCompare(b, 'ru')));
        }
      }

      resetMediaState();
      setFormOpen(false);
      setEditingNote(null);
      setForm(emptyForm);
      void fetchNotes();
    } catch (err: any) {
      console.error('Ошибка сохранения заметки:', err);
      setFormError(err.response?.data?.error || err.message || 'Не удалось сохранить заметку');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;

    try {
      setIsDeleting(true);
      await axios.delete(`${API_URL}/api/calendar/plans/${noteToDelete._id}`);
      setNotes((prev) => prev.filter((n) => n._id !== noteToDelete._id));
      setDeleteOpen(false);
      setViewOpen(false);
      setNoteToDelete(null);
      setViewingNote(null);
      void fetchNotes();
    } catch (err) {
      console.error('Ошибка удаления заметки:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    format(new Date(dateStr), 'd MMMM yyyy, HH:mm', { locale: ru });

  const renderAuthor = (author?: PlanNoteUser) => {
    if (!author) return 'Неизвестно';
    return getUserDisplayName(author);
  };

  const renderMediaThumbnail = (noteId: string, media: PlanNoteMedia, size = 72) => (
    <Box
      key={media._id}
      sx={{
        width: size,
        height: size,
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
        bgcolor: 'grey.100'
      }}
    >
      <DecryptedMedia
        cacheKey={`plan-${noteId}-${media._id}`}
        url={media.url}
        resourceType={media.resourceType}
        encrypted={media.encrypted}
        mediaEnvelope={media.mediaEnvelope}
        videoPreview
        imageStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
        loadingMinHeight={size}
      />
    </Box>
  );

  const renderMediaGrid = (noteId: string, mediaItems: PlanNoteMedia[], onClick?: (media: PlanNoteMedia) => void) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
      {mediaItems.map((media) => (
        <Box
          key={media._id}
          onClick={(event) => {
            if (onClick) {
              event.stopPropagation();
              onClick(media);
            }
          }}
          sx={{
            width: 96,
            height: 96,
            borderRadius: 1,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            cursor: onClick ? 'pointer' : 'default',
            position: 'relative',
            bgcolor: 'grey.100'
          }}
        >
          <DecryptedMedia
            cacheKey={`plan-${noteId}-${media._id}`}
            url={media.url}
            resourceType={media.resourceType}
            encrypted={media.encrypted}
            mediaEnvelope={media.mediaEnvelope}
            videoPreview={media.resourceType === 'video'}
            imageStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loadingMinHeight={96}
          />
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" color="text.secondary">
          Общие заметки для вашей пары
        </Typography>
        {!isLoading && notes.length > 0 && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={openCreateForm}
            sx={{ mt: 1.5 }}
          >
            Новая заметка
          </Button>
        )}
      </Box>

      {categories.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            label="Все"
            clickable
            color={selectedCategory === null ? 'primary' : 'default'}
            variant={selectedCategory === null ? 'filled' : 'outlined'}
            onClick={() => setSelectedCategory(null)}
          />
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              clickable
              color={selectedCategory === cat ? 'primary' : 'default'}
              variant={selectedCategory === cat ? 'filled' : 'outlined'}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : notes.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'background.default'
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              {selectedCategory
                ? `В категории «${selectedCategory}» пока нет заметок`
                : 'Пока нет заметок'}
            </Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreateForm} sx={{ mt: 1 }}>
              Добавить первую заметку
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {notes.map((note) => (
              <Paper
                key={note._id}
                elevation={0}
                onClick={() => void openView(note)}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.light',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" noWrap>
                      {note.title}
                    </Typography>
                    {note.content && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {note.content}
                      </Typography>
                    )}
                    {note.media && note.media.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.75, mt: 1, alignItems: 'center' }}>
                        {note.media.slice(0, 3).map((media) => renderMediaThumbnail(note._id, media))}
                        {note.media.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{note.media.length - 3}
                          </Typography>
                        )}
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {renderAuthor(note.lastEditedBy || note.createdBy)} · {formatDate(note.updatedAt)}
                      {note.media && note.media.length > 0 && (
                        <> · <ImageIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.25 }} />{note.media.length}</>
                      )}
                    </Typography>
                  </Box>
                  <Chip label={note.category} size="small" sx={{ flexShrink: 0 }} />
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      {/* Форма создания / редактирования */}
      <Dialog open={formOpen} onClose={() => !isSaving && setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingNote ? 'Редактировать заметку' : 'Новая заметка'}
          <IconButton onClick={() => setFormOpen(false)} disabled={isSaving} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="Заголовок"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            fullWidth
            autoFocus
            inputProps={{ maxLength: 200 }}
          />
          <Autocomplete
            freeSolo
            options={categories}
            value={form.category}
            onChange={(_, value) => setForm((prev) => ({ ...prev, category: value || '' }))}
            onInputChange={(_, value) => setForm((prev) => ({ ...prev, category: value }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Категория"
                placeholder="Например: Путешествия, Подарки, Мечты..."
                inputProps={{ ...params.inputProps, maxLength: 100 }}
              />
            )}
          />
          <TextField
            label="Текст заметки"
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            fullWidth
            multiline
            minRows={5}
            placeholder="Запишите всё, что хотите..."
            inputProps={{ maxLength: 10000 }}
          />

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Фото и видео (зашифрованы)
            </Typography>
            <input
              accept="image/*,video/*"
              style={{ display: 'none' }}
              id="plan-note-media-upload"
              multiple
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="plan-note-media-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                fullWidth
                disabled={isSaving}
              >
                Добавить фото или видео
              </Button>
            </label>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {VIDEO_LIMITS_HINT}
            </Typography>
          </Box>

          {existingMedia.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {existingMedia.map((media) => (
                <Box key={media._id} sx={{ position: 'relative' }}>
                  {renderMediaThumbnail(editingNote?._id || 'edit', media, 96)}
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveExistingMedia(media._id)}
                    disabled={isSaving}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'rgba(0,0,0,0.55)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {previews.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {previews.map((preview, index) => (
                <Box
                  key={preview}
                  sx={{
                    position: 'relative',
                    width: 96,
                    height: 96,
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {files[index].type.startsWith('image/') ? (
                    <img
                      src={preview}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <video
                      src={preview}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveNewFile(index)}
                    disabled={isSaving}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'rgba(0,0,0,0.55)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={isSaving}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Сохранение...' : editingNote ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Просмотр заметки */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="sm">
        {viewingNote && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ minWidth: 0, pr: 1 }}>
                <Typography variant="h6">{viewingNote.title}</Typography>
                <Chip label={viewingNote.category} size="small" sx={{ mt: 1 }} />
              </Box>
              <IconButton onClick={() => setViewOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography
                variant="body1"
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: 2 }}
              >
                {viewingNote.content || 'Без текста'}
              </Typography>

              {viewingNote.media && viewingNote.media.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Фото и видео
                  </Typography>
                  {renderMediaGrid(viewingNote._id, viewingNote.media, (media) => {
                    setViewerMedia({ noteId: viewingNote._id, media });
                    setMediaViewerOpen(true);
                  })}
                </>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={viewingNote.createdBy?.avatar} sx={{ width: 28, height: 28 }}>
                    {viewingNote.createdBy?.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    Создал(а) {renderAuthor(viewingNote.createdBy)} · {formatDate(viewingNote.createdAt)}
                  </Typography>
                </Box>
                {viewingNote.lastEditedBy &&
                  viewingNote.lastEditedBy._id !== viewingNote.createdBy?._id && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={viewingNote.lastEditedBy.avatar} sx={{ width: 28, height: 28 }}>
                        {viewingNote.lastEditedBy.username?.[0]?.toUpperCase()}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        Изменил(а) {renderAuthor(viewingNote.lastEditedBy)} · {formatDate(viewingNote.updatedAt)}
                      </Typography>
                    </Box>
                  )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  setNoteToDelete(viewingNote);
                  setDeleteOpen(true);
                }}
              >
                Удалить
              </Button>
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => openEditForm(viewingNote)}>
                Редактировать
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Полноэкранный просмотр медиа */}
      <Dialog
        open={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0, bgcolor: 'black', position: 'relative' }}>
          <IconButton
            onClick={() => setMediaViewerOpen(false)}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
          {viewerMedia && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, p: 2 }}>
              <DecryptedMedia
                cacheKey={`plan-${viewerMedia.noteId}-${viewerMedia.media._id}-full`}
                url={viewerMedia.media.url}
                resourceType={viewerMedia.media.resourceType}
                encrypted={viewerMedia.media.encrypted}
                mediaEnvelope={viewerMedia.media.mediaEnvelope}
                imageStyle={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                videoStyle={{ maxWidth: '100%', maxHeight: '80vh' }}
                loadingMinHeight={200}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => !isDeleting && setDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName={noteToDelete?.title}
        isLoading={isDeleting}
        message={
          noteToDelete
            ? `Удалить заметку «${noteToDelete.title}»? Она исчезнет и у вашего партнёра.`
            : undefined
        }
      />
    </Box>
  );
};

export default PlansNotes;
