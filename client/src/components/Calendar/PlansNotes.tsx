import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { useCrypto } from '../../contexts/CryptoContext';
import {
  decryptPlanNote,
  decryptPlanNotesList,
  encryptDualTextForContent,
  type ContentMediaEnvelope,
  type EncryptedTextPayload,
  type RawPlanNoteFields
} from '../../crypto/contentCryptoService';
import { encryptAndUploadCalendarContentFiles } from '../../crypto/encryptedUploadService';
import { loadLocalKeys, type LocalDeviceKeys } from '../../crypto/cryptoService';
import { useEncryptionRecipientId, usePartnerId } from '../../hooks/usePartnerId';
import {
  formatCalendarDateTime,
  getDateFnsLocale,
  getVideoLimitsHint
} from '../../localization/calendarHelpers';
import { validateAndFilterMediaFiles } from '../../utils/validateMediaFile';
import ConfirmDeleteDialog from '../UI/ConfirmDeleteDialog';
import ShareRecipientDialog, { ShareRecipientContact } from '../Chat/ShareRecipientDialog';
import { buildSharedNoteRef, prepareNoteForShare } from '../../utils/buildSharedNoteRef';
import DecryptedMedia from '../common/DecryptedMedia';
import MediaViewerDialog from '../common/MediaViewerDialog';
import { getUserDisplayName } from '../UI/UserProfileChip';
import {
  readCalendarUiPreferences,
  updateCalendarUiPreferences
} from '../../utils/calendarUiPreferences';

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
  encryptedMediaEnvelopePartner?: EncryptedTextPayload;
  metadataSenderId?: string;
  metadataRecipientId?: string;
}

