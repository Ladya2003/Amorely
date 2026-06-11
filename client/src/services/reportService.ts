import axios from 'axios';
import { API_URL } from '../config';

export const submitChatReport = async (
  reportedUserId: string,
  text: string,
  files: File[],
  token: string
) => {
  const formData = new FormData();
  formData.append('reportedUserId', reportedUserId);
  formData.append('text', text);
  files.forEach((file) => formData.append('media', file));

  const response = await axios.post(`${API_URL}/api/reports`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
