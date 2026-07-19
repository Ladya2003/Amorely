import axios from 'axios';
import i18n from 'i18next';
import { API_URL } from '../config';

export interface AppAnnouncement {
  id: string;
  key: string;
  title: string;
  preview: string;
  content: string;
  publishedAt: string;
}

export const fetchAnnouncements = async (): Promise<AppAnnouncement[]> => {
  const { data } = await axios.get(`${API_URL}/api/announcements`, {
    params: { locale: i18n.language },
  });
  return data.announcements as AppAnnouncement[];
};
