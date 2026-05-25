import { useCallback, useRef } from 'react';
import type { TouchEvent } from 'react';

interface UseHorizontalSwipeOptions {
  enabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
  threshold?: number;
  moveThreshold?: number;
}

const defaultSwipeContainerSx = {
  touchAction: 'pan-y' as const
};

export const useHorizontalSwipe = ({
  enabled = true,
  onPrev,
  onNext,
  threshold = 50,
  moveThreshold = 12
}: UseHorizontalSwipeOptions) => {
  const swipeStateRef = useRef({ startX: 0, startY: 0, isSwipe: false });

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!enabled) return;

      const touch = event.touches[0];
      swipeStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        isSwipe: false
      };
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!enabled) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - swipeStateRef.current.startX;
      const deltaY = touch.clientY - swipeStateRef.current.startY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > moveThreshold) {
        swipeStateRef.current.isSwipe = true;
      }
    },
    [enabled, moveThreshold]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!enabled) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - swipeStateRef.current.startX;
      const deltaY = touch.clientY - swipeStateRef.current.startY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        swipeStateRef.current.isSwipe = true;

        if (deltaX > 0) {
          onPrev();
        } else {
          onNext();
        }
      }
    },
    [enabled, onNext, onPrev, threshold]
  );

  const consumeSwipeClick = useCallback(() => {
    if (!swipeStateRef.current.isSwipe) {
      return false;
    }

    swipeStateRef.current.isSwipe = false;
    return true;
  }, []);

  return {
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    swipeContainerSx: defaultSwipeContainerSx,
    consumeSwipeClick
  };
};
