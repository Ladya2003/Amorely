import { useEffect, useState } from 'react';

const KEYBOARD_OBSCURED_THRESHOLD_PX = 80;

/**
 * Detects virtual keyboard on mobile browsers via Visual Viewport API.
 * Used to drop bottom safe-area padding while the keyboard is open (iOS Safari).
 */
export function useVirtualKeyboardOpen(enabled = true): boolean {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsOpen(false);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const update = () => {
      const obscured =
        window.innerHeight - viewport.height - viewport.offsetTop;
      setIsOpen(obscured > KEYBOARD_OBSCURED_THRESHOLD_PX);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return isOpen;
}
