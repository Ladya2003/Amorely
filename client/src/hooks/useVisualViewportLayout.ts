import { useEffect, useRef, useState } from 'react';

const KEYBOARD_HEIGHT_THRESHOLD_PX = 80;

export type VisualViewportLayout = {
  height: number;
  offsetTop: number;
  keyboardOpen: boolean;
};

const getInitialLayout = (): VisualViewportLayout => {
  if (typeof window === 'undefined') {
    return { height: 0, offsetTop: 0, keyboardOpen: false };
  }

  const viewport = window.visualViewport;
  return {
    height: viewport?.height ?? window.innerHeight,
    offsetTop: viewport?.offsetTop ?? 0,
    keyboardOpen: false,
  };
};

/**
 * Syncs a fixed fullscreen layer with the iOS/Android visual viewport
 * so the chat input sits flush above the keyboard accessory bar.
 */
export function useVisualViewportLayout(enabled = true): VisualViewportLayout {
  const [layout, setLayout] = useState<VisualViewportLayout>(getInitialLayout);
  const maxViewportHeightRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      maxViewportHeightRef.current = 0;
      setLayout(getInitialLayout());
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      setLayout({
        height: window.innerHeight,
        offsetTop: 0,
        keyboardOpen: false,
      });
      return;
    }

    const update = () => {
      const viewportHeight = viewport.height;
      if (viewportHeight > maxViewportHeightRef.current) {
        maxViewportHeightRef.current = viewportHeight;
      }

      const baseline = maxViewportHeightRef.current;
      const shrinkFromBaseline = baseline - viewportHeight;
      const obscured =
        window.innerHeight - viewportHeight - viewport.offsetTop;
      const keyboardOpen =
        shrinkFromBaseline > KEYBOARD_HEIGHT_THRESHOLD_PX ||
        obscured > KEYBOARD_HEIGHT_THRESHOLD_PX;

      setLayout({
        height: viewportHeight,
        offsetTop: viewport.offsetTop,
        keyboardOpen,
      });
    };

    const scheduleUpdate = () => {
      update();
      requestAnimationFrame(update);
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        scheduleUpdate();
        window.setTimeout(scheduleUpdate, 100);
        window.setTimeout(scheduleUpdate, 300);
      }
    };

    scheduleUpdate();
    viewport.addEventListener('resize', scheduleUpdate);
    viewport.addEventListener('scroll', scheduleUpdate);
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('orientationchange', scheduleUpdate);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      viewport.removeEventListener('resize', scheduleUpdate);
      viewport.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('orientationchange', scheduleUpdate);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [enabled]);

  return layout;
}
