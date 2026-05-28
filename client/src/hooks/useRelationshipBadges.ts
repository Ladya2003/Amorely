import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import type { RelationshipBadge } from '../utils/gameBadges';

export const useRelationshipBadges = () => {
  const [badges, setBadges] = useState<RelationshipBadge[]>([]);
  const [partnerDisplayBadgeGameId, setPartnerDisplayBadgeGameId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    axios
      .get(`${API_URL}/api/relationships`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setBadges(response.data.relationship?.badges || []);
        setPartnerDisplayBadgeGameId(response.data.partner?.displayBadgeGameId ?? null);
      })
      .catch(() => {
        setBadges([]);
        setPartnerDisplayBadgeGameId(null);
      });
  }, []);

  return { badges, partnerDisplayBadgeGameId };
};

export default useRelationshipBadges;
