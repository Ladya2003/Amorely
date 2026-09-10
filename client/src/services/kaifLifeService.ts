import axios from 'axios';
import { API_URL } from '../config';
import type { KaifLifeIdea, KaifLifeIdeaDraft } from '../components/KaifLife/kaifLifeTypes';

export type KaifLifeUploadItem = {
  url: string;
  publicId: string;
  mediaType: 'image' | 'video';
};

export const fetchKaifLifeIdeas = async (): Promise<KaifLifeIdea[]> => {
  const { data } = await axios.get<{ ideas: KaifLifeIdea[] }>(`${API_URL}/api/kaif-life/ideas`);
  return data.ideas;
};

export const fetchKaifLifeIdea = async (id: string): Promise<KaifLifeIdea> => {
  const { data } = await axios.get<{ idea: KaifLifeIdea }>(`${API_URL}/api/kaif-life/ideas/${id}`);
  return data.idea;
};

export const createKaifLifeIdea = async (draft: KaifLifeIdeaDraft): Promise<KaifLifeIdea> => {
  const { data } = await axios.post<{ idea: KaifLifeIdea }>(`${API_URL}/api/kaif-life/ideas`, draft);
  return data.idea;
};

export const updateKaifLifeIdea = async (
  id: string,
  draft: KaifLifeIdeaDraft
): Promise<KaifLifeIdea> => {
  const { data } = await axios.put<{ idea: KaifLifeIdea }>(`${API_URL}/api/kaif-life/ideas/${id}`, draft);
  return data.idea;
};

export const deleteKaifLifeIdea = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/api/kaif-life/ideas/${id}`);
};

export const uploadKaifLifeMedia = async (files: File[]): Promise<KaifLifeUploadItem[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('media', file);
  });

  const { data } = await axios.post<{ items: KaifLifeUploadItem[] }>(
    `${API_URL}/api/kaif-life/upload`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  return data.items;
};
