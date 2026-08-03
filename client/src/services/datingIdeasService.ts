import axios from 'axios';
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

export const fetchDatingIdeas = async (locale?: string): Promise<DatingIdeasOverview> => {
  const response = await axios.get(`${API_URL}/api/dating-ideas`, {
    headers: authHeaders(),
    params: locale ? { locale } : undefined,
  });
  return response.data;
};

export const generateDatingIdea = async (locale?: string) => {
  const response = await axios.post(
    `${API_URL}/api/dating-ideas/generate`,
    { locale },
    { headers: authHeaders() }
  );
  return response.data as {
    idea: DatingIdea;
    balance: number;
    cost: number;
    awardedAmount?: number;
  };
};

export const skipDatingIdea = async (ideaId: string) => {
  const response = await axios.post(
    `${API_URL}/api/dating-ideas/${ideaId}/skip`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { idea: DatingIdea };
};

export const completeDatingIdea = async (ideaId: string, eventId: string) => {
  const response = await axios.post(
    `${API_URL}/api/dating-ideas/${ideaId}/complete`,
    { eventId },
    { headers: authHeaders() }
  );
  return response.data as { idea: DatingIdea };
};
