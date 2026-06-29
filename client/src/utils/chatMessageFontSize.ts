export const CHAT_MESSAGE_FONT_SIZE_STORAGE_KEY = 'chatMessageFontSizeStep';

export const CHAT_MESSAGE_FONT_SIZE_BASE_PX = 14;
export const CHAT_MESSAGE_FONT_SIZE_STEP_PX = 2;
export const CHAT_MESSAGE_FONT_SIZE_MIN_STEP = -2;
export const CHAT_MESSAGE_FONT_SIZE_MAX_STEP = 4;

export function clampChatMessageFontSizeStep(step: number): number {
  return Math.min(
    CHAT_MESSAGE_FONT_SIZE_MAX_STEP,
    Math.max(CHAT_MESSAGE_FONT_SIZE_MIN_STEP, step)
  );
}

export function getChatMessageFontSizePx(step: number): number {
  return CHAT_MESSAGE_FONT_SIZE_BASE_PX + clampChatMessageFontSizeStep(step) * CHAT_MESSAGE_FONT_SIZE_STEP_PX;
}

export function getChatMessageFontSizeScale(step: number): number {
  return getChatMessageFontSizePx(step) / CHAT_MESSAGE_FONT_SIZE_BASE_PX;
}

export function readChatMessageFontSizeStep(): number {
  try {
    const raw = localStorage.getItem(CHAT_MESSAGE_FONT_SIZE_STORAGE_KEY);
    if (raw == null) return 0;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return 0;
    return clampChatMessageFontSizeStep(parsed);
  } catch {
    return 0;
  }
}

export function writeChatMessageFontSizeStep(step: number): number {
  const clamped = clampChatMessageFontSizeStep(step);
  try {
    localStorage.setItem(CHAT_MESSAGE_FONT_SIZE_STORAGE_KEY, String(clamped));
  } catch {
    // ignore quota / private mode
  }
  return clamped;
}
