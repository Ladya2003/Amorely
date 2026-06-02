import { useEffect } from 'react';

const COMPOSER_SELECTOR = '[data-chat-composer]';
const DISABLED_FLAG = 'data-ios-chat-disabled';

/**
 * While the mobile chat composer is active, disable every other form control in the
 * document so iOS Safari does not show the prev/next field navigation on the accessory bar.
 */
export function useDisableForeignFormFields(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const disabledElements: HTMLElement[] = [];

    document.querySelectorAll('input, textarea, select').forEach((element) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }

      if (element.closest(COMPOSER_SELECTOR)) {
        return;
      }

      if (element.getAttribute(DISABLED_FLAG) === 'true') {
        return;
      }

      element.setAttribute(DISABLED_FLAG, 'true');
      disabledElements.push(element);

      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        element.disabled = true;
      }

      element.setAttribute('tabindex', '-1');
      element.setAttribute('aria-hidden', 'true');
    });

    return () => {
      disabledElements.forEach((element) => {
        element.removeAttribute(DISABLED_FLAG);

        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ) {
          element.disabled = false;
        }

        element.removeAttribute('tabindex');
        element.removeAttribute('aria-hidden');
      });
    };
  }, [enabled]);
}
