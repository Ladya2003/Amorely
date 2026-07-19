import axios from 'axios';
import { API_URL } from '../config';
import { NewsItem } from '../components/News/NewsCard';
import type { NewsTranslations } from '../localization/newsContent';
import type { AppLocale } from '../localization/locale';

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
  isBlocked: boolean;
  isNewForAdmin: boolean | null;
  isNewForAdminEffective: boolean;
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
  translations?: NewsTranslations;
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

export interface AdminReportUser {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  isBlocked?: boolean;
}

export interface AdminReportMedia {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
}

export interface AdminReportMessage {
  target: 'reporter' | 'reported';
  text: string;
  sentAt: string;
}

export interface AdminReportItem {
  _id: string;
  reporter: AdminReportUser | null;
  reportedUser: AdminReportUser | null;
  text: string;
  media: AdminReportMedia[];
  adminMessages: AdminReportMessage[];
  status: 'open' | 'resolved';
  createdAt: string;
}

export const fetchAdminReports = async (params?: {
  page?: number;
  limit?: number;
  status?: 'open' | 'resolved' | '';
}) => {
  const response = await axios.get<{
    reports: AdminReportItem[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }>(`${API_URL}/api/admin/reports`, { params });
  return response.data;
};

export const sendAdminReportMessage = async (
  reportId: string,
  payload: { target: 'reporter' | 'reported'; text: string }
) => {
  const response = await axios.post(`${API_URL}/api/admin/reports/${reportId}/message`, payload);
  return response.data;
};

export const updateAdminReportStatus = async (
  reportId: string,
  status: 'open' | 'resolved'
) => {
  const response = await axios.patch(`${API_URL}/api/admin/reports/${reportId}/status`, { status });
  return response.data;
};

export const blockAdminUser = async (
  userId: string,
  reasons?: Partial<Record<AppLocale, string>>
) => {
  const response = await axios.post(`${API_URL}/api/admin/users/${userId}/block`, { reasons });
  return response.data;
};

export const unblockAdminUser = async (userId: string) => {
  const response = await axios.post(`${API_URL}/api/admin/users/${userId}/unblock`);
  return response.data;
};

export interface AdminAlertsState {
  feedDot: boolean;
  newUsersCount: number;
  newReportsCount: number;
}

export const fetchAdminAlerts = async (): Promise<AdminAlertsState> => {
  const response = await axios.get<AdminAlertsState>(`${API_URL}/api/admin/alerts`);
  return response.data;
};

export const clearAdminFeedAlerts = async () => {
  const response = await axios.post(`${API_URL}/api/admin/alerts/clear-feed`);
  return response.data;
};

export const clearAdminUsersTabAlerts = async () => {
  const response = await axios.post(`${API_URL}/api/admin/alerts/clear-users-tab`);
  return response.data;
};

export const clearAdminModerationTabAlerts = async () => {
  const response = await axios.post(`${API_URL}/api/admin/alerts/clear-moderation-tab`);
  return response.data;
};

export const toggleAdminUserNewFlag = async (userId: string) => {
  const response = await axios.patch<{
    isNewForAdmin: boolean | null;
    isNewForAdminEffective: boolean;
  }>(`${API_URL}/api/admin/users/${userId}/new-user-flag`);
  return response.data;
};

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

export interface AdminAnnouncementItem {
  _id: string;
  key: string;
  translations: Record<AppLocale, {
    title: string;
    preview: string;
    content: string;
  }>;
  pushTitle: string;
  pushBody: string;
  isActive: boolean;
  publishedAt: string;
  pushSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const fetchAdminAnnouncements = async () => {
  const response = await axios.get<{ announcements: AdminAnnouncementItem[] }>(
    `${API_URL}/api/admin/announcements`
  );
  return response.data;
};

export const createAdminAnnouncement = async (payload: {
  key?: string;
  translations: AdminAnnouncementItem['translations'];
  pushTitle: string;
  pushBody: string;
  isActive: boolean;
  sendPush: boolean;
}) => {
  const response = await axios.post(`${API_URL}/api/admin/announcements`, payload);
  return response.data as {
    announcement: AdminAnnouncementItem;
    pushResult?: { sent: number } | null;
  };
};

export const updateAdminAnnouncement = async (
  id: string,
  payload: {
    translations: AdminAnnouncementItem['translations'];
    pushTitle: string;
    pushBody: string;
    isActive: boolean;
    sendPush: boolean;
  }
) => {
  const response = await axios.put(`${API_URL}/api/admin/announcements/${id}`, payload);
  return response.data as {
    announcement: AdminAnnouncementItem;
    pushResult?: { sent: number } | null;
  };
};

export const sendAdminAnnouncementPush = async (id: string) => {
  const response = await axios.post(`${API_URL}/api/admin/announcements/${id}/push`);
  return response.data as {
    pushResult: { sent: number };
    announcement: AdminAnnouncementItem;
  };
};

export const deleteAdminAnnouncement = async (id: string) => {
  const response = await axios.delete(`${API_URL}/api/admin/announcements/${id}`);
  return response.data;
};
