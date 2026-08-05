import type { ChatRulesConsent } from '../services/uiPreferencesService';

/** Версия документа правил: при изменении существенного текста увеличьте — пользователю снова покажется запрос. */
export const CHAT_RULES_DOCUMENT_VERSION = 1;

export type ChatRulesConsentRecord = ChatRulesConsent;

/** @deprecated Локальный ключ оставлен только для миграции старых согласий в аккаунт. */
export function getChatRulesStorageKey(userId: string): string {
  return `amorely.chatRulesConsent.v${CHAT_RULES_DOCUMENT_VERSION}.${userId}`;
}

/** Чтение старого локального согласия (для одноразовой миграции на аккаунт). */
export function readLocalChatRulesConsent(userId: string): ChatRulesConsentRecord | null {
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

export function clearLocalChatRulesConsent(userId: string): void {
  localStorage.removeItem(getChatRulesStorageKey(userId));
}

export function hasAcceptedChatRules(
  consent: ChatRulesConsentRecord | null | undefined
): boolean {
  return Boolean(
    consent &&
      consent.version === CHAT_RULES_DOCUMENT_VERSION &&
      typeof consent.acceptedAt === 'string'
  );
}
