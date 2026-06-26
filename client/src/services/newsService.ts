import axios from 'axios';
import { API_URL } from '../config';

export const claimNewsReadReward = async (newsId: string) => {
  const { data } = await axios.post(`${API_URL}/api/news/${newsId}/read`);
  return data as { awarded: boolean; awardedAmount: number; balance: number };
};
