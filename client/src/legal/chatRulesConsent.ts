/** Версия документа правил: при изменении существенного текста увеличьте — пользователю снова покажется запрос. */
export const CHAT_RULES_DOCUMENT_VERSION = 1;

export type ChatRulesConsentRecord = {
  acceptedAt: string;
  version: number;
};

export function getChatRulesStorageKey(userId: string): string {
  return `amorely.chatRulesConsent.v${CHAT_RULES_DOCUMENT_VERSION}.${userId}`;
}

export function readChatRulesConsent(userId: string): ChatRulesConsentRecord | null {
  try {
    const raw = localStorage.getItem(getChatRulesStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatRulesConsentRecord;
    if (parsed.version !== CHAT_RULES_DOCUMENT_VERSION) return null;
    if (typeof parsed.acceptedAt !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeChatRulesConsent(userId: string): ChatRulesConsentRecord {
  const record: ChatRulesConsentRecord = {
    acceptedAt: new Date().toISOString(),
    version: CHAT_RULES_DOCUMENT_VERSION
  };
  localStorage.setItem(getChatRulesStorageKey(userId), JSON.stringify(record));
  return record;
}
