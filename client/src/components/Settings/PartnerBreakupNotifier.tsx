import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import {
  BREAKUP_INITIATED_EVENT,
  PARTNER_CHANGED_EVENT,
  PARTNER_UNLINKED_EVENT
} from '../../hooks/useRelationship';
import BreakupContentDialog from './BreakupContentDialog';
import { notifyCalendarEventsChanged } from '../../hooks/useCalendarEvents';
import type { BreakupContentOptions } from './PartnerForm';

const PartnerBreakupNotifier: React.FC = () => {
  const { token, isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suppressReceiverModal, setSuppressReceiverModal] = useState(false);

  const checkPendingBreakup = useCallback(async () => {
    if (!token || !isAuthenticated || isAuthLoading || suppressReceiverModal) {
      return;
    }

    if (user?.partnerId) {
      setOpen(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/relationships/pending-breakup-cleanup`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      setOpen(Boolean(response.data?.pending));
    } catch (error) {
      console.error('Ошибка при проверке расставания:', error);
    }
  }, [token, isAuthenticated, isAuthLoading, suppressReceiverModal, user?.partnerId]);

  useEffect(() => {
    void checkPendingBreakup();
  }, [checkPendingBreakup]);

  useEffect(() => {
    const handlePartnerUnlinked = () => {
      void checkPendingBreakup();
    };
    const handlePartnerChanged = () => {
      if (user?.partnerId) {
        setOpen(false);
      }
    };
    const handleBreakupInitiated = () => {
      setSuppressReceiverModal(true);
      setOpen(false);
    };

    window.addEventListener(PARTNER_UNLINKED_EVENT, handlePartnerUnlinked);
    window.addEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
    window.addEventListener(BREAKUP_INITIATED_EVENT, handleBreakupInitiated);
    return () => {
      window.removeEventListener(PARTNER_UNLINKED_EVENT, handlePartnerUnlinked);
      window.removeEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
      window.removeEventListener(BREAKUP_INITIATED_EVENT, handleBreakupInitiated);
    };
  }, [checkPendingBreakup, user?.partnerId]);

  const handleConfirm = async ({ keepEvents, keepPlans }: BreakupContentOptions) => {
    if (!token) return;

    try {
      setIsLoading(true);
      await axios.post(
        `${API_URL}/api/relationships/breakup-content`,
        { keepEvents, keepPlans },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpen(false);
      notifyCalendarEventsChanged();
    } catch (error) {
      console.error('Ошибка при обработке контента после расставания:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <BreakupContentDialog
      open={open}
      mode="receiver"
      isLoading={isLoading}
      onClose={() => {}}
      onConfirm={handleConfirm}
    />
  );
};

export default PartnerBreakupNotifier;
