import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [listOpen, setListOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedHistoryIdea, setSelectedHistoryIdea] = useState<DatingIdea | null>(null);
  const [completingIdea, setCompletingIdea] = useState<DatingIdea | null>(null);
  const [completedEventPreview, setCompletedEventPreview] = useState<CompletedEventPreviewData | null>(null);
  const [completedEventLoading, setCompletedEventLoading] = useState(false);
  const [completedEventError, setCompletedEventError] = useState<string | null>(null);

  const loadOverview = useCallback(async (options?: { preservePhase?: boolean }) => {
    try {
      const data = await fetchDatingIdeas(i18n.language);
      if (!data.hasPartner) {
        if (!options?.preservePhase) {
          setPhase('offer');
        }
        setError(t('datingIdeas.partnerRequired'));
        return;
      }
      setBalance(data.balance ?? 0);
      setCost(data.cost ?? 1);
      setHistory(data.history ?? []);
      setActiveIdea(data.active ?? null);
      if (!options?.preservePhase) {
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
      setError(t('datingIdeas.loadError'));
      if (!options?.preservePhase) {
        setPhase('offer');
      }
    }
  }, [i18n.language, t]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    let cancelled = false;

    const loadCompletedEvent = async () => {
      if (!selectedHistoryIdea || selectedHistoryIdea.status !== 'completed' || !selectedHistoryIdea.eventId) {
        setCompletedEventPreview(null);
        setCompletedEventError(null);
        setCompletedEventLoading(false);
        return;
      }

      setCompletedEventLoading(true);
      setCompletedEventError(null);
      setCompletedEventPreview(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error(t('calendar.errors.notAuthorized'));
        }

        const response = await axios.get(
          `${API_URL}/api/calendar/events/${encodeURIComponent(selectedHistoryIdea.eventId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let event = response.data;
        const keys = localDeviceKeys || (user?._id ? await loadLocalKeys(user._id) : null);
        if (keys) {
          const [decrypted] = await decryptCalendarEventsWithMedia(
            keys,
            [event],
            user?._id,
            partnerId || undefined
          );
          event = decrypted;
        }

        if (cancelled) return;

        const media = Array.isArray(event.media) ? event.media : [];
        const firstMedia = media.find(
          (item: { url?: string }) => item.url && String(item.url).trim().length > 0
        );

        setCompletedEventPreview({
          title: event.title,
          description: event.description,
          mediaUrl: firstMedia?.url,
          resourceType: firstMedia?.resourceType,
          encrypted: firstMedia?.encrypted,
          mediaEnvelope: firstMedia?.mediaEnvelope,
          mediaId: firstMedia?._id,
          eventId: event.eventId || selectedHistoryIdea.eventId,
        });
      } catch {
        if (!cancelled) {
          setCompletedEventError(t('datingIdeas.eventPreviewMissing'));
          setCompletedEventPreview(null);
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
    setSelectedHistoryIdea(null);
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
    setCompletingIdea(target);
    setPhase('flipping');
    setFlipped(true);
    window.setTimeout(() => {
      setEditorOpen(true);
    }, 650);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setFlipped(false);
    setCompletingIdea(null);
    if (selectedHistoryIdea) {
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
    const idea = completingIdea || activeIdea;
    if (!idea) {
      throw new Error(t('datingIdeas.generateError'));
    }

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

      if (eventId) {
        await completeDatingIdea(idea.id, eventId);
      }

      notifyCalendarEventsChanged();
      setEditorOpen(false);
      setFlipped(false);
      setCompletingIdea(null);
      setSelectedHistoryIdea(null);
      if (activeIdea?.id === idea.id) {
        setActiveIdea(null);
      }
      setToast(t('datingIdeas.eventCreated'));
      await loadOverview();
    } catch (error) {
      console.error('Dating idea event save error:', error);
      if (isVideoCompressionError(error)) {
        console.error('Детали сжатия видео:', error.details);
      }
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
    <Container maxWidth="sm" sx={getDatingIdeasPageRootSx(theme)}>
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

      {(phase === 'offer' || (phase === 'idea' && !activeIdea && !selectedHistoryIdea)) && (
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

      {(phase === 'idea' || phase === 'flipping') && displayedIdea && (
        <Box sx={{ animation: `${cardReveal} 500ms ease both` }}>
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
                        setSelectedHistoryIdea(null);
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
        <Box sx={{ mt: 4 }}>
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
              display: 'flex',
              gap: 1.5,
              overflowX: 'auto',
              pb: 1,
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {historyItems.map((idea) => (
              <Box
                key={idea.id}
                sx={getHistoryCardSx(theme, idea.status === 'completed' ? 'completed' : 'skipped')}
                onClick={() => {
                  setSelectedHistoryIdea(idea);
                  setFlipped(false);
                  setPhase('idea');
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
        open={editorOpen}
        onClose={handleEditorClose}
        initialDate={new Date()}
        initialTitle={ideaForEditor?.title}
        initialDescription={ideaForEditor?.description}
        isDatingIdeaEvent
        preferPresetOverDraft
        onSave={handleSaveEvent}
      />

      <HistoryListDialog
        open={listOpen}
        onClose={() => setListOpen(false)}
        ideas={historyItems}
        onSelect={(idea) => {
          setSelectedHistoryIdea(idea);
          setFlipped(false);
          setPhase('idea');
          setListOpen(false);
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
