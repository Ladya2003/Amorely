import React from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { HIDE_INPUT_LABELS } from '../../theme/surfaceStyles';

type FieldCaptionProps = {
  children: React.ReactNode;
  required?: boolean;
  sx?: TypographyProps['sx'];
};

/**
 * Текстовая подпись над полем — только когда floating label отключены.
 */
const FieldCaption: React.FC<FieldCaptionProps> = ({ children, required, sx }) => {
  if (!HIDE_INPUT_LABELS) {
    return null;
  }

  return (
    <Typography
      component="label"
      variant="body2"
      sx={{
        display: 'block',
        mb: 0.75,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        color: 'text.secondary',
        ...((sx as object) || {}),
      }}
    >
      {children}
      {required ? ' *' : null}
    </Typography>
  );
};

export default FieldCaption;
