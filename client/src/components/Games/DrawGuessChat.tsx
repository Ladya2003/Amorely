import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

export interface DrawGuessAttemptItem {
  userId: string;
  text: string;
  isOwnGuess: boolean;
}

export interface DrawGuessChatProps {
  attempts?: DrawGuessAttemptItem[];
  title?: string;
  maxVisible?: number;
  /** Растянуть по высоте родительской колонки (для панели рисующего) */
  fillHeight?: boolean;
  /** Цвет заголовка как у подписей панели инструментов (например primary.main) */
  titleColor?: string;
  /** Сторона своих сообщений в ленте (у угадывающего — слева) */
  ownGuessSide?: 'left' | 'right';
}

export default function DrawGuessChat({
  attempts = [],
  title = 'Догадки',
  maxVisible = 8,
  fillHeight = false,
  titleColor,
  ownGuessSide = 'right',
}: DrawGuessChatProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const safeAttempts = Array.isArray(attempts) ? attempts : [];
  const visibleAttempts = safeAttempts.slice(-maxVisible);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [visibleAttempts.length, safeAttempts.length]);

  if (visibleAttempts.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        height: fillHeight ? '100%' : 'auto',
        flex: fillHeight ? 1 : undefined,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant={titleColor ? 'subtitle2' : 'caption'}
        sx={{
          display: 'block',
          mb: titleColor ? 1 : 0.5,
          flexShrink: 0,
          color: titleColor ?? 'text.secondary',
        }}
      >
        {title}
      </Typography>
      <Box
        ref={scrollRef}
        sx={{
          flex: fillHeight ? 1 : undefined,
          minHeight: fillHeight ? 80 : undefined,
          maxHeight: fillHeight ? undefined : 112,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          p: 1,
          borderRadius: 1.5,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {visibleAttempts.map((attempt, index) => (
          <Box
            key={`${attempt.userId}-${index}-${attempt.text}`}
            sx={{
              alignSelf:
                attempt.isOwnGuess && ownGuessSide === 'right' ? 'flex-end' : 'flex-start',
              maxWidth: '100%',
              px: 1,
              py: 0.5,
              borderRadius: 1.5,
              bgcolor: attempt.isOwnGuess ? 'primary.main' : 'background.paper',
              color: attempt.isOwnGuess ? 'primary.contrastText' : 'text.primary',
              border: attempt.isOwnGuess ? 'none' : '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                wordBreak: 'break-word',
                lineHeight: 1.35,
              }}
            >
              {attempt.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
