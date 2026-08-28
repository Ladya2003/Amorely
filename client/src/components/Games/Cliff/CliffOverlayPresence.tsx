import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import {
  getCliffOverlayDurationMs,
  getCliffOverlayPresenceSx,
  type CliffOverlayMotion,
} from './cliffStyles';

type CliffOverlayPresenceProps = {
  open: boolean;
  variant: CliffOverlayMotion;
  children: React.ReactNode;
};

const CliffOverlayPresence: React.FC<CliffOverlayPresenceProps> = ({ open, variant, children }) => {
  const [rendered, setRendered] = useState(open);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setLeaving(false);
      return undefined;
    }
    if (!rendered) {
      return undefined;
    }
    setLeaving(true);
    const id = window.setTimeout(() => {
      setRendered(false);
      setLeaving(false);
    }, getCliffOverlayDurationMs());
    return () => window.clearTimeout(id);
  }, [open, rendered]);

  if (!rendered) {
    return null;
  }

  return <Box sx={getCliffOverlayPresenceSx(variant, leaving)}>{children}</Box>;
};

export default CliffOverlayPresence;