export interface PlanNote extends RawPlanNoteFields {
  _id: string;
  title: string;
  content: string;
  category: string;
  media?: PlanNoteMedia[];
  createdAt: string;
  updatedAt: string;
  createdBy?: PlanNoteUser;
  lastEditedBy?: PlanNoteUser;
  readOnly?: boolean;
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

const PlansNotes: React.FC<{
  refreshKey?: number;
  noteIdFromUrl?: string | null;
}> = ({ refreshKey = 0, noteIdFromUrl = null }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { localDeviceKeys, ensureLocalKeys } = useCrypto();
  const encryptionRecipientId = useEncryptionRecipientId();
  const partnerId = usePartnerId();

  const [allNotes, setAllNotes] = useState<PlanNote[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() =>
    user?._id ? readCalendarUiPreferences(user._id).plansCategory ?? null : null
  );
  const categories = useMemo(
    () =>
      Array.from(new Set(allNotes.map((note) => note.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, getDateFnsLocale(i18n.language).code)
      ),
    [allNotes, i18n.language]
  );
  const notes = useMemo(
    () =>
      selectedCategory
        ? allNotes.filter((note) => note.category === selectedCategory)
        : allNotes,
    [allNotes, selectedCategory]
  );
  const [isPrefsHydrated, setIsPrefsHydrated] = useState(() => Boolean(user?._id));
  const skipNextCategorySaveRef = useRef(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshingNotes, setIsRefreshingNotes] = useState(false);
  const isFirstFetchRef = useRef(true);
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

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [noteToShare, setNoteToShare] = useState<PlanNote | null>(null);
  const [shareContacts, setShareContacts] = useState<ShareRecipientContact[]>([]);
  const [viewReadOnly, setViewReadOnly] = useState(false);
  const openingNoteIdRef = useRef<string | null>(null);

  const resolveKeys = useCallback(async (): Promise<LocalDeviceKeys> => {
    if (localDeviceKeys) return localDeviceKeys;
    await ensureLocalKeys();
    if (localDeviceKeys) return localDeviceKeys;
    if (!user?._id) {
      throw new Error(t('calendar.errors.notAuthorizedShort'));
    }
    const loaded = await loadLocalKeys(user._id);
    if (!loaded) {
      throw new Error(t('calendar.errors.unlockCrypto'));
    }
    return loaded;
  }, [localDeviceKeys, ensureLocalKeys, user?._id, t]);

  const fetchNotes = useCallback(async () => {
    const isFirstFetch = isFirstFetchRef.current;

    try {
      setError(null);
      if (isFirstFetch) {
        setIsInitialLoading(true);
      } else {
        setIsRefreshingNotes(true);
      }

      const response = await axios.get(`${API_URL}/api/calendar/plans`);
      const rawNotes: PlanNote[] = response.data.notes || [];
      const keys = await resolveKeys();
      const decryptedNotes = await decryptPlanNotesList(
        keys,
        rawNotes,
        user?._id,
        partnerId || undefined
      );
      setAllNotes(decryptedNotes);
    } catch (err) {
      console.error('Ошибка загрузки заметок:', err);
      setError(t('calendar.errors.loadNotesFailed'));
    } finally {
      if (isFirstFetch) {
        setIsInitialLoading(false);
        isFirstFetchRef.current = false;
      } else {
        setIsRefreshingNotes(false);
      }
    }
  }, [resolveKeys, user?._id, partnerId, t]);

  const clearNoteFromUrl = useCallback(() => {
    if (!searchParams.get('note')) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('note');
    setSearchParams(nextParams, { replace: true });
    openingNoteIdRef.current = null;
  }, [searchParams, setSearchParams]);

  const closeView = useCallback(() => {
    setViewOpen(false);
    setViewReadOnly(false);
    setViewingNote(null);
    clearNoteFromUrl();
  }, [clearNoteFromUrl]);

  useEffect(() => {
    if (!user?._id) {
      setIsPrefsHydrated(false);
      isFirstFetchRef.current = true;
      return;
    }

    skipNextCategorySaveRef.current = true;
    const prefs = readCalendarUiPreferences(user._id);
    setSelectedCategory(prefs.plansCategory ?? null);
    setIsPrefsHydrated(true);
  }, [user?._id]);

  useEffect(() => {
    if (selectedCategory && !categories.includes(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    if (skipNextCategorySaveRef.current) {
      skipNextCategorySaveRef.current = false;
      return;
    }

    updateCalendarUiPreferences(user._id, { plansCategory: selectedCategory });
  }, [user?._id, selectedCategory]);

  useEffect(() => {
    if (!isPrefsHydrated) {
      return;
    }

    void fetchNotes();
  }, [fetchNotes, isPrefsHydrated]);

  useEffect(() => {
    if (refreshKey > 0) {
      closeView();
      setFormOpen(false);
      setDeleteOpen(false);
      setEditingNote(null);
      setNoteToDelete(null);
      void fetchNotes();
    }
  }, [refreshKey, fetchNotes, closeView]);

  useEffect(() => {
    if (!noteIdFromUrl || isInitialLoading) return;
    if (openingNoteIdRef.current === noteIdFromUrl) return;

    const localNote = allNotes.find((note) => note._id === noteIdFromUrl);
    if (localNote) {
      openingNoteIdRef.current = noteIdFromUrl;
      void openView(localNote, false);
      return;
    }

    openingNoteIdRef.current = noteIdFromUrl;
    void (async () => {
      try {
        await openSharedNoteById(noteIdFromUrl);
      } catch (error) {
        console.error('Ошибка при открытии заметки:', error);
      }
    })();
  }, [noteIdFromUrl, allNotes, isInitialLoading]);

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
    closeView();
  };

  const openView = async (note: PlanNote, readOnly = false) => {
    try {
      const keys = await resolveKeys();
      const decrypted = await decryptPlanNote(keys, note, user?._id, partnerId || undefined);
      setViewingNote(decrypted);
    } catch {
      setViewingNote(note);
    }
    setViewReadOnly(readOnly);
    setViewOpen(true);
  };

  const openSharedNoteById = async (noteId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error(t('calendar.errors.notAuthorized'));
    }

    const response = await axios.get(`${API_URL}/api/calendar/plans/${encodeURIComponent(noteId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let note: PlanNote = response.data;
    const isReadOnly = Boolean(note.readOnly);

    try {
      const keys = await resolveKeys();
      note = await decryptPlanNote(keys, note, user?._id, partnerId || undefined);
    } catch {
      // keep raw note
    }

    await openView(note, isReadOnly);
  };

  const fetchShareContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShareContacts(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке контактов для отправки:', error);
      setShareContacts([]);
    }
  };

  const handleShareNote = (note: PlanNote) => {
    setNoteToShare(note);
    setShareModalOpen(true);
    void fetchShareContacts();
  };

  const handleSelectShareTarget = async (target: ShareRecipientContact) => {
    if (!noteToShare) return;

    let sharedNote;
    if (localDeviceKeys) {
      sharedNote = await prepareNoteForShare(
        localDeviceKeys,
        noteToShare,
        user?._id,
        partnerId || undefined
      );
    } else {
      sharedNote = buildSharedNoteRef(noteToShare);
    }

    setShareModalOpen(false);
    closeView();
    setNoteToShare(null);

    navigate('/chat', {
      state: {
        pendingSharedNote: sharedNote,
        targetUserId: target.id,
        targetUserName: target.name,
        targetUsername: target.username,
        targetUserEmail: target.email,
        targetUserAvatar: target.avatar
      }
    });
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
      setFormError(t('calendar.errors.titleRequired'));
      return;
    }
    if (!form.category.trim()) {
      setFormError(t('calendar.errors.categoryRequired'));
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      const keys = await resolveKeys();
      if (!encryptionRecipientId || !user?._id) {
        throw new Error(t('calendar.errors.encryptionRecipient'));
      }

      const selfId = user._id;
      const activePartnerId = partnerId && partnerId !== selfId ? partnerId : undefined;

      const titleDual = await encryptDualTextForContent(
        keys,
        selfId,
        activePartnerId,
        form.title.trim()
      );
      const contentDual = await encryptDualTextForContent(
        keys,
        selfId,
        activePartnerId,
        form.content.trim()
      );
      const categoryDual = await encryptDualTextForContent(
        keys,
        selfId,
        activePartnerId,
        form.category.trim()
      );

      const uploaded =
        files.length > 0
          ? await encryptAndUploadCalendarContentFiles(files, keys, selfId, activePartnerId)
          : [];

      const mediaPayload = uploaded.map((item) => ({
        url: item.url,
        publicId: item.publicId,
        fileSize: item.fileSize,
        mediaEnvelope: item.mediaEnvelope,
        encryptedMediaEnvelope: item.encryptedMediaEnvelope,
        encryptedMediaEnvelopePartner: item.encryptedMediaEnvelopePartner
      }));

      const payload = {
        encryptedTitle: titleDual.self,
        encryptedTitlePartner: titleDual.partner,
        encryptedContent: contentDual.self,
        encryptedContentPartner: contentDual.partner,
        encryptedCategory: categoryDual.self,
        encryptedCategoryPartner: categoryDual.partner,
        encryptionRecipientId
      };

      if (editingNote) {
        const response = await axios.put(`${API_URL}/api/calendar/plans/${editingNote._id}`, {
          ...payload,
          newMedia: mediaPayload,
          removeMediaIds: removedMediaIds
        });
        const decrypted = await decryptPlanNote(keys, response.data, selfId, partnerId || undefined);
        setAllNotes((prev) => prev.map((n) => (n._id === editingNote._id ? decrypted : n)));
        if (viewingNote?._id === editingNote._id) {
          setViewingNote(decrypted);
        }
      } else {
        const response = await axios.post(`${API_URL}/api/calendar/plans`, {
          ...payload,
          media: mediaPayload
        });
        const decrypted = await decryptPlanNote(keys, response.data, selfId, partnerId || undefined);
        setAllNotes((prev) => [decrypted, ...prev]);
      }

      resetMediaState();
      setFormOpen(false);
      setEditingNote(null);
      setForm(emptyForm);
      void fetchNotes();
    } catch (err: any) {
      console.error('Ошибка сохранения заметки:', err);
      setFormError(err.response?.data?.error || err.message || t('calendar.errors.saveNoteFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;

    try {
      setIsDeleting(true);
      await axios.delete(`${API_URL}/api/calendar/plans/${noteToDelete._id}`);
      setAllNotes((prev) => prev.filter((n) => n._id !== noteToDelete._id));
      setDeleteOpen(false);
      closeView();
      setNoteToDelete(null);
      void fetchNotes();
    } catch (err) {
      console.error('Ошибка удаления заметки:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    formatCalendarDateTime(new Date(dateStr), i18n.language);

  const renderAuthor = (author?: PlanNoteUser) => {
    if (!author) return t('calendar.common.unknown');
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
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        <Typography variant="subtitle1" color="text.secondary" sx={{ minWidth: 0 }}>
          {t('calendar.plans.subtitle')}
        </Typography>
        {!isInitialLoading && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={openCreateForm}
            sx={{
              flexShrink: 0,
              '& .MuiButton-startIcon': {
                marginRight: 0.5
              }
            }}
          >
            {t('calendar.plans.newNote')}
          </Button>
        )}
      </Box>

      {categories.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            label={t('calendar.plans.all')}
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

      <Box sx={{ flexGrow: 1, overflow: 'auto', position: 'relative' }}>
        {(isInitialLoading || isRefreshingNotes) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}
        {!isInitialLoading && !isRefreshingNotes && notes.length === 0 && (
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
            <Typography color="text.secondary">
              {selectedCategory
                ? t('calendar.plans.emptyCategory', { category: selectedCategory })
                : t('calendar.plans.empty')}
            </Typography>
          </Paper>
        )}
        {!isInitialLoading && !isRefreshingNotes && notes.length > 0 && (
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
      <ResponsiveDialog open={formOpen} onClose={() => !isSaving && setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          {editingNote ? t('calendar.plans.editNote') : t('calendar.plans.newNote')}
          <IconButton onClick={() => setFormOpen(false)} disabled={isSaving} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ overflow: 'visible', p: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 3, pt: 2.5, pb: 2 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label={t('calendar.plans.title')}
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
                label={t('calendar.plans.category')}
                placeholder={t('calendar.plans.categoryPlaceholder')}
                inputProps={{ ...params.inputProps, maxLength: 100 }}
              />
            )}
          />
          <TextField
            label={t('calendar.plans.content')}
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            fullWidth
            multiline
            minRows={5}
            placeholder={t('calendar.plans.contentPlaceholder')}
            inputProps={{ maxLength: 10000 }}
          />

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {t('calendar.plans.encryptedMedia')}
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
                {t('calendar.media.addPhotosOrVideos')}
              </Button>
            </label>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {getVideoLimitsHint(t)}
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={isSaving}>
            {t('calendar.common.cancel')}
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving
              ? t('calendar.common.saving')
              : editingNote
                ? t('calendar.common.save')
                : t('calendar.plans.create')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>

      {/* Просмотр заметки */}
      <ResponsiveDialog open={viewOpen} onClose={closeView} fullWidth maxWidth="sm">
        {viewingNote && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ minWidth: 0, pr: 1 }}>
                <Typography variant="h6">{viewingNote.title}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  <Chip label={viewingNote.category} size="small" />
                  {viewReadOnly && (
                    <Chip label={t('calendar.detail.readOnly')} size="small" color="default" />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                {!viewReadOnly && (
                  <IconButton
                    onClick={() => handleShareNote(viewingNote)}
                    size="small"
                    title={t('calendar.detail.share')}
                  >
                    <ReplyOutlinedIcon />
                  </IconButton>
                )}
                <IconButton onClick={closeView} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography
                variant="body1"
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: 2 }}
              >
                {viewingNote.content || t('calendar.common.noText')}
              </Typography>

              {viewingNote.media && viewingNote.media.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('calendar.media.photosAndVideos')}
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
                    {t('calendar.plans.createdBy', { name: renderAuthor(viewingNote.createdBy) })} ·{' '}
                    {formatDate(viewingNote.createdAt)}
                  </Typography>
                </Box>
                {viewingNote.lastEditedBy &&
                  viewingNote.lastEditedBy._id !== viewingNote.createdBy?._id && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={viewingNote.lastEditedBy.avatar} sx={{ width: 28, height: 28 }}>
                        {viewingNote.lastEditedBy.username?.[0]?.toUpperCase()}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {t('calendar.plans.editedBy', { name: renderAuthor(viewingNote.lastEditedBy) })} ·{' '}
                        {formatDate(viewingNote.updatedAt)}
                      </Typography>
                    </Box>
                  )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, justifyContent: viewReadOnly ? 'flex-end' : 'space-between' }}>
              {!viewReadOnly && (
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    setNoteToDelete(viewingNote);
                    setDeleteOpen(true);
                  }}
                >
                  {t('calendar.common.delete')}
                </Button>
              )}
              {!viewReadOnly && (
                <Button variant="contained" startIcon={<EditIcon />} onClick={() => openEditForm(viewingNote)}>
                  {t('calendar.common.edit')}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </ResponsiveDialog>

      <MediaViewerDialog
        open={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
        content={
          viewerMedia
            ? {
                url: viewerMedia.media.url,
                resourceType: viewerMedia.media.resourceType,
                cacheKey: `plan-${viewerMedia.noteId}-${viewerMedia.media._id}-full`,
                encrypted: viewerMedia.media.encrypted,
                mediaEnvelope: viewerMedia.media.mediaEnvelope
              }
            : null
        }
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => !isDeleting && setDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName={noteToDelete?.title}
        isLoading={isDeleting}
        message={
          noteToDelete
            ? t('calendar.plans.deleteConfirm', { title: noteToDelete.title })
            : undefined
        }
      />

      <ShareRecipientDialog
        open={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setNoteToShare(null);
        }}
        onSelect={handleSelectShareTarget}
        title={t('chat.dialog.shareNote')}
        contacts={shareContacts}
      />
    </Box>
  );
};

export default PlansNotes;
