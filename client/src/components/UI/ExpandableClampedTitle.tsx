import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  TypographyProps,
} from '@mui/material';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import type { SxProps, Theme } from '@mui/material/styles';
import ResponsiveDialog from './ResponsiveDialog';

const clampSx = (maxLines: number) =>
  ({
    display: '-webkit-box',
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word',
  }) as const;

interface ExpandableClampedTitleProps {
  text: string;
  maxLines?: number;
  variant?: TypographyProps['variant'];
  dialogTitle: string;
  expandAriaLabel: string;
  closeLabel: string;
  sx?: SxProps<Theme>;
}

const ExpandableClampedTitle: React.FC<ExpandableClampedTitleProps> = ({
  text,
  maxLines = 2,
  variant = 'h6',
  dialogTitle,
  expandAriaLabel,
  closeLabel,
  sx,
}) => {
  const textRef = useRef<HTMLElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) {
      return undefined;
    }

    const checkTruncation = () => {
      setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    };

    checkTruncation();

    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);

    return () => observer.disconnect();
  }, [text, maxLines]);

  const handleOpen = () => {
    if (isTruncated) {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          minWidth: 0,
          ...(isTruncated && {
            cursor: 'pointer',
            '&:hover .expandable-clamped-title__text': {
              color: 'text.primary',
            },
          }),
        }}
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (!isTruncated) {
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setDialogOpen(true);
          }
        }}
        role={isTruncated ? 'button' : undefined}
        tabIndex={isTruncated ? 0 : undefined}
        aria-label={isTruncated ? expandAriaLabel : undefined}
      >
        <Typography
          ref={textRef}
          variant={variant}
          className="expandable-clamped-title__text"
          sx={[
            clampSx(maxLines),
            { flex: 1, minWidth: 0 },
            ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
          ]}
        >
          {text}
        </Typography>
        {isTruncated && (
          <IconButton
            size="small"
            aria-label={expandAriaLabel}
            onClick={(event) => {
              event.stopPropagation();
              setDialogOpen(true);
            }}
            sx={{
              flexShrink: 0,
              color: 'text.secondary',
            }}
          >
            <UnfoldMoreIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <ResponsiveDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {text}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setDialogOpen(false)}>
            {closeLabel}
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </>
  );
};

export default ExpandableClampedTitle;
