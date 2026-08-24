import axios from 'axios';
import { API_URL } from '../config';

export const submitPublicSupportMessage = async (payload: {
  name: string;
  email: string;
  message: string;
}): Promise<void> => {
  await axios.post(`${API_URL}/api/public/support`, payload);
};
