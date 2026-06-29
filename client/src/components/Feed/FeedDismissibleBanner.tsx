import React, { useState } from 'react';
import { Box, Collapse, IconButton, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { feedBannerCollapseSx, getFeedBannerPaperSx } from './feedBannerStyles';

interface FeedDismissibleBannerProps {
  initiallyVisible: boolean;
  onDismissPersist: () => void;
  onBannerClick: () => void;
  closeAriaLabel: string;
  children: React.ReactNode;
}

const FeedDismissibleBanner: React.FC<FeedDismissibleBannerProps> = ({
  initiallyVisible,
  onDismissPersist,
  onBannerClick,
  closeAriaLabel,
  children,
}) => {
  const [mounted, setMounted] = useState(initiallyVisible);
  const [open, setOpen] = useState(true);

  if (!mounted) {
    return null;
  }

  const handleDismiss = (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen(false);
  };

  const handleExited = () => {
    onDismissPersist();
    setMounted(false);
  };

  return (
    <Collapse in={open} timeout={320} sx={feedBannerCollapseSx} onExited={handleExited}>
      <Box className="feed-banner-shell" sx={{ mb: 2 }}>
        <Paper
          elevation={0}
          onClick={onBannerClick}
          sx={(theme) => getFeedBannerPaperSx(theme)}
        >
          <IconButton
            size="small"
            aria-label={closeAriaLabel}
            onClick={handleDismiss}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              color: 'text.secondary',
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          {children}
        </Paper>
      </Box>
    </Collapse>
  );
};

export default FeedDismissibleBanner;
