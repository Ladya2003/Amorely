import axios from 'axios';
import { API_URL } from '../config';
import type { Partner } from '../components/Settings/PartnerForm';
import type { EncryptedTextPayload } from '../crypto/contentCryptoService';

export type MemoryRestoreStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'cancelled'
  | 'failed';

export type MemoryRestoreProgress = {
  events: number;
  plans: number;
  feed: number;
  failed: number;
  total: number;
};

export type MemoryRestoreRequestItem = {
  _id: string;
  status: MemoryRestoreStatus;
  requesterDeviceId?: string;
  progress: MemoryRestoreProgress;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  fromUserId?: string | null;
  toUserId?: string | null;
  peerUser?: Partner;
  direction: 'incoming' | 'outgoing';
};

export type MemoryRestoreMediaCopy = {
  mediaId: string;
  encryptedMediaEnvelope?: EncryptedTextPayload;
  encryptedMediaEnvelopePartner?: EncryptedTextPayload;
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

export const createMemoryRestoreRequest = async (
  token: string,
  requesterDeviceId?: string
) => {
  const response = await axios.post<{
    message: string;
    request: MemoryRestoreRequestItem;
    alreadyExists?: boolean;
  }>(
    `${API_URL}/api/crypto/memory-restore`,
    { requesterDeviceId },
    { headers: authHeaders(token) }
  );
  return response.data;
};

export const fetchIncomingMemoryRestoreRequests = async (token: string) => {
  const response = await axios.get<MemoryRestoreRequestItem[]>(
    `${API_URL}/api/crypto/memory-restore/incoming`,
    { headers: authHeaders(token) }
  );
  return response.data;
};

export const fetchOutgoingMemoryRestoreRequests = async (token: string) => {
  const response = await axios.get<MemoryRestoreRequestItem[]>(
    `${API_URL}/api/crypto/memory-restore/outgoing`,
    { headers: authHeaders(token) }
  );
  return response.data;
};

export const fetchPendingMemoryRestoreCount = async (token: string) => {
  const response = await axios.get<{ count: number }>(
    `${API_URL}/api/crypto/memory-restore/pending-count`,
    { headers: authHeaders(token) }
  );
  return response.data.count;
};

export const acceptMemoryRestoreRequest = async (token: string, requestId: string) => {
  const response = await axios.post<{ request: MemoryRestoreRequestItem }>(
    `${API_URL}/api/crypto/memory-restore/${requestId}/accept`,
    {},
    { headers: authHeaders(token) }
  );
  return response.data.request;
};

export const declineMemoryRestoreRequest = async (token: string, requestId: string) => {
  const response = await axios.post<{ request: MemoryRestoreRequestItem }>(
    `${API_URL}/api/crypto/memory-restore/${requestId}/decline`,
    {},
    { headers: authHeaders(token) }
  );
  return response.data.request;
};

export const cancelMemoryRestoreRequest = async (token: string, requestId: string) => {
  const response = await axios.post<{ request: MemoryRestoreRequestItem }>(
    `${API_URL}/api/crypto/memory-restore/${requestId}/cancel`,
    {},
    { headers: authHeaders(token) }
  );
  return response.data.request;
};

export const completeMemoryRestoreRequest = async (
  token: string,
  requestId: string,
  progress: MemoryRestoreProgress
) => {
  const response = await axios.post<{ request: MemoryRestoreRequestItem }>(
    `${API_URL}/api/crypto/memory-restore/${requestId}/complete`,
    { progress },
    { headers: authHeaders(token) }
  );
  return response.data.request;
};

export const failMemoryRestoreRequest = async (
  token: string,
  requestId: string,
  progress: MemoryRestoreProgress
) => {
  const response = await axios.post<{ request: MemoryRestoreRequestItem }>(
    `${API_URL}/api/crypto/memory-restore/${requestId}/fail`,
    { progress },
    { headers: authHeaders(token) }
  );
  return response.data.request;
};

export const saveRestoredEventCopies = async (
  token: string,
  requestId: string,
  payload: {
    eventId: string;
    encryptedTitle?: EncryptedTextPayload;
    encryptedDescription?: EncryptedTextPayload;
    encryptedTitlePartner?: EncryptedTextPayload;
    encryptedDescriptionPartner?: EncryptedTextPayload;
    mediaCopies?: MemoryRestoreMediaCopy[];
  }
) => {
  await axios.patch(`${API_URL}/api/crypto/memory-restore/${requestId}/event-copies`, payload, {
    headers: authHeaders(token)
  });
};

export const saveRestoredPlanCopies = async (
  token: string,
  requestId: string,
  payload: {
    planId: string;
    encryptedTitle?: EncryptedTextPayload;
    encryptedContent?: EncryptedTextPayload;
    encryptedCategory?: EncryptedTextPayload;
    encryptedTitlePartner?: EncryptedTextPayload;
    encryptedContentPartner?: EncryptedTextPayload;
    encryptedCategoryPartner?: EncryptedTextPayload;
    mediaCopies?: MemoryRestoreMediaCopy[];
  }
) => {
  await axios.patch(`${API_URL}/api/crypto/memory-restore/${requestId}/plan-copies`, payload, {
    headers: authHeaders(token)
  });
};

export const saveRestoredFeedCopies = async (
  token: string,
  requestId: string,
  payload: {
    contentId: string;
    encryptedTitle?: EncryptedTextPayload;
    encryptedDescription?: EncryptedTextPayload;
    encryptedMediaEnvelope?: EncryptedTextPayload;
    encryptedTitlePartner?: EncryptedTextPayload;
    encryptedDescriptionPartner?: EncryptedTextPayload;
    encryptedMediaEnvelopePartner?: EncryptedTextPayload;
  }
) => {
  await axios.patch(`${API_URL}/api/crypto/memory-restore/${requestId}/feed-copies`, payload, {
    headers: authHeaders(token)
  });
};
