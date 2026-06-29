import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import AppDateTimePicker from '../UI/AppDateTimePicker';
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
import { useRelationship } from '../../hooks/useRelationship';
import {
  DATE_TIME_INPUT_FORMAT,
  formatCalendarDeadlineDateTime,
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
import { playChatDeleteSound, playChatSendSound, unlockChatAudio } from '../../utils/chatSounds';
import {
  getCalendarPlanCategoryChipSx,
  getCalendarPlanEmptySx,
  getCalendarPlanNoteCardSx,
  getCalendarPlansSubtitleSx,
  getCalendarPlansToolbarSx,
} from './calendarPageStyles';
import { getEventMediaPreviewSx } from './calendarDrawerStyles';

const planNoteMediaPreviewStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

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
  deadlineAt?: string | null;
  deadlineNotifyUserIds?: string[];
  completedAt?: string | null;
  completedBy?: PlanNoteUser;
  createdAt: string;
  updatedAt: string;
  createdBy?: PlanNoteUser;
  lastEditedBy?: PlanNoteUser;
  readOnly?: boolean;
}

type DeadlineNotifyOption = {
  id: string;
  label: string;
};

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
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { localDeviceKeys, ensureLocalKeys } = useCrypto();
  const encryptionRecipientId = useEncryptionRecipientId();
  const partnerId = usePartnerId();
  const { partner } = useRelationship();

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
    () => {
      const filtered = selectedCategory
        ? allNotes.filter((note) => note.category === selectedCategory)
        : allNotes;

      return [...filtered].sort((a, b) => {
        const aCompleted = Boolean(a.completedAt);
        const bCompleted = Boolean(b.completedAt);
        if (aCompleted !== bCompleted) {
          return aCompleted ? 1 : -1;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    },
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

  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineAt, setDeadlineAt] = useState<Date | null>(null);
  const [notifyOnDeadline, setNotifyOnDeadline] = useState(false);
  const [notifyUserIds, setNotifyUserIds] = useState<string[]>([]);

  const deadlineNotifyOptions = useMemo<DeadlineNotifyOption[]>(() => {
    const options: DeadlineNotifyOption[] = [];
    if (user?._id) {
      options.push({
        id: user._id,
        label: t('calendar.plans.deadlineNotifySelf')
      });
    }
    if (partner?._id && partner._id !== user?._id) {
      options.push({
        id: partner._id,
        label: getUserDisplayName(partner)
      });
    }
    return options;
  }, [user?._id, partner, t]);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<PlanNoteMedia[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<PlanNote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

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

  const resetDeadlineState = () => {
    setHasDeadline(false);
    setDeadlineAt(null);
    setNotifyOnDeadline(false);
    setNotifyUserIds(user?._id ? [user._id] : []);
  };

  const openCreateForm = () => {
    setEditingNote(null);
    setForm(emptyForm);
    setFormError(null);
    resetMediaState();
    resetDeadlineState();
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
    setHasDeadline(Boolean(note.deadlineAt));
    setDeadlineAt(note.deadlineAt ? new Date(note.deadlineAt) : null);
    const existingNotifyIds = note.deadlineNotifyUserIds || [];
    setNotifyOnDeadline(existingNotifyIds.length > 0);
    setNotifyUserIds(existingNotifyIds);
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
    if (hasDeadline && !deadlineAt) {
      setFormError(t('calendar.errors.deadlineRequired'));
      return;
    }
    if (hasDeadline && deadlineAt && deadlineAt.getTime() <= Date.now()) {
      setFormError(t('calendar.errors.deadlineFuture'));
      return;
    }
    if (hasDeadline && notifyOnDeadline && notifyUserIds.length === 0) {
      setFormError(t('calendar.errors.deadlineNotifyUsersRequired'));
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
        encryptionRecipientId,
        deadlineAt: hasDeadline && deadlineAt ? deadlineAt.toISOString() : null,
        deadlineNotifyUserIds:
          hasDeadline && notifyOnDeadline ? notifyUserIds : []
      };

      const buildDeadlineSnapshot = async (noteId: string) => {
        const noteLike = {
          _id: noteId,
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category.trim(),
          updatedAt: new Date().toISOString(),
          metadataSenderId: selfId,
          metadataRecipientId: activePartnerId || selfId,
          media: editingNote
            ? existingMedia
            : []
        };

        if (localDeviceKeys) {
          return prepareNoteForShare(localDeviceKeys, noteLike, selfId, activePartnerId);
        }
        return buildSharedNoteRef(noteLike);
      };

      if (editingNote) {
        const deadlinePayload =
          hasDeadline && notifyOnDeadline
            ? {
                deadlineSharedNoteSnapshot: await buildDeadlineSnapshot(editingNote._id)
              }
            : { deadlineSharedNoteSnapshot: null };

        const response = await axios.put(`${API_URL}/api/calendar/plans/${editingNote._id}`, {
          ...payload,
          ...deadlinePayload,
          newMedia: mediaPayload,
          removeMediaIds: removedMediaIds
        });
        const decrypted = await decryptPlanNote(keys, response.data, selfId, partnerId || undefined);
        setAllNotes((prev) => prev.map((n) => (n._id === editingNote._id ? decrypted : n)));
        if (viewingNote?._id === editingNote._id) {
          setViewingNote(decrypted);
        }
      } else {
        const deadlinePayload =
          hasDeadline && notifyOnDeadline
            ? {
                deadlineSharedNoteSnapshot: await buildDeadlineSnapshot('pending')
              }
            : { deadlineSharedNoteSnapshot: null };

        const response = await axios.post(`${API_URL}/api/calendar/plans`, {
          ...payload,
          ...deadlinePayload,
          media: mediaPayload
        });
        const decrypted = await decryptPlanNote(keys, response.data, selfId, partnerId || undefined);
        setAllNotes((prev) => [decrypted, ...prev]);
      }

      unlockChatAudio();
      void playChatSendSound();

      resetMediaState();
      resetDeadlineState();
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

  const handleToggleCompletion = async (note: PlanNote) => {
    const nextCompleted = !note.completedAt;

    try {
      setIsCompleting(true);
      const response = await axios.patch(`${API_URL}/api/calendar/plans/${note._id}/completion`, {
        completed: nextCompleted
      });
      const keys = await resolveKeys();
      const decrypted = await decryptPlanNote(
        keys,
        response.data,
        user?._id,
        partnerId || undefined
      );
      setAllNotes((prev) => prev.map((n) => (n._id === note._id ? decrypted : n)));
      if (viewingNote?._id === note._id) {
        setViewingNote(decrypted);
      }
    } catch (err) {
      console.error('Ошибка изменения статуса заметки:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;

    unlockChatAudio();
    void playChatDeleteSound();

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
    formatCalendarDeadlineDateTime(new Date(dateStr), i18n.language);

  const dateFnsLocale = getDateFnsLocale(i18n.language);

  const renderAuthor = (author?: PlanNoteUser) => {
    if (!author) return t('calendar.common.unknown');
    return getUserDisplayName(author);
  };

  const renderMediaThumbnail = (noteId: string, media: PlanNoteMedia, size = 72) => (
    <Box
      key={media._id}
      sx={{
        ...getEventMediaPreviewSx(theme),
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <DecryptedMedia
        cacheKey={`plan-${noteId}-${media._id}`}
        url={media.url}
        resourceType={media.resourceType}
        encrypted={media.encrypted}
        mediaEnvelope={media.mediaEnvelope}
        videoPreview
        imageStyle={planNoteMediaPreviewStyle}
        videoStyle={planNoteMediaPreviewStyle}
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
            ...getEventMediaPreviewSx(theme),
            width: 96,
            height: 96,
            cursor: onClick ? 'pointer' : 'default',
            position: 'relative',
          }}
        >
          <DecryptedMedia
            cacheKey={`plan-${noteId}-${media._id}`}
            url={media.url}
            resourceType={media.resourceType}
            encrypted={media.encrypted}
            mediaEnvelope={media.mediaEnvelope}
            videoPreview={media.resourceType === 'video'}
            imageStyle={planNoteMediaPreviewStyle}
            videoStyle={planNoteMediaPreviewStyle}
            loadingMinHeight={96}
          />
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={getCalendarPlansToolbarSx()}>
        <Typography sx={getCalendarPlansSubtitleSx()}>
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
              textTransform: 'none',
              fontWeight: 600,
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
            sx={selectedCategory === null ? undefined : getCalendarPlanCategoryChipSx(theme, false)}
          />
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              clickable
              color={selectedCategory === cat ? 'primary' : 'default'}
              variant={selectedCategory === cat ? 'filled' : 'outlined'}
              onClick={() => setSelectedCategory(cat)}
              sx={selectedCategory === cat ? undefined : getCalendarPlanCategoryChipSx(theme, false)}
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
          <Box sx={getCalendarPlanEmptySx(theme)}>
            <Typography color="text.secondary">
              {selectedCategory
                ? t('calendar.plans.emptyCategory', { category: selectedCategory })
                : t('calendar.plans.empty')}
            </Typography>
          </Box>
        )}
        {!isInitialLoading && !isRefreshingNotes && notes.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {notes.map((note) => {
              const isCompleted = Boolean(note.completedAt);
              return (
              <Box
                key={note._id}
                onClick={() => void openView(note)}
                sx={getCalendarPlanNoteCardSx(theme, { completed: isCompleted })}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      noWrap
                      sx={{
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        color: isCompleted ? 'text.secondary' : 'text.primary'
                      }}
                    >
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75, flexShrink: 0 }}>
                    {isCompleted && (
                      <Chip label={t('calendar.plans.completed')} size="small" color="success" />
                    )}
                    <Chip label={note.category} size="small" />
                  </Box>
                </Box>
                {note.deadlineAt && !isCompleted && (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 0.75, display: 'block' }}>
                    {t('calendar.plans.deadlineUntil', {
                      date: formatCalendarDeadlineDateTime(new Date(note.deadlineAt), i18n.language)
                    })}
                  </Typography>
                )}
                {isCompleted && note.completedAt && (
                  <Typography variant="caption" color="success.main" sx={{ mt: 0.75, display: 'block' }}>
                    {t('calendar.plans.completedAt', {
                      date: formatCalendarDeadlineDateTime(new Date(note.completedAt), i18n.language)
                    })}
                  </Typography>
                )}
              </Box>
            );
            })}
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
            fullWidth
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

          <FormControlLabel
            control={
              <Checkbox
                checked={hasDeadline}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setHasDeadline(checked);
                  if (!checked) {
                    setDeadlineAt(null);
                    setNotifyOnDeadline(false);
                    setNotifyUserIds([]);
                  }
                }}
                disabled={isSaving}
              />
            }
            label={t('calendar.plans.deadlineEnabled')}
          />

          {hasDeadline && (
              <AppDateTimePicker
                label={t('calendar.plans.deadlineAt')}
                value={deadlineAt}
                onChange={(value) => setDeadlineAt(value)}
                format={DATE_TIME_INPUT_FORMAT}
                minDateTime={new Date()}
                disabled={isSaving}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
          )}

          {hasDeadline && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={notifyOnDeadline}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setNotifyOnDeadline(checked);
                    if (checked && notifyUserIds.length === 0 && user?._id) {
                      setNotifyUserIds([user._id]);
                    }
                    if (!checked) {
                      setNotifyUserIds([]);
                    }
                  }}
                  disabled={isSaving || deadlineNotifyOptions.length === 0}
                />
              }
              label={t('calendar.plans.deadlineNotifyEnabled')}
            />
          )}

          {hasDeadline && notifyOnDeadline && deadlineNotifyOptions.length > 0 && (
            <Autocomplete
              multiple
              fullWidth
              options={deadlineNotifyOptions}
              value={deadlineNotifyOptions.filter((option) => notifyUserIds.includes(option.id))}
              onChange={(_, value) => setNotifyUserIds(value.map((item) => item.id))}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              disableCloseOnSelect
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('calendar.plans.deadlineNotifyUsers')}
                  placeholder={t('calendar.plans.deadlineNotifyUsers')}
                />
              )}
              disabled={isSaving}
            />
          )}

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
                    ...getEventMediaPreviewSx(theme),
                    position: 'relative',
                    width: 96,
                    height: 96,
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
                <Typography variant="h6" sx={{ textDecoration: viewingNote.completedAt ? 'line-through' : 'none' }}>
                  {viewingNote.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  <Chip label={viewingNote.category} size="small" />
                  {viewingNote.completedAt && (
                    <Chip label={t('calendar.plans.completed')} size="small" color="success" />
                  )}
                  {viewingNote.deadlineAt && !viewingNote.completedAt && (
                    <Chip
                      label={t('calendar.plans.deadlineUntil', {
                        date: formatCalendarDeadlineDateTime(new Date(viewingNote.deadlineAt), i18n.language)
                      })}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                  {viewReadOnly && (
                    <Chip label={t('calendar.detail.readOnly')} size="small" color="default" />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flexShrink: 0 }}>
                {!viewReadOnly && (
                  <IconButton
                    onClick={() => handleShareNote(viewingNote)}
                    size="small"
                    aria-label={t('calendar.detail.share')}
                    title={t('calendar.detail.share')}
                  >
                    <ReplyOutlinedIcon />
                  </IconButton>
                )}
                {!viewReadOnly && (
                  <IconButton
                    onClick={() => openEditForm(viewingNote)}
                    size="small"
                    aria-label={t('calendar.detail.edit')}
                    title={t('calendar.detail.edit')}
                  >
                    <EditIcon />
                  </IconButton>
                )}
                {!viewReadOnly && (
                  <IconButton
                    onClick={() => {
                      setNoteToDelete(viewingNote);
                      setDeleteOpen(true);
                    }}
                    size="small"
                    aria-label={t('calendar.detail.delete')}
                    title={t('calendar.detail.delete')}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
                <IconButton onClick={closeView} size="small" aria-label={t('calendar.common.cancel')}>
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
                {viewingNote.completedAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={viewingNote.completedBy?.avatar} sx={{ width: 28, height: 28 }}>
                      {viewingNote.completedBy?.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography variant="caption" color="success.main">
                      {t('calendar.plans.completedBy', {
                        name: renderAuthor(viewingNote.completedBy),
                        date: formatCalendarDeadlineDateTime(
                          new Date(viewingNote.completedAt),
                          i18n.language
                        )
                      })}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              {!viewReadOnly && (
                <Button
                  fullWidth
                  variant={viewingNote.completedAt ? 'outlined' : 'contained'}
                  color="primary"
                  onClick={() => void handleToggleCompletion(viewingNote)}
                  disabled={isCompleting}
                >
                  {viewingNote.completedAt
                    ? t('calendar.plans.markIncomplete')
                    : t('calendar.plans.markCompleted')}
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
