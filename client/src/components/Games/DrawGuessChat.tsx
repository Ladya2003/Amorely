import React, { useEffect, useRef } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { getDrawGuessBubbleSx, getDrawGuessChatPanelSx } from './gamePlayPageStyles';

export interface DrawGuessAttemptItem {
  userId: string;
  text: string;
  isOwnGuess: boolean;
}

export interface DrawGuessChatProps {
  attempts?: DrawGuessAttemptItem[];
  title?: string;
  maxVisible?: number;
  fillHeight?: boolean;
  maxHeight?: number;
  titleColor?: string;
  ownGuessSide?: 'left' | 'right';
}

const DEFAULT_MAX_HEIGHT = 112;

export default function DrawGuessChat({
  attempts = [],
  title,
  maxVisible = 8,
  fillHeight = false,
  maxHeight,
  titleColor,
  ownGuessSide = 'right',
}: DrawGuessChatProps) {
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const safeAttempts = Array.isArray(attempts) ? attempts : [];
  const visibleAttempts = safeAttempts.slice(-maxVisible);
  const scrollMaxHeight = maxHeight ?? (fillHeight ? undefined : DEFAULT_MAX_HEIGHT);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [visibleAttempts.length, safeAttempts.length]);

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
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          display: 'block',
          mb: titleColor ? 1 : 0.5,
          flexShrink: 0,
          fontWeight: 700,
          fontSize: '0.8125rem',
          color: titleColor ?? 'text.secondary',
        }}
      >
        {title}
      </Typography>
      <Box
        ref={scrollRef}
        sx={{
          ...getDrawGuessChatPanelSx(theme),
          ...(scrollMaxHeight != null
            ? {
                height: scrollMaxHeight,
                minHeight: scrollMaxHeight,
                maxHeight: scrollMaxHeight,
              }
            : {
                flex: fillHeight ? 1 : undefined,
                minHeight: fillHeight ? 80 : visibleAttempts.length === 0 ? 40 : undefined,
              }),
        }}
      >
        {visibleAttempts.map((attempt, index) => (
          <Box
            key={`${attempt.userId}-${index}-${attempt.text}`}
            sx={getDrawGuessBubbleSx(
              theme,
              attempt.isOwnGuess && ownGuessSide === 'right'
            )}
          >
            <Typography
              component="span"
              sx={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 500,
                wordBreak: 'break-word',
                lineHeight: 1.35,
                textTransform: 'none',
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
