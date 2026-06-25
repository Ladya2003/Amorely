import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import type { Partner } from '../components/Settings/PartnerForm';

export const PARTNER_REQUESTS_CHANGED_EVENT = 'amorely:partner-requests-changed';

export const notifyPartnerRequestsChanged = () => {
  window.dispatchEvent(new CustomEvent(PARTNER_REQUESTS_CHANGED_EVENT));
};

export type PartnerRequestStatus = 'pending' | 'declined' | 'cancelled';

export interface IncomingPartnerRequestItem {
  _id: string;
  status: PartnerRequestStatus;
  relationshipStartDate: string;
  createdAt: string;
  fromUser: Partner;
}

export interface OutgoingPartnerRequestItem {
  _id: string;
  status: PartnerRequestStatus;
  relationshipStartDate: string;
  createdAt: string;
  toUser: Partner;
}

export type PartnerRequestFilter = 'incoming' | 'outgoing';

export const usePartnerRequests = () => {
  const { token } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<IncomingPartnerRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingPartnerRequestItem[]>([]);
  const [isIncomingLoading, setIsIncomingLoading] = useState(false);
  const [isOutgoingLoading, setIsOutgoingLoading] = useState(false);
  const [incomingError, setIncomingError] = useState<string | null>(null);
  const [outgoingError, setOutgoingError] = useState<string | null>(null);

  const refreshIncoming = useCallback(async () => {
    if (!token) {
      setIncomingRequests([]);
      return;
    }

    setIsIncomingLoading(true);
    setIncomingError(null);
    try {
      const response = await axios.get(`${API_URL}/api/relationships/requests/incoming`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncomingRequests(response.data);
    } catch (fetchError) {
      console.error('Ошибка при загрузке входящих заявок:', fetchError);
      setIncomingError('loadFailed');
    } finally {
      setIsIncomingLoading(false);
    }
  }, [token]);

  const refreshOutgoing = useCallback(async () => {
    if (!token) {
      setOutgoingRequests([]);
      return;
    }

    setIsOutgoingLoading(true);
    setOutgoingError(null);
    try {
      const response = await axios.get(`${API_URL}/api/relationships/requests/outgoing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOutgoingRequests(response.data);
    } catch (fetchError) {
      console.error('Ошибка при загрузке исходящих заявок:', fetchError);
      setOutgoingError('loadFailed');
    } finally {
      setIsOutgoingLoading(false);
    }
  }, [token]);

  const refresh = useCallback(async () => {
    await Promise.all([refreshIncoming(), refreshOutgoing()]);
  }, [refreshIncoming, refreshOutgoing]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleRefresh = () => {
      void refresh();
    };

    window.addEventListener(PARTNER_REQUESTS_CHANGED_EVENT, handleRefresh);
    window.addEventListener('focus', handleRefresh);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener(PARTNER_REQUESTS_CHANGED_EVENT, handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refresh]);

  return {
    incomingRequests,
    outgoingRequests,
    isIncomingLoading,
    isOutgoingLoading,
    incomingError,
    outgoingError,
    refreshIncoming,
    refreshOutgoing,
    refresh
  };
};
