import React, { useEffect, useRef, useState } from 'react';
import { Box, SxProps, Theme } from '@mui/material';

interface RevealOnScrollProps {
  children: React.ReactNode;
  delayMs?: number;
  sx?: SxProps<Theme>;
  /** Показать сразу, без анимации появления при скролле */
  eager?: boolean;
}

const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  delayMs = 0,
  sx,
  eager = false,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager) {
      setVisible(true);
      return undefined;
    }

    const node = ref.current;
    if (!node) {
      return undefined;
    }

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: eager
          ? 'none'
          : 'opacity 0.75s cubic-bezier(0.22, 1, 0.36, 1), transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: !eager && visible ? `${delayMs}ms` : '0ms',
        willChange: eager ? 'auto' : 'opacity, transform',
        ...((sx as object) || {}),
      }}
    >
      {children}
    </Box>
  );
};

export default RevealOnScroll;
