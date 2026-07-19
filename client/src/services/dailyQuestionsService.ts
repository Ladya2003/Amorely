import axios from 'axios';
import i18next from 'i18next';
import { API_URL } from '../config';
import type {
  CategoryDetail,
  CategoryResults,
  DailyQuestionsState,
  HistoryEntry,
} from '../components/Feed/DailyQuestions/types';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const localeParams = () => ({
  locale: i18next.language || localStorage.getItem('locale') || 'ru',
});

export const fetchDailyQuestions = async (): Promise<DailyQuestionsState> => {
  const { data } = await axios.get(`${API_URL}/api/daily-questions`, {
    headers: authHeaders(),
    params: localeParams(),
  });
  return data;
};

export const fetchCategoryDetail = async (categoryId: string): Promise<CategoryDetail> => {
  const { data } = await axios.get(`${API_URL}/api/daily-questions/category/${categoryId}`, {
    headers: authHeaders(),
    params: localeParams(),
  });
  return data;
};

export const submitDailyAnswer = async (
  categoryId: string,
  questionId: string,
  value: string
): Promise<DailyQuestionsState> => {
  const { data } = await axios.post(
    `${API_URL}/api/daily-questions/answer`,
    { categoryId, questionId, value },
    { headers: authHeaders(), params: localeParams() }
  );
  return data;
};

export const fetchCategoryResults = async (categoryId: string): Promise<CategoryResults> => {
  const { data } = await axios.get(`${API_URL}/api/daily-questions/results/${categoryId}`, {
    headers: authHeaders(),
    params: localeParams(),
  });
  return data;
};

export const fetchDailyQuestionsHistory = async (): Promise<HistoryEntry[]> => {
  const { data } = await axios.get(`${API_URL}/api/daily-questions/history`, {
    headers: authHeaders(),
    params: localeParams(),
  });
  return data;
};

export const notifyPartnerDailyQuestions = async (categoryId?: string): Promise<void> => {
  await axios.post(
    `${API_URL}/api/daily-questions/notify-partner`,
    { categoryId },
    { headers: authHeaders() }
  );
};
