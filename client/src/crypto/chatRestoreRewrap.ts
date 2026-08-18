import {
  decryptChatPayload,
  encryptChatPayload,
  invalidatePeerPublicKeyCache,
  prefetchPeerPublicKey,
  type LocalDeviceKeys
} from './cryptoService';
import {
  fetchChatRestoreCopies,
  saveChatRestoreCopies,
  type ChatRestoreCopy
} from '../services/chatRestoreService';

export type ChatHistoryRestoreProgress = {
  restored: number;
  failed: number;
  total: number;
};

const SAVE_BATCH_SIZE = 40;

export const runChatHistoryRestoreRewrap = async (
  keys: LocalDeviceKeys,
  helperUserId: string,
  requesterUserId: string,
  requestMessageId: string,
  onProgress?: (progress: ChatHistoryRestoreProgress) => void
): Promise<ChatHistoryRestoreProgress> => {
  await invalidatePeerPublicKeyCache(requesterUserId);
  await prefetchPeerPublicKey(requesterUserId);

  const sources: Awaited<ReturnType<typeof fetchChatRestoreCopies>>['items'] = [];
  let page = 1;
  let total = 0;

  while (true) {
    const batch = await fetchChatRestoreCopies(requesterUserId, page, 100);
    sources.push(...batch.items);
    total = batch.total;
    onProgress?.({
      restored: 0,
      failed: 0,
      total
    });
    if (!batch.hasMore) {
      break;
    }
    page += 1;
  }

  const copies: ChatRestoreCopy[] = [];
  let restored = 0;
  let failed = 0;

  for (const item of sources) {
    try {
      const isOwnMessage = item.senderId === helperUserId;
      const decryptPeerId = isOwnMessage ? requesterUserId : item.senderId;
      const payload = await decryptChatPayload(keys, decryptPeerId, item.encryptedPayload, {
        isOwnMessage
      });
      const encryptedPayload = await encryptChatPayload(keys, requesterUserId, payload);
      copies.push({ id: item.id, encryptedPayload });
      restored += 1;
    } catch {
      failed += 1;
    }

    onProgress?.({ restored, failed, total });
  }

  const finalStatus = restored > 0 ? 'completed' : 'failed';

  if (copies.length === 0) {
    await saveChatRestoreCopies({
      contactId: requesterUserId,
      requestMessageId,
      copies: [],
      status: finalStatus
    });
    return { restored, failed, total };
  }

  for (let index = 0; index < copies.length; index += SAVE_BATCH_SIZE) {
    const batch = copies.slice(index, index + SAVE_BATCH_SIZE);
    const isLast = index + SAVE_BATCH_SIZE >= copies.length;
    await saveChatRestoreCopies({
      contactId: requesterUserId,
      requestMessageId,
      copies: batch,
      status: isLast ? finalStatus : undefined
    });
  }

  return { restored, failed, total };
};
