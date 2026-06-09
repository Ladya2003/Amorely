import React, { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCrypto } from '../../contexts/CryptoContext';
import {
  getPartnerMigrationSessionKey,
  runCalendarPartnerMigration
} from '../../crypto/calendarEventPartnerMigration';
import {
  getPlansPartnerMigrationSessionKey,
  runPlansPartnerMigration
} from '../../crypto/planNotePartnerMigration';
import { usePartnerId } from '../../hooks/usePartnerId';
import { PARTNER_CHANGED_EVENT } from '../../hooks/useRelationship';
import { notifyCalendarEventsChanged } from '../../hooks/useCalendarEvents';

const CalendarPartnerMigrationRunner: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { localDeviceKeys, isCryptoBootstrapComplete } = useCrypto();
  const partnerId = usePartnerId();
  const runningRef = useRef(false);

  const runMigration = useCallback(
    async (force = false) => {
      if (
        !isAuthenticated ||
        isAuthLoading ||
        !isCryptoBootstrapComplete ||
        !user?._id ||
        !localDeviceKeys ||
        !partnerId ||
        partnerId === user._id
      ) {
        return;
      }

      if (runningRef.current) {
        return;
      }

      runningRef.current = true;
      try {
        const [eventsMigrated, plansMigrated] = await Promise.all([
          runCalendarPartnerMigration(localDeviceKeys, user._id, partnerId, { force }),
          runPlansPartnerMigration(localDeviceKeys, user._id, partnerId, { force })
        ]);

        if (eventsMigrated || plansMigrated) {
          notifyCalendarEventsChanged();
        }
      } catch (error) {
        console.error('Ошибка при миграции календарного контента для партнёра:', error);
      } finally {
        runningRef.current = false;
      }
    },
    [
      isAuthenticated,
      isAuthLoading,
      isCryptoBootstrapComplete,
      localDeviceKeys,
      partnerId,
      user?._id
    ]
  );

  useEffect(() => {
    void runMigration();
  }, [runMigration]);

  useEffect(() => {
    const handlePartnerChanged = () => {
      if (!user?._id || !partnerId) {
        return;
      }

      sessionStorage.removeItem(getPartnerMigrationSessionKey(user._id, partnerId));
      sessionStorage.removeItem(getPlansPartnerMigrationSessionKey(user._id, partnerId));
      void runMigration(true);
    };

    window.addEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
    return () => {
      window.removeEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
    };
  }, [runMigration, user?._id, partnerId]);

  return null;
};

export default CalendarPartnerMigrationRunner;
