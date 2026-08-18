import axios from 'axios';
import { API_URL } from '../config';
import type { EncryptedChatPayload } from '../crypto/cryptoService';
import type { SharedChatRestoreRef } from '../components/Chat/ChatDialog';

export type ChatRestoreCopySource = {
  id: string;
  senderId: string;
  receiverId: string;
  encryptedPayload: EncryptedChatPayload;
};

export type ChatRestoreCopy = {
  id: string;
  encryptedPayload: EncryptedChatPayload;
};

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const fetchChatRestoreCopies = async (
  contactId: string,
  page = 1,
  limit = 100
): Promise<{ items: ChatRestoreCopySource[]; hasMore: boolean; total: number }> => {
  const response = await axios.get(`${API_URL}/api/messages/restore-copies`, {
    params: { contactId, page, limit },
    headers: authHeaders()
  });

  const items = Array.isArray(response.data?.items)
    ? response.data.items.filter((item: ChatRestoreCopySource) => item?.id && item.encryptedPayload)
    : [];

  return {
    items,
    hasMore: Boolean(response.data?.hasMore),
    total: Number(response.data?.total || items.length)
  };
};

export const saveChatRestoreCopies = async (params: {
  contactId: string;
  requestMessageId: string;
  copies: ChatRestoreCopy[];
  status?: SharedChatRestoreRef['status'];
}) => {
  const response = await axios.patch(`${API_URL}/api/messages/restore-copies`, params, {
    headers: authHeaders()
  });
  return response.data as {
    updated: number;
    request?: { id: string; sharedChatRestore?: SharedChatRestoreRef };
  };
};
