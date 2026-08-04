import { ReactNode } from 'react';
import { HIDE_INPUT_LABELS } from './surfaceStyles';

/** Если floating label скрыт — используем текст label как placeholder (если свой не задан). */
export function placeholderFromLabel(
  label: ReactNode | undefined,
  placeholder?: string
): string | undefined {
  if (placeholder != null && placeholder !== '') {
    return placeholder;
  }
  if (!HIDE_INPUT_LABELS) {
    return placeholder;
  }
  if (typeof label === 'string' && label.trim()) {
    return label;
  }
  return placeholder;
}

/**
 * Когда лейблы скрыты, не передаём label в MUI — иначе InputBase
 * держит placeholder с opacity:0 до фокуса (лейбл должен был его заменять).
 */
export function visibleFieldLabel(label: ReactNode | undefined): ReactNode | undefined {
  return HIDE_INPUT_LABELS ? undefined : label;
}
