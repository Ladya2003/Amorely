import axios from 'axios';
import i18next from 'i18next';
import { API_URL } from '../config';

export type DatingIdeaStatus = 'active' | 'completed' | 'skipped';

export interface DatingIdea {
  id: string;
  ideaKey: string;
  emoji: string;
  title: string;
  description: string;
  status: DatingIdeaStatus;
  eventId: string | null;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
  skippedAt: string | null;
}

export interface DatingIdeasOverview {
  hasPartner: boolean;
  cost?: number;
  balance?: number;
  locale?: string;
  active?: DatingIdea | null;
  history?: DatingIdea[];
}

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const resolveLocaleParam = (locale?: string) =>
  locale || i18next.language || localStorage.getItem('locale') || 'ru';

export const fetchDatingIdeas = async (locale?: string): Promise<DatingIdeasOverview> => {
  const response = await axios.get(`${API_URL}/api/dating-ideas`, {
    headers: authHeaders(),
    params: { locale: resolveLocaleParam(locale) },
  });
  return response.data;
};

export const generateDatingIdea = async (locale?: string) => {
  const response = await axios.post(
    `${API_URL}/api/dating-ideas/generate`,
    { locale: resolveLocaleParam(locale) },
    { headers: authHeaders() }
  );
  return response.data as {
    idea: DatingIdea;
    balance: number;
    cost: number;
    awardedAmount?: number;
  };
};

export const skipDatingIdea = async (ideaId: string, locale?: string) => {
  const response = await axios.post(
    `${API_URL}/api/dating-ideas/${ideaId}/skip`,
    { locale: resolveLocaleParam(locale) },
    { headers: authHeaders(), params: { locale: resolveLocaleParam(locale) } }
  );
  return response.data as { idea: DatingIdea };
};

export const completeDatingIdea = async (ideaId: string, eventId: string, locale?: string) => {
  const response = await axios.post(
    `${API_URL}/api/dating-ideas/${ideaId}/complete`,
    { eventId, locale: resolveLocaleParam(locale) },
    { headers: authHeaders(), params: { locale: resolveLocaleParam(locale) } }
  );
  return response.data as { idea: DatingIdea };
};

export const fetchDatingIdeaByEventId = async (eventId: string, locale?: string) => {
  const response = await axios.get(
    `${API_URL}/api/dating-ideas/by-event/${encodeURIComponent(eventId)}`,
    {
      headers: authHeaders(),
      params: { locale: resolveLocaleParam(locale) },
    }
  );
  return response.data as { idea: DatingIdea };
};
