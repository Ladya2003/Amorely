import axios from 'axios';
import { API_URL } from '../config';

export const fetchReadNewsIds = async () => {
  const { data } = await axios.get(`${API_URL}/api/news/read-ids`);
  return (data.readIds ?? []) as string[];
};

export const syncReadNewsIds = async (newsIds: string[]) => {
  const { data } = await axios.post(`${API_URL}/api/news/read`, { newsIds });
  return (data.readIds ?? []) as string[];
};

export const claimNewsReadReward = async (newsId: string) => {
  const { data } = await axios.post(`${API_URL}/api/news/${newsId}/read`);
  return data as { awarded: boolean; awardedAmount: number; balance: number; readIds?: string[] };
};
