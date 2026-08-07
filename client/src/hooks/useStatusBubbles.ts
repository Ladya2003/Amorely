import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import { PARTNER_CHANGED_EVENT } from './useRelationship';

export interface StatusBubbles {
  user: string;
  partner: string;
}

export const useStatusBubbles = () => {
  const { user, token } = useAuth();
  const [statusBubbles, setStatusBubbles] = useState<StatusBubbles | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(token && user?.partnerId));
  const [isSaving, setIsSaving] = useState(false);
  /** Скелетон только до первой загрузки; фоновые refresh не мигают плейсхолдером */
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    hasLoadedOnceRef.current = false;
    setIsLoading(Boolean(token && user?.partnerId));
  }, [token, user?.partnerId]);

  const refresh = useCallback(async () => {
    if (!token || !user?.partnerId) {
      setStatusBubbles(null);
      setOwnerId(null);
      setIsLoading(false);
      hasLoadedOnceRef.current = false;
      return;
    }

    if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    }

    try {
      const response = await axios.get(`${API_URL}/api/feed/relationship/status-bubbles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setStatusBubbles(response.data.statusBubbles || { user: '', partner: '' });
        setOwnerId(response.data.ownerId || null);
      } else {
        setStatusBubbles(null);
        setOwnerId(null);
      }
      hasLoadedOnceRef.current = true;
    } catch (error) {
      console.error('Failed to load status bubbles:', error);
      setStatusBubbles(null);
      setOwnerId(null);
      hasLoadedOnceRef.current = true;
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.partnerId]);

  const updateStatusBubble = useCallback(
    async (text: string) => {
      if (!token) {
        return false;
      }

      setIsSaving(true);
      try {
        const response = await axios.post(
          `${API_URL}/api/feed/relationship/status-bubble`,
          { text },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.statusBubbles) {
          setStatusBubbles(response.data.statusBubbles);
        }
        return true;
      } catch (error) {
        console.error('Failed to save status bubble:', error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [token]
  );

  useEffect(() => {
    void refresh();
  }, [refresh, user?._id, user?.partnerId]);

  useEffect(() => {
    const handlePartnerChanged = () => {
      void refresh();
    };

    window.addEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refresh]);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    const socket = socketService.getSocket() || socketService.initialize(user._id);

    const handleStatusBubbleUpdated = (payload: { statusBubbles?: StatusBubbles }) => {
      if (payload?.statusBubbles) {
        setStatusBubbles(payload.statusBubbles);
      } else {
        void refresh();
      }
    };

    socket.on('status_bubble_updated', handleStatusBubbleUpdated);

    return () => {
      socket.off('status_bubble_updated', handleStatusBubbleUpdated);
    };
  }, [user?._id, refresh]);

  const isOwner = ownerId ? ownerId === user?._id : false;
  const myBubbleText = isOwner ? statusBubbles?.user : statusBubbles?.partner;
  const partnerBubbleText = isOwner ? statusBubbles?.partner : statusBubbles?.user;

  return {
    statusBubbles,
    myBubbleText: myBubbleText ?? '',
    partnerBubbleText: partnerBubbleText ?? '',
    isLoading,
    isSaving,
    updateStatusBubble,
    refresh,
  };
};
