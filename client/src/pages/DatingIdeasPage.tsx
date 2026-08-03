import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ViewListIcon from '@mui/icons-material/ViewList';
import ReplayIcon from '@mui/icons-material/Replay';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { usePartnerId } from '../hooks/usePartnerId';
import { useCrypto } from '../contexts/CryptoContext';
import { loadLocalKeys, type LocalDeviceKeys } from '../crypto/cryptoService';
import {
  decryptCalendarEventsWithMedia,
  encryptDualTextForContent,
} from '../crypto/contentCryptoService';
import { encryptAndUploadCalendarContentFiles } from '../crypto/encryptedUploadService';
import { notifyCalendarEventsChanged } from '../hooks/useCalendarEvents';
import { isVideoCompressionError } from '../utils/compressVideo';
import type { PrepareMediaProgress } from '../utils/parallelMediaPrepare';
import EventEditorDrawer from '../components/Calendar/EventEditorDrawer';
import HistoryListDialog from '../components/Feed/DatingIdeas/HistoryListDialog';
import CompletedEventPreview, {
  type CompletedEventPreviewData,
} from '../components/Feed/DatingIdeas/CompletedEventPreview';
import CurrencyBadge from '../components/Pets/CurrencyBadge';
import CurrencyCoinIcon from '../components/Pets/CurrencyCoinIcon';
import {
  completeDatingIdea,
  fetchDatingIdeas,
  generateDatingIdea,
  skipDatingIdea,
  type DatingIdea,
} from '../services/datingIdeasService';
import {
  cardReveal,
  getDatingIdeasPageRootSx,
  getGenerateOfferSx,
  getGeneratingSx,
  getHistoryCardSx,
  getIdeaCardSx,
  sparklePulse,
} from '../components/Feed/DatingIdeas/datingIdeasStyles';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import { emitCurrencyUpdated } from '../utils/currencyEvents';

type PagePhase = 'loading' | 'offer' | 'generating' | 'idea' | 'flipping';

const toCompletedEventPreview = (
  event: any,
  fallbackEventId?: string | null
): CompletedEventPreviewData => {
  const mediaSource = Array.isArray(event?.media) ? event.media : [];
  const media = mediaSource
    .filter((item: { url?: string }) => item?.url && String(item.url).trim().length > 0)
    .map(
      (item: {
        url: string;
        resourceType?: 'image' | 'video';
        encrypted?: boolean;
        mediaEnvelope?: CompletedEventPreviewData['mediaEnvelope'];
        _id?: string;
      }) => ({
        mediaUrl: item.url,
        resourceType: item.resourceType === 'video' ? ('video' as const) : ('image' as const),
        encrypted: item.encrypted,
        mediaEnvelope: item.mediaEnvelope,
        mediaId: item._id,
      })
    );
  const firstMedia = media[0];

  return {
    title: event?.title,
    description: event?.description,
    mediaUrl: firstMedia?.mediaUrl,
    resourceType: firstMedia?.resourceType,
    encrypted: firstMedia?.encrypted,
    mediaEnvelope: firstMedia?.mediaEnvelope,
    mediaId: firstMedia?.mediaId,
    media,
    eventId: event?.eventId || fallbackEventId || undefined,
  };
};

const PENDING_COMPLETED_IDEA_KEY = 'amorely:dating-ideas:pending-completed';
const PENDING_COMPLETED_IDEA_EVENT = 'amorely:dating-ideas-pending';

const DatingIdeasPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const partnerId = usePartnerId();
  const { localDeviceKeys, ensureLocalKeys } = useCrypto();

  const [phase, setPhase] = useState<PagePhase>('loading');
  const [balance, setBalance] = useState(0);
  const [cost, setCost] = useState(1);
  const [activeIdea, setActiveIdea] = useState<DatingIdea | null>(null);
  const [history, setHistory] = useState<DatingIdea[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedHistoryIdea, setSelectedHistoryIdea] = useState<DatingIdea | null>(null);
  const [completingIdea, setCompletingIdea] = useState<DatingIdea | null>(null);
  const [completedEventPreview, setCompletedEventPreview] = useState<CompletedEventPreviewData | null>(null);
  const [completedEventLoading, setCompletedEventLoading] = useState(false);
  const [completedEventError, setCompletedEventError] = useState<string | null>(null);
  const [editorInitialDate] = useState(() => new Date());
  const completingIdeaRef = useRef<DatingIdea | null>(null);
  const saveInProgressRef = useRef(false);
  // Intentionally NOT synced from state on every render — early writes during
  // save must win over stale state until React commits the completed view.
  const selectedHistoryIdeaRef = useRef<DatingIdea | null>(null);
  const editorOpenRef = useRef(false);
  const seededPreviewEventIdRef = useRef<string | null>(null);
  const pageTopRef = useRef<HTMLDivElement | null>(null);
  const language = i18n.language;

  editorOpenRef.current = editorOpen || saveInProgress;

  const scrollToPageTop = useCallback(() => {
    const start = pageTopRef.current;
    if (!start) return;
    let parent: HTMLElement | null = start.parentElement;
    while (parent) {
      const { overflowY } = window.getComputedStyle(parent);
      if (overflowY === 'auto' || overflowY === 'scroll') {
        parent.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      parent = parent.parentElement;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectHistoryIdea = useCallback((idea: DatingIdea | null, options?: { persist?: boolean }) => {
    selectedHistoryIdeaRef.current = idea;
    setSelectedHistoryIdea(idea);
    if (options?.persist) {
      if (idea?.status === 'completed' && idea.id) {
        try {
          sessionStorage.setItem(
            PENDING_COMPLETED_IDEA_KEY,
            JSON.stringify({
              id: idea.id,
              eventId: idea.eventId || null,
              title: idea.title,
              description: idea.description,
              emoji: idea.emoji,
            })
          );
          window.dispatchEvent(new Event(PENDING_COMPLETED_IDEA_EVENT));
        } catch {
          // ignore quota / private mode
        }
      }
    } else if (idea === null) {
      try {
        sessionStorage.removeItem(PENDING_COMPLETED_IDEA_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  const loadOverview = useCallback(async (options?: { preservePhase?: boolean }) => {
    try {
      const data = await fetchDatingIdeas(language);
      let pendingCompleted: {
        id: string;
        eventId?: string | null;
        title?: string;
        description?: string;
        emoji?: string;
      } | null = null;
      try {
        const raw = sessionStorage.getItem(PENDING_COMPLETED_IDEA_KEY);
        pendingCompleted = raw ? JSON.parse(raw) : null;
      } catch {
        pendingCompleted = null;
      }

      // Do not clobber the post-save completed view (or an in-flight save)
      // just because there is no longer an active idea.
      const shouldPreservePhase =
        Boolean(options?.preservePhase) ||
        saveInProgressRef.current ||
        editorOpenRef.current ||
        Boolean(selectedHistoryIdeaRef.current) ||
        Boolean(pendingCompleted?.id);

      if (!data.hasPartner) {
        if (!shouldPreservePhase) {
          setPhase('offer');
        }
        setError(i18n.t('datingIdeas.partnerRequired'));
        return;
      }
      setBalance(data.balance ?? 0);
      setCost(data.cost ?? 1);
      setHistory(data.history ?? []);
      setActiveIdea(data.active ?? null);

      const selectedId = selectedHistoryIdeaRef.current?.id || pendingCompleted?.id || null;
      if (selectedId) {
        const refreshed =
          (data.history ?? []).find((item) => item.id === selectedId) ||
          (pendingCompleted?.id === selectedId
            ? ({
                id: pendingCompleted.id,
                ideaKey: '',
                emoji: pendingCompleted.emoji || '💕',
                title: pendingCompleted.title || '',
                description: pendingCompleted.description || '',
                status: 'completed' as const,
                eventId: pendingCompleted.eventId || null,
                createdBy: '',
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                skippedAt: null,
              } satisfies DatingIdea)
            : null);
        if (refreshed) {
          selectHistoryIdea(refreshed, { persist: Boolean(pendingCompleted?.id) });
          setPhase('idea');
          setFlipped(false);
        }
      }

      if (!shouldPreservePhase) {
        if (data.active) {
          setPhase('idea');
          setFlipped(false);
        } else {
          setPhase('offer');
          setFlipped(false);
        }
      }
      setError(null);
    } catch {
      setError(i18n.t('datingIdeas.loadError'));
      if (
        !options?.preservePhase &&
        !saveInProgressRef.current &&
        !editorOpenRef.current &&
        !selectedHistoryIdeaRef.current
      ) {
        setPhase('offer');
      }
    }
  }, [i18n, language, selectHistoryIdea]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const handlePendingCompleted = () => {
      void loadOverview({ preservePhase: true });
    };
    window.addEventListener(PENDING_COMPLETED_IDEA_EVENT, handlePendingCompleted);
    return () => {
      window.removeEventListener(PENDING_COMPLETED_IDEA_EVENT, handlePendingCompleted);
    };
  }, [loadOverview]);

  useEffect(() => {
    let cancelled = false;

    const loadCompletedEvent = async () => {
      if (!selectedHistoryIdea || selectedHistoryIdea.status !== 'completed') {
        seededPreviewEventIdRef.current = null;
        setCompletedEventPreview(null);
        setCompletedEventError(null);
        setCompletedEventLoading(false);
        return;
      }

      const selectedEventId = selectedHistoryIdea.eventId
        ? String(selectedHistoryIdea.eventId)
        : null;

      // Already seeded from save — keep preview, do not flash empty state.
      if (
        selectedEventId &&
        seededPreviewEventIdRef.current === selectedEventId
      ) {
        setCompletedEventLoading(false);
        setCompletedEventError(null);
        return;
      }

      // Selecting another idea — drop the save seed.
      seededPreviewEventIdRef.current = null;

      setCompletedEventLoading(true);
      setCompletedEventError(null);
      setCompletedEventPreview(null);

      const fallbackPreview: CompletedEventPreviewData = {
        title: selectedHistoryIdea.title,
        description: selectedHistoryIdea.description,
        eventId: selectedHistoryIdea.eventId || undefined,
      };

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error(t('calendar.errors.notAuthorized'));
        }

        const keys = localDeviceKeys || (user?._id ? await loadLocalKeys(user._id) : null);
        let event: any = null;

        if (selectedHistoryIdea.eventId) {
          try {
            const response = await axios.get(
              `${API_URL}/api/calendar/events/${encodeURIComponent(selectedHistoryIdea.eventId)}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            event = response.data;
          } catch {
            event = null;
          }
        }

        if (!event) {
          try {
            const listResponse = await axios.get(`${API_URL}/api/calendar/events`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const events = Array.isArray(listResponse.data) ? listResponse.data : [];
            event =
              events.find(
                (item: { eventId?: string; _id?: string }) =>
                  selectedHistoryIdea.eventId &&
                  (item.eventId === selectedHistoryIdea.eventId ||
                    item._id === selectedHistoryIdea.eventId)
              ) ||
              events.find(
                (item: {
                  isDatingIdeaEvent?: boolean;
                  datingIdeaTitle?: string;
                  title?: string;
                }) =>
                  item.isDatingIdeaEvent &&
                  (item.datingIdeaTitle === selectedHistoryIdea.title ||
                    item.title === selectedHistoryIdea.title)
              ) ||
              null;
          } catch {
            event = null;
          }
        }

        if (event && keys) {
          const [decrypted] = await decryptCalendarEventsWithMedia(
            keys,
            [event],
            user?._id,
            partnerId || undefined
          );
          event = decrypted;
        }

        if (cancelled) return;

        if (event) {
          const preview = toCompletedEventPreview(event, selectedHistoryIdea.eventId);
          if (!preview.title && !preview.description) {
            preview.title = selectedHistoryIdea.title;
            preview.description = selectedHistoryIdea.description;
          }
          setCompletedEventPreview(preview);
          setCompletedEventError(null);
        } else {
          setCompletedEventPreview(fallbackPreview);
          setCompletedEventError(null);
        }
      } catch (loadError) {
        console.error('Failed to load dating idea event preview:', loadError);
        if (!cancelled) {
          setCompletedEventPreview(fallbackPreview);
          setCompletedEventError(null);
        }
      } finally {
        if (!cancelled) {
          setCompletedEventLoading(false);
        }
      }
    };

    void loadCompletedEvent();
    return () => {
      cancelled = true;
    };
  }, [selectedHistoryIdea, localDeviceKeys, user?._id, partnerId, t]);

  const getCalendarEncryptionTargets = async () => {
    if (!user?._id) return null;
    const selfId = user._id;
    let activePartnerId = partnerId && partnerId !== selfId ? partnerId : undefined;

    if (!activePartnerId) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const meResponse = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const fromMe = meResponse.data?.partnerId;
          if (fromMe && String(fromMe) !== selfId) {
            activePartnerId = String(fromMe);
          }
        } catch {
          // continue
        }
      }
    }

    return {
      selfId,
      activePartnerId,
      targetId: activePartnerId || selfId,
    };
  };

  const resolveKeysForEncrypt = async (): Promise<LocalDeviceKeys> => {
    if (localDeviceKeys) {
      return localDeviceKeys;
    }
    await ensureLocalKeys();
    if (!user?._id) {
      throw new Error(t('calendar.errors.notAuthorizedShort'));
    }
    const loaded = await loadLocalKeys(user._id);
    if (!loaded) {
      throw new Error(t('calendar.errors.unlockCrypto'));
    }
    return loaded;
  };

  const handleGenerate = async () => {
    setError(null);
    setPhase('generating');
    setFlipped(false);
    selectHistoryIdea(null);
    setCompletingIdea(null);

    const startedAt = Date.now();
    try {
      if (activeIdea) {
        try {
          await skipDatingIdea(activeIdea.id);
        } catch {
          // generate will also skip actives server-side
        }
      }

      const result = await generateDatingIdea(i18n.language);
      const elapsed = Date.now() - startedAt;
      if (elapsed < 1400) {
        await new Promise((resolve) => setTimeout(resolve, 1400 - elapsed));
      }
      setActiveIdea(result.idea);
      setBalance(result.balance);
      setCost(result.cost ?? cost);
      emitCurrencyUpdated(result.balance, 0);
      setPhase('idea');
      void loadOverview({ preservePhase: true });
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 402) {
        setError(t('datingIdeas.insufficientBalance', { cost }));
      } else {
        setError(t('datingIdeas.generateError'));
      }
      setPhase(activeIdea ? 'idea' : 'offer');
    }
  };

  const handleCompletedClick = (idea?: DatingIdea | null) => {
    const target = idea || activeIdea;
    if (!target) return;
    completingIdeaRef.current = target;
    setCompletingIdea(target);
    setPhase('flipping');
    setFlipped(true);
    window.setTimeout(() => {
      setEditorOpen(true);
    }, 650);
  };

  const handleEditorClose = () => {
    // Never dismiss the editor while a dating-idea save is in flight.
    // open={editorOpen || saveInProgress} also keeps the drawer mounted.
    if (saveInProgressRef.current) {
      return;
    }
    setEditorOpen(false);
    setFlipped(false);
    completingIdeaRef.current = null;
    setCompletingIdea(null);
    if (selectedHistoryIdeaRef.current) {
      setPhase('idea');
      return;
    }
    setPhase(activeIdea ? 'idea' : 'offer');
  };

  const handleSaveEvent = async (
    eventData: {
      date: Date;
      title: string;
      description: string;
      files: File[];
      isBirthdayEvent?: boolean;
      isAnniversaryEvent?: boolean;
      isDatingIdeaEvent?: boolean;
    },
    saveOptions?: {
      signal?: AbortSignal;
      onFileUploaded?: (publicId: string) => void;
      onPrepareStart?: (progress: PrepareMediaProgress) => void;
    }
  ) => {
    const idea = completingIdeaRef.current || completingIdea || activeIdea;
    if (!idea) {
      throw new Error(t('datingIdeas.generateError'));
    }

    saveInProgressRef.current = true;
    setSaveInProgress(true);
    setEditorOpen(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('calendar.errors.notAuthorized'));
      }

      const keys = await resolveKeysForEncrypt();
      const encryptionTargets = await getCalendarEncryptionTargets();
      if (!encryptionTargets) {
        throw new Error(t('calendar.errors.encryptionRecipient'));
      }

      const { selfId, activePartnerId, targetId } = encryptionTargets;
      const titleDual = await encryptDualTextForContent(
        keys,
        selfId,
        activePartnerId,
        eventData.title
      );
      const descriptionDual = eventData.description
        ? await encryptDualTextForContent(keys, selfId, activePartnerId, eventData.description)
        : undefined;

      const uploaded =
        eventData.files.length > 0
          ? await encryptAndUploadCalendarContentFiles(
              eventData.files,
              keys,
              selfId,
              activePartnerId,
              saveOptions
            )
          : [];

      const response = await axios.post(
        `${API_URL}/api/calendar/events-encrypted`,
        {
          eventDate: eventData.date.toISOString(),
          encryptedTitle: titleDual.self,
          encryptedTitlePartner: titleDual.partner,
          encryptedDescription: descriptionDual?.self,
          encryptedDescriptionPartner: descriptionDual?.partner,
          encryptionRecipientId: targetId,
          isBirthdayEvent: eventData.isBirthdayEvent,
          isAnniversaryEvent: eventData.isAnniversaryEvent,
          isDatingIdeaEvent: true,
          datingIdeaId: idea.id,
          datingIdeaEmoji: idea.emoji,
          datingIdeaTitle: idea.title,
          datingIdeaDescription: idea.description,
          media: uploaded.map((item) => ({
            url: item.url,
            publicId: item.publicId,
            fileSize: item.fileSize,
            mediaEnvelope: item.mediaEnvelope,
            encryptedMediaEnvelope: item.encryptedMediaEnvelope,
            encryptedMediaEnvelopePartner: item.encryptedMediaEnvelopePartner,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: saveOptions?.signal,
        }
      );

      const eventId =
        response.data?.eventId ||
        response.data?.content?.[0]?.eventId ||
        null;

      if (!eventId) {
        throw new Error(t('calendar.errors.saveEventFailed'));
      }

      try {
        await completeDatingIdea(idea.id, String(eventId));
      } catch {
        // Server may already have linked the idea via datingIdeaId.
      }

      // Pin the completed view immediately after the event exists so a slow
      // preview/overview fetch (or a concurrent loadOverview) cannot dump the
      // user back onto the generate-offer screen.
      const completedIdea: DatingIdea = {
        ...idea,
        status: 'completed',
        eventId: String(eventId),
        completedAt: new Date().toISOString(),
      };
      let readyPreview: CompletedEventPreviewData = {
        title: eventData.title,
        description: eventData.description,
        eventId: String(eventId),
      };

      seededPreviewEventIdRef.current = String(eventId);
      selectHistoryIdea(completedIdea, { persist: true });
      setHistory((prev) =>
        prev.some((item) => item.id === completedIdea.id)
          ? prev.map((item) => (item.id === completedIdea.id ? completedIdea : item))
          : [completedIdea, ...prev]
      );
      setActiveIdea((prev) => (prev && prev.id !== completedIdea.id ? prev : null));
      setCompletedEventPreview(readyPreview);
      setCompletedEventLoading(false);
      setCompletedEventError(null);
      setPhase('idea');
      setFlipped(false);
      completingIdeaRef.current = null;
      setCompletingIdea(null);

      // Enrich preview + history while the editor still shows "Saving..."
      let loadedEvent: any = null;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
          const eventResponse = await axios.get(
            `${API_URL}/api/calendar/events/${encodeURIComponent(String(eventId))}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          loadedEvent = eventResponse.data;
          if (loadedEvent) break;
        } catch {
          // retry until event becomes readable
        }
        await new Promise((resolve) => setTimeout(resolve, 220 + attempt * 140));
      }

      if (!loadedEvent && Array.isArray(response.data?.content)) {
        loadedEvent = response.data.content[0] || null;
      }

      if (loadedEvent) {
        try {
          const [decrypted] = await decryptCalendarEventsWithMedia(
            keys,
            [loadedEvent],
            user?._id,
            partnerId || undefined
          );
          loadedEvent = decrypted;
        } catch (decryptError) {
          console.error('Failed to decrypt dating idea event preview:', decryptError);
        }
        readyPreview = toCompletedEventPreview(loadedEvent, String(eventId));
        if (!readyPreview.title) readyPreview.title = eventData.title;
        if (!readyPreview.description) readyPreview.description = eventData.description;
        setCompletedEventPreview(readyPreview);
      }

      notifyCalendarEventsChanged();

      try {
        let overview = await fetchDatingIdeas(language);
        let matched =
          (overview.history ?? []).find(
            (item) =>
              item.id === idea.id ||
              (item.eventId && String(item.eventId) === String(eventId))
          ) || null;

        for (
          let attempt = 0;
          attempt < 10 &&
          !(matched?.status === 'completed' && matched.eventId && String(matched.eventId) === String(eventId));
          attempt += 1
        ) {
          await new Promise((resolve) => setTimeout(resolve, 200 + attempt * 120));
          overview = await fetchDatingIdeas(language);
          matched =
            (overview.history ?? []).find(
              (item) =>
                item.id === idea.id ||
                (item.eventId && String(item.eventId) === String(eventId))
            ) || null;
        }

        const resolvedIdea =
          matched?.status === 'completed' &&
          matched.eventId &&
          String(matched.eventId) === String(eventId)
            ? matched
            : completedIdea;

        selectHistoryIdea(resolvedIdea, { persist: true });
        setBalance(overview.balance ?? 0);
        setCost(overview.cost ?? cost);
        setHistory(
          (overview.history ?? []).some((item) => item.id === resolvedIdea.id)
            ? (overview.history ?? []).map((item) =>
                item.id === resolvedIdea.id ? resolvedIdea : item
              )
            : [resolvedIdea, ...(overview.history ?? [])]
        );
        setActiveIdea(
          overview.active && overview.active.id !== resolvedIdea.id ? overview.active : null
        );
      } catch (overviewError) {
        console.error('Failed to refresh dating ideas after save:', overviewError);
      }

      setPhase('idea');
      setToast(t('datingIdeas.eventCreated'));
      // Close only after overview + preview work finishes. EventEditorDrawer has
      // closeOnSave={false}, so it will not close earlier on its own.
      saveInProgressRef.current = false;
      setSaveInProgress(false);
      setEditorOpen(false);
    } catch (error) {
      console.error('Dating idea event save error:', error);
      if (isVideoCompressionError(error)) {
        console.error('Детали сжатия видео:', error.details);
      }
      saveInProgressRef.current = false;
      setSaveInProgress(false);
      throw error;
    }
  };

  const displayedIdea = selectedHistoryIdea || activeIdea;
  const historyItems = useMemo(
    () => history.filter((idea) => idea.status === 'completed' || idea.status === 'skipped'),
    [history]
  );
  const showCompletedPreview = selectedHistoryIdea?.status === 'completed';
  const canCompleteSelected =
    !selectedHistoryIdea || selectedHistoryIdea.status === 'skipped';
  const ideaForEditor = completingIdea || (canCompleteSelected ? displayedIdea : null);

  return (
    <Container
      ref={pageTopRef}
      maxWidth="sm"
      sx={getDatingIdeasPageRootSx(theme)}
    >
      {saveInProgress && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: (theme) => theme.zIndex.modal + 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(0,0,0,0.45)',
            pointerEvents: 'all',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              placeItems: 'center',
              px: 3,
              py: 2.5,
              borderRadius: 3,
              bgcolor: 'background.paper',
              boxShadow: 8,
              minWidth: 220,
            }}
          >
            <CircularProgress size={32} />
            <Typography variant="body1" fontWeight={700}>
              {t('calendar.common.saving')}
            </Typography>
          </Box>
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/')} aria-label={t('common.back')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            {t('datingIdeas.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('datingIdeas.subtitle')}
          </Typography>
        </Box>
        <CurrencyBadge balance={balance} size="small" variant="tinted" />
        <IconButton
          onClick={() => setListOpen(true)}
          aria-label={t('datingIdeas.openHistoryList')}
          disabled={historyItems.length === 0}
        >
          <ViewListIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {phase === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!selectedHistoryIdea &&
        (phase === 'offer' || (phase === 'idea' && !activeIdea)) && (
        <Box sx={getGenerateOfferSx(theme)}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '24px',
              display: 'grid',
              placeItems: 'center',
              mx: 'auto',
              mb: 2,
              color: 'primary.main',
              animation: `${sparklePulse} 2.4s ease-in-out infinite`,
              bgcolor: (tTheme) =>
                tTheme.palette.mode === 'light' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.2)',
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {t('datingIdeas.generateTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {t('datingIdeas.generateHint')}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => void handleGenerate()}
            startIcon={<CurrencyCoinIcon size={20} />}
            sx={{ borderRadius: 3, px: 3, py: 1.25, fontWeight: 700 }}
          >
            {t('datingIdeas.generateCta', { cost })}
          </Button>
        </Box>
      )}

      {phase === 'generating' && (
        <Box sx={getGeneratingSx(theme)}>
          <Typography sx={{ fontSize: '2.5rem', animation: `${sparklePulse} 1.1s ease-in-out infinite` }}>
            ✨
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {t('datingIdeas.generating')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('datingIdeas.generatingHint')}
          </Typography>
          <CircularProgress size={28} sx={{ mt: 1 }} />
        </Box>
      )}

      {displayedIdea &&
        (phase === 'idea' || phase === 'flipping' || Boolean(selectedHistoryIdea)) && (
        <Box
          sx={{
            animation: `${cardReveal} 500ms ease both`,
          }}
        >
          <Box sx={getIdeaCardSx(theme, flipped)}>
            <Box className="idea-card-inner">
              <Box className="idea-card-face">
                <Chip
                  size="small"
                  icon={<AutoAwesomeIcon />}
                  label={t('datingIdeas.ideaBadge')}
                  sx={{ alignSelf: 'flex-start', mb: 2, fontWeight: 600 }}
                />
                <Typography sx={{ fontSize: '2.75rem', lineHeight: 1, mb: 1.5 }}>
                  {displayedIdea.emoji}
                </Typography>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  {displayedIdea.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ flex: 1, mb: 2 }}>
                  {displayedIdea.description}
                </Typography>
                {selectedHistoryIdea && (
                  <Chip
                    sx={{ alignSelf: 'flex-start', mb: 2 }}
                    label={
                      selectedHistoryIdea.status === 'completed'
                        ? t('datingIdeas.statusCompleted')
                        : t('datingIdeas.statusSkipped')
                    }
                    color={selectedHistoryIdea.status === 'completed' ? 'success' : 'default'}
                  />
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 'auto', flexWrap: 'wrap' }}>
                  {canCompleteSelected && (
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleCompletedClick(displayedIdea)}
                      sx={{ flex: 1, minWidth: 140, borderRadius: 2.5, fontWeight: 700 }}
                    >
                      {t('datingIdeas.completed')}
                    </Button>
                  )}
                  {!selectedHistoryIdea && (
                    <Button
                      variant="outlined"
                      startIcon={<ReplayIcon />}
                      onClick={() => void handleGenerate()}
                      sx={{ flex: 1, minWidth: 140, borderRadius: 2.5, fontWeight: 700 }}
                    >
                      {t('datingIdeas.generateAgain', { cost })}
                    </Button>
                  )}
                  {selectedHistoryIdea && (
                    <Button
                      fullWidth={!canCompleteSelected}
                      variant="outlined"
                      sx={{ flex: 1, minWidth: 140, borderRadius: 2.5, fontWeight: 700 }}
                      onClick={() => {
                        selectHistoryIdea(null);
                        setFlipped(false);
                        setPhase(activeIdea ? 'idea' : 'offer');
                      }}
                    >
                      {t('datingIdeas.backToCurrent')}
                    </Button>
                  )}
                </Box>
              </Box>
              <Box className="idea-card-face idea-card-back">
                <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center', gap: 1.5 }}>
                  <FavoriteBorderIcon color="primary" sx={{ fontSize: 42 }} />
                  <Typography variant="h6" fontWeight={700}>
                    {t('datingIdeas.flipTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('datingIdeas.flipHint')}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setEditorOpen(true)}
                    sx={{ mt: 1, borderRadius: 2.5, fontWeight: 700 }}
                  >
                    {t('datingIdeas.openEventEditor')}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>

          {showCompletedPreview && (
            <CompletedEventPreview
              loading={completedEventLoading}
              error={completedEventError}
              event={completedEventPreview}
              fallbackEmoji={selectedHistoryIdea?.emoji || displayedIdea.emoji}
            />
          )}
        </Box>
      )}

      {historyItems.length > 0 && (
        <Box sx={{ mt: 4, mb: { xs: 2, sm: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {t('datingIdeas.historyTitle')}
            </Typography>
            <Button
              size="small"
              startIcon={<ViewListIcon />}
              onClick={() => setListOpen(true)}
            >
              {t('datingIdeas.openHistoryList')}
            </Button>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 1.5,
            }}
          >
            {historyItems.map((idea) => (
              <Box
                key={idea.id}
                sx={getHistoryCardSx(theme, idea.status === 'completed' ? 'completed' : 'skipped')}
                onClick={() => {
                  selectHistoryIdea(idea);
                  setFlipped(false);
                  setPhase('idea');
                  scrollToPageTop();
                }}
                role="button"
                tabIndex={0}
              >
                <Typography sx={{ fontSize: '1.75rem', mb: 1 }}>{idea.emoji}</Typography>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {idea.title}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mt: 0.5,
                    minHeight: 48,
                  }}
                >
                  {idea.description}
                </Typography>
                <Chip
                  size="small"
                  sx={{ mt: 1.25 }}
                  label={
                    idea.status === 'completed'
                      ? t('datingIdeas.statusCompleted')
                      : t('datingIdeas.statusSkipped')
                  }
                  color={idea.status === 'completed' ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <EventEditorDrawer
        open={editorOpen || saveInProgress}
        onClose={handleEditorClose}
        initialDate={editorInitialDate}
        initialTitle={ideaForEditor?.title}
        initialDescription={ideaForEditor?.description}
        isDatingIdeaEvent
        preferPresetOverDraft
        closeOnSave={false}
        onSave={handleSaveEvent}
      />

      <HistoryListDialog
        open={listOpen}
        onClose={() => setListOpen(false)}
        ideas={historyItems}
        onSelect={(idea) => {
          selectHistoryIdea(idea);
          setFlipped(false);
          setPhase('idea');
          setListOpen(false);
          scrollToPageTop();
        }}
      />

      <CustomSnackbar
        open={Boolean(toast)}
        message={toast || ''}
        onClose={() => setToast(null)}
        severity="success"
      />
    </Container>
  );
};

export default DatingIdeasPage;
