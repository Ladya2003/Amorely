import axios from 'axios';
import { API_URL } from '../config';
import type {
  KaifLifeGroup,
  KaifLifeIdea,
  KaifLifeIdeaDraft,
  KaifLifeListPayload,
  KaifLifeMoveDirection,
} from '../components/KaifLife/kaifLifeTypes';

export type KaifLifeUploadItem = {
  url: string;
  publicId: string;
  mediaType: 'image' | 'video';
};

export type KaifLifeDocumentUploadItem = {
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
};

export const fetchKaifLifeList = async (): Promise<KaifLifeListPayload> => {
  const { data } = await axios.get<KaifLifeListPayload>(`${API_URL}/api/kaif-life/ideas`);
  return {
    groups: data.groups ?? [],
    ideas: data.ideas ?? [],
  };
};

export const fetchKaifLifeIdea = async (id: string): Promise<KaifLifeIdea> => {
  const { data } = await axios.get<{ idea: KaifLifeIdea }>(`${API_URL}/api/kaif-life/ideas/${id}`);
  return data.idea;
};

export const createKaifLifeGroup = async (title: string): Promise<KaifLifeGroup> => {
  const { data } = await axios.post<{ group: KaifLifeGroup }>(`${API_URL}/api/kaif-life/groups`, {
    title,
  });
  return data.group;
};

export const updateKaifLifeGroup = async (id: string, title: string): Promise<KaifLifeGroup> => {
  const { data } = await axios.patch<{ group: KaifLifeGroup }>(`${API_URL}/api/kaif-life/groups/${id}`, {
    title,
  });
  return data.group;
};

export const deleteKaifLifeGroup = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/api/kaif-life/groups/${id}`);
};

export const moveKaifLifeGroup = async (
  id: string,
  direction: KaifLifeMoveDirection
): Promise<KaifLifeListPayload> => {
  const { data } = await axios.patch<KaifLifeListPayload>(`${API_URL}/api/kaif-life/groups/${id}/move`, {
    direction,
  });
  return {
    groups: data.groups ?? [],
    ideas: data.ideas ?? [],
  };
};

export const createKaifLifeIdea = async (
  draft: KaifLifeIdeaDraft,
  groupId: string
): Promise<KaifLifeIdea> => {
  const { data } = await axios.post<{ idea: KaifLifeIdea }>(`${API_URL}/api/kaif-life/ideas`, {
    ...draft,
    groupId,
  });
  return data.idea;
};

export const updateKaifLifeIdea = async (
  id: string,
  draft: KaifLifeIdeaDraft
): Promise<KaifLifeIdea> => {
  const { data } = await axios.put<{ idea: KaifLifeIdea }>(`${API_URL}/api/kaif-life/ideas/${id}`, draft);
  return data.idea;
};

export const moveKaifLifeIdea = async (
  id: string,
  direction: KaifLifeMoveDirection
): Promise<KaifLifeListPayload> => {
  const { data } = await axios.patch<KaifLifeListPayload>(`${API_URL}/api/kaif-life/ideas/${id}/move`, {
    direction,
  });
  return {
    groups: data.groups ?? [],
    ideas: data.ideas ?? [],
  };
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

export const uploadKaifLifeDocuments = async (
  files: File[]
): Promise<KaifLifeDocumentUploadItem[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('documents', file);
  });

  const { data } = await axios.post<{ items: KaifLifeDocumentUploadItem[] }>(
    `${API_URL}/api/kaif-life/upload-documents`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  return data.items;
};
