import axios from 'axios';
import { API_URL } from '../config';
import { NewsItem } from '../components/News/NewsCard';

export type DashboardMetricKey =
  | 'totalUsers'
  | 'newUsersToday'
  | 'newUsers7d'
  | 'newUsers30d'
  | 'activePairs'
  | 'brokenUpPairs'
  | 'usersWithoutPartner'
  | 'activeLast24h'
  | 'totalCalendarEvents'
  | 'totalFeedMedia'
  | 'totalMessages'
  | 'totalNewsPublished';

export interface DashboardDetailItem {
  id: string;
  title: string;
  subtitle?: string;
  extra?: string;
  count?: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  newUsersToday: number;
  newUsers7d: number;
  newUsers30d: number;
  activePairs: number;
  brokenUpPairs: number;
  usersWithoutPartner: number;
  activeLast24h: number;
  totalCalendarEvents: number;
  totalFeedMedia: number;
  totalMessages: number;
  totalNewsPublished: number;
  topPairs: Array<{
    userId: string;
    partnerId: string;
    username: string;
    partnerUsername: string;
    calendarEvents: number;
  }>;
}

export interface AdminGameRankInfo {
  score: number;
  rank: number | null;
}

export interface AdminUserItem {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastSeen?: string;
  partner: {
    _id?: string;
    username: string;
    email: string;
  } | null;
  relationshipStatus: 'active' | 'broken_up' | null;
  stats: {
    calendarEvents: number;
    feedMedia: number;
    games: {
      tap: AdminGameRankInfo;
      geo: AdminGameRankInfo;
      draw: AdminGameRankInfo;
      quiz: AdminGameRankInfo;
    };
  };
}

export interface AdminHealthInfo {
  mongodb: {
    status: string;
    readyState: number;
  };
  feedScheduler: {
    schedule: string;
    timezone: string;
    description: string;
  };
  storage: {
    totalBytes: number;
    encryptedContentCount: number;
    totalContentCount: number;
  };
  pushSubscriptions: number;
  cryptoDevices: number;
  games: {
    tap: number;
    geo: number;
    draw: number;
    quiz: number;
  };
  draftNewsCount: number;
  serverTime: string;
}

export interface AdminNewsItem extends NewsItem {
  isPublished?: boolean;
  updatedAt?: string;
  image?: {
    url: string;
    publicId?: string;
  };
  images?: Array<{
    url: string;
    publicId?: string;
    resourceType?: 'image' | 'video';
    caption?: string;
  }>;
}

export const fetchAdminDashboard = async () => {
  const response = await axios.get<AdminDashboardStats>(`${API_URL}/api/admin/dashboard`);
  return response.data;
};

export const fetchAdminDashboardDetails = async (metricKey: DashboardMetricKey) => {
  const response = await axios.get<{ metric: DashboardMetricKey; items: DashboardDetailItem[] }>(
    `${API_URL}/api/admin/dashboard/details/${metricKey}`
  );
  return response.data;
};

export const fetchAdminUsers = async (params: { search?: string; page?: number; limit?: number }) => {
  const response = await axios.get<{
    users: AdminUserItem[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }>(`${API_URL}/api/admin/users`, { params });
  return response.data;
};

export const fetchAdminHealth = async () => {
  const response = await axios.get<AdminHealthInfo>(`${API_URL}/api/admin/health`);
  return response.data;
};

export const fetchAdminNews = async (params?: { page?: number; limit?: number }) => {
  const response = await axios.get<{
    news: AdminNewsItem[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }>(`${API_URL}/api/admin/news`, { params });
  return response.data;
};

export const createAdminNews = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/api/news`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateAdminNews = async (id: string, formData: FormData) => {
  const response = await axios.put(`${API_URL}/api/news/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteAdminNews = async (id: string) => {
  const response = await axios.delete(`${API_URL}/api/news/${id}`);
  return response.data;
};
