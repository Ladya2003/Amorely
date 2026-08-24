import axios from 'axios';
import i18next from 'i18next';
import { API_URL } from '../config';
import type { AppAnnouncement } from './announcementsService';
import type { CoupleDistanceStatus } from './coupleDistanceService';
import type { DailyQuestionsState } from '../components/Feed/DailyQuestions/types';
import type { DatingIdeasOverview } from './datingIdeasService';
import type { PetsListResponse, Pet } from './petsService';
import type { Partner } from '../components/Settings/PartnerForm';
import type { RelationshipBadge } from '../utils/gameBadges';

export interface FeedHomeRelationship {
  startDate: string;
  daysCount: number;
  photo?: string;
  signature?: string;
  signatures?: { user?: string; partner?: string };
  statusBubbles?: { user: string; partner: string };
  ownerId: string;
  badges?: RelationshipBadge[];
  awardedAmount?: number;
  balance?: number | null;
  newAchievementIds?: string[];
}

export interface FeedHomePayload {
  relationship: FeedHomeRelationship | null;
  partner: Partner | null;
  content: any[];
  pets: PetsListResponse;
  partnerPets: { pets: Pet[]; partnerId: string | null };
  dailyQuestions: DailyQuestionsState;
  datingIdeas: DatingIdeasOverview;
  announcements: AppAnnouncement[];
  location: CoupleDistanceStatus | null;
}

export const fetchFeedHome = async (locale?: string): Promise<FeedHomePayload> => {
  const token = localStorage.getItem('token');
  const { data } = await axios.get(`${API_URL}/api/feed/home`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    params: {
      locale: locale || i18next.language || localStorage.getItem('locale') || 'ru',
    },
  });
  return data;
};
