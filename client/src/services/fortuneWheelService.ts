import axios from 'axios';
import { API_URL } from '../config';
import type { FortuneWheelData } from '../components/FortuneWheel/fortuneWheelTypes';

export const fetchFortuneWheel = async (): Promise<FortuneWheelData> => {
  const { data } = await axios.get<{ wheel: FortuneWheelData }>(`${API_URL}/api/fortune-wheel`);
  return {
    title: data.wheel?.title ?? '',
    tasks: data.wheel?.tasks ?? [],
    updatedAt: data.wheel?.updatedAt ?? null,
  };
};

export const saveFortuneWheel = async (payload: {
  title: string;
  tasks: string[];
}): Promise<FortuneWheelData> => {
  const { data } = await axios.put<{ wheel: FortuneWheelData }>(`${API_URL}/api/fortune-wheel`, payload);
  return {
    title: data.wheel?.title ?? '',
    tasks: data.wheel?.tasks ?? [],
    updatedAt: data.wheel?.updatedAt ?? null,
  };
};
