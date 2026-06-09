import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import type { Partner } from '../components/Settings/PartnerForm';

export const PARTNER_CHANGED_EVENT = 'amorely:partner-changed';

export const notifyPartnerChanged = () => {
  window.dispatchEvent(new CustomEvent(PARTNER_CHANGED_EVENT));
};

export const useRelationship = () => {
  const { user, token } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [relationshipStartDate, setRelationshipStartDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setPartner(null);
      setRelationshipStartDate(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/relationships`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const nextPartner = response.data.partner as Partner;
      const nextStartDate = response.data.relationship.startDate as string;
      setPartner(nextPartner);
      setRelationshipStartDate(nextStartDate);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setPartner(null);
        setRelationshipStartDate(null);
      } else {
        console.error('Ошибка при загрузке отношений:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh, user?._id, user?.partnerId]);

  useEffect(() => {
    const handlePartnerChanged = () => {
      void refresh();
    };

    window.addEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
    window.addEventListener('focus', handlePartnerChanged);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
      window.removeEventListener('focus', handlePartnerChanged);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refresh]);

  return {
    partner,
    relationshipStartDate,
    refresh,
    isLoading
  };
};
