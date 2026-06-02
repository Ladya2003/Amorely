import { useState, useEffect } from 'react';

export const useTypingAnimation = (active: boolean, intervalMs = 500): string => {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (!active) {
      setDots(0);
      return;
    }

    const id = setInterval(() => {
      setDots((current) => (current + 1) % 4);
    }, intervalMs);

    return () => clearInterval(id);
  }, [active, intervalMs]);

  if (!active) {
    return '';
  }

  return `Печатает${'.'.repeat(dots)}`;
};
