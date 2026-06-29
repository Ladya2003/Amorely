import { useCallback, useState } from 'react';
import {
  CHAT_MESSAGE_FONT_SIZE_MAX_STEP,
  CHAT_MESSAGE_FONT_SIZE_MIN_STEP,
  getChatMessageFontSizePx,
  readChatMessageFontSizeStep,
  writeChatMessageFontSizeStep,
} from '../utils/chatMessageFontSize';

export function useChatMessageFontSize() {
  const [step, setStep] = useState(() => readChatMessageFontSizeStep());

  const fontSizePx = getChatMessageFontSizePx(step);
  const canDecrease = step > CHAT_MESSAGE_FONT_SIZE_MIN_STEP;
  const canIncrease = step < CHAT_MESSAGE_FONT_SIZE_MAX_STEP;

  const decrease = useCallback(() => {
    setStep((current) => writeChatMessageFontSizeStep(current - 1));
  }, []);

  const increase = useCallback(() => {
    setStep((current) => writeChatMessageFontSizeStep(current + 1));
  }, []);

  return {
    step,
    fontSizePx,
    canDecrease,
    canIncrease,
    decrease,
    increase,
  };
}
