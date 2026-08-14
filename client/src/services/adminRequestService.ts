import axios from 'axios';
import { API_URL } from '../config';

export type AdminRequestCategory = 'question' | 'feature' | 'bug' | 'other';

export const submitAdminRequest = async (payload: {
  category: AdminRequestCategory;
  text: string;
}) => {
  const response = await axios.post<{ id: string; status: string; createdAt: string }>(
    `${API_URL}/api/admin-requests`,
    payload
  );
  return response.data;
};
