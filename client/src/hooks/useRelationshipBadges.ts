import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useOptionalFeedHome } from '../contexts/FeedHomeContext';
import type { RelationshipBadge } from '../utils/gameBadges';

export const useRelationshipBadges = () => {
  const feedHome = useOptionalFeedHome();
  const [badges, setBadges] = useState<RelationshipBadge[]>([]);
  const [partnerDisplayBadgeGameId, setPartnerDisplayBadgeGameId] = useState<string | null>(null);

  useEffect(() => {
    if (feedHome) {
      if (feedHome.data) {
        setBadges(feedHome.data.relationship?.badges || []);
        setPartnerDisplayBadgeGameId(feedHome.data.partner?.displayBadgeGameId ?? null);
      }
      return;
    }

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
  }, [feedHome]);

  return { badges, partnerDisplayBadgeGameId };
};

export default useRelationshipBadges;
