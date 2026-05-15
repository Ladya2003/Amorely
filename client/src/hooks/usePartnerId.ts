import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

import { normalizeUserId } from '../crypto/contentCryptoService';

export const usePartnerId = (): string | null => {
  const { user } = useAuth();
  const [partnerId, setPartnerId] = useState<string | null>(() =>
    normalizeUserId(user?.partnerId)
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user?._id) {
      setPartnerId(null);
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      const fromUser = normalizeUserId(user.partnerId);
      if (fromUser) {
        if (!cancelled) setPartnerId(fromUser);
        return;
      }

      try {
        const meResponse = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fromMe = normalizeUserId(meResponse.data?.partnerId);
        if (fromMe) {
          if (!cancelled) setPartnerId(fromMe);
          return;
        }
      } catch {
        // пробуем relationships
      }

      try {
        const relationshipResponse = await axios.get(`${API_URL}/api/relationships`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fromRelationship = normalizeUserId(relationshipResponse.data?.partner?._id);
        if (!cancelled) {
          setPartnerId(fromRelationship);
        }
      } catch {
        if (!cancelled) {
          setPartnerId(null);
        }
      }
    };

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.partnerId]);

  return partnerId;
};

/** ID пользователя, для которого шифруем контент (партнёр или сам пользователь). */
export const useEncryptionRecipientId = (): string | null => {
  const { user } = useAuth();
  const partnerId = usePartnerId();
  return partnerId || user?._id || null;
};
