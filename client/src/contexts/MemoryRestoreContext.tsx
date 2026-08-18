import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useAuth } from './AuthContext';
import { useCrypto } from './CryptoContext';
import { notifyCalendarEventsChanged } from '../hooks/useCalendarEvents';
import { runMemoryRestoreRewrap, type MemoryRestoreJobProgress } from '../crypto/memoryRestoreRewrap';
import {
  acceptMemoryRestoreRequest,
  cancelMemoryRestoreRequest,
  completeMemoryRestoreRequest,
  createMemoryRestoreRequest,
  declineMemoryRestoreRequest,
  failMemoryRestoreRequest,
  fetchIncomingMemoryRestoreRequests,
  fetchOutgoingMemoryRestoreRequests,
  type MemoryRestoreRequestItem
} from '../services/memoryRestoreService';
import MemoryRestoreProgressDialog from '../components/common/MemoryRestoreProgressDialog';

export const MEMORY_RESTORE_CHANGED_EVENT = 'amorely:memory-restore-changed';

export const notifyMemoryRestoreChanged = () => {
  window.dispatchEvent(new CustomEvent(MEMORY_RESTORE_CHANGED_EVENT));
};

interface MemoryRestoreContextValue {
  incomingRequests: MemoryRestoreRequestItem[];
  outgoingRequests: MemoryRestoreRequestItem[];
  pendingIncoming: MemoryRestoreRequestItem | null;
  pendingIncomingCount: number;
  isLoading: boolean;
  isSubmitting: boolean;
  refresh: () => Promise<void>;
  createRequest: () => Promise<MemoryRestoreRequestItem>;
  acceptAndRestore: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
}

const MemoryRestoreContext = createContext<MemoryRestoreContextValue>({
  incomingRequests: [],
  outgoingRequests: [],
  pendingIncoming: null,
  pendingIncomingCount: 0,
  isLoading: false,
  isSubmitting: false,
  refresh: async () => {},
  createRequest: async () => {
    throw new Error('MemoryRestoreContext not initialized');
  },
  acceptAndRestore: async () => {},
  declineRequest: async () => {},
  cancelRequest: async () => {}
});

export const useMemoryRestore = () => useContext(MemoryRestoreContext);

export const MemoryRestoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const { localDeviceKeys } = useCrypto();
  const [incomingRequests, setIncomingRequests] = useState<MemoryRestoreRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<MemoryRestoreRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [jobProgress, setJobProgress] = useState<MemoryRestoreJobProgress | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobDone, setJobDone] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      return;
    }

    setIsLoading(true);
    try {
      const [incoming, outgoing] = await Promise.all([
        fetchIncomingMemoryRestoreRequests(token),
        fetchOutgoingMemoryRestoreRequests(token)
      ]);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (error) {
      console.error('Ошибка при загрузке заявок на восстановление воспоминаний:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      return;
    }

    void refresh();
  }, [isAuthenticated, user?._id, refresh]);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      return;
    }

    const handleRefresh = () => {
      void refresh();
    };

    window.addEventListener(MEMORY_RESTORE_CHANGED_EVENT, handleRefresh);
    window.addEventListener('focus', handleRefresh);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener(MEMORY_RESTORE_CHANGED_EVENT, handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, user?._id, refresh]);

  const createRequest = useCallback(async () => {
    if (!token) {
      throw new Error('Не авторизован');
    }

    setIsSubmitting(true);
    try {
      const result = await createMemoryRestoreRequest(token, localDeviceKeys?.deviceId);
      await refresh();
      notifyMemoryRestoreChanged();
      return result.request;
    } finally {
      setIsSubmitting(false);
    }
  }, [localDeviceKeys?.deviceId, refresh, token]);

  const acceptAndRestore = useCallback(
    async (requestId: string) => {
      if (!token || !user?._id || !localDeviceKeys) {
        throw new Error('Ключи шифрования ещё не готовы');
      }

      const incoming = incomingRequests.find((item) => item._id === requestId);
      const requesterId = incoming?.fromUserId || incoming?.peerUser?._id;
      if (!requesterId) {
        throw new Error('Не удалось определить партнёра');
      }

      setIsSubmitting(true);
      setProgressOpen(true);
      setJobDone(false);
      setJobError(null);
      setJobProgress({
        stage: 'events',
        events: 0,
        plans: 0,
        feed: 0,
        failed: 0,
        total: 0
      });

      let latestProgress: MemoryRestoreJobProgress = {
        stage: 'events',
        events: 0,
        plans: 0,
        feed: 0,
        failed: 0,
        total: 0
      };

      try {
        await acceptMemoryRestoreRequest(token, requestId);
        notifyMemoryRestoreChanged();

        const progress = await runMemoryRestoreRewrap(
          localDeviceKeys,
          user._id,
          requesterId,
          requestId,
          (next) => {
            latestProgress = next;
            setJobProgress({ ...next });
          }
        );

        await completeMemoryRestoreRequest(token, requestId, progress);
        notifyCalendarEventsChanged();
        setJobDone(true);
        await refresh();
        notifyMemoryRestoreChanged();
      } catch (error: unknown) {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message?: string }).message)
            : null;
        setJobError(message);
        try {
          await failMemoryRestoreRequest(token, requestId, {
            events: latestProgress.events,
            plans: latestProgress.plans,
            feed: latestProgress.feed,
            failed: latestProgress.failed + 1,
            total: latestProgress.total
          });
        } catch {
          // already failed locally
        }
        await refresh();
        notifyMemoryRestoreChanged();
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [incomingRequests, localDeviceKeys, refresh, token, user?._id]
  );

  const declineRequest = useCallback(
    async (requestId: string) => {
      if (!token) return;
      setIsSubmitting(true);
      try {
        await declineMemoryRestoreRequest(token, requestId);
        await refresh();
        notifyMemoryRestoreChanged();
      } finally {
        setIsSubmitting(false);
      }
    },
    [refresh, token]
  );

  const cancelRequest = useCallback(
    async (requestId: string) => {
      if (!token) return;
      setIsSubmitting(true);
      try {
        await cancelMemoryRestoreRequest(token, requestId);
        await refresh();
        notifyMemoryRestoreChanged();
      } finally {
        setIsSubmitting(false);
      }
    },
    [refresh, token]
  );

  const pendingIncoming = useMemo(
    () => incomingRequests.find((item) => item.status === 'pending') || null,
    [incomingRequests]
  );

  const value = useMemo<MemoryRestoreContextValue>(
    () => ({
      incomingRequests,
      outgoingRequests,
      pendingIncoming,
      pendingIncomingCount: incomingRequests.filter((item) => item.status === 'pending').length,
      isLoading,
      isSubmitting,
      refresh,
      createRequest,
      acceptAndRestore,
      declineRequest,
      cancelRequest
    }),
    [
      acceptAndRestore,
      cancelRequest,
      createRequest,
      declineRequest,
      incomingRequests,
      isLoading,
      isSubmitting,
      outgoingRequests,
      pendingIncoming,
      refresh
    ]
  );

  return (
    <MemoryRestoreContext.Provider value={value}>
      {children}
      <MemoryRestoreProgressDialog
        open={progressOpen}
        progress={jobProgress}
        error={jobError}
        done={jobDone}
        onClose={() => {
          if (isSubmitting) return;
          setProgressOpen(false);
        }}
      />
    </MemoryRestoreContext.Provider>
  );
};
