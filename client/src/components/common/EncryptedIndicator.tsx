import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  SxProps,
  Theme,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import ResponsiveDialog from '../UI/ResponsiveDialog';

interface EncryptedIndicatorProps {
  sx?: SxProps<Theme>;
}

const EncryptedIndicator: React.FC<EncryptedIndicatorProps> = ({ sx }) => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={() => setModalOpen(true)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          flexShrink: 0,
          color: 'text.secondary',
          border: 'none',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
          font: 'inherit',
          '&:hover': {
            color: 'text.primary',
          },
          ...sx,
        }}
        aria-label={t('crypto.encryptedAria')}
      >
        <Typography
          variant="caption"
          component="span"
          sx={{
            fontSize: '0.7rem',
            lineHeight: 1,
          }}
        >
          {t('crypto.encryptedShort')}
        </Typography>
        <LockIcon sx={{ fontSize: 14 }} />
      </Box>

      <ResponsiveDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon color="primary" />
              <Typography variant="h6" component="span" sx={{ fontWeight: 500 }}>
                {t('crypto.encryptedModal.title')}
              </Typography>
            </Box>
            <IconButton
              aria-label={t('crypto.encryptedModal.close')}
              onClick={() => setModalOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
            {t('crypto.encryptedModal.description')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setModalOpen(false)}>
            {t('crypto.encryptedModal.close')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </>
  );
};

export default EncryptedIndicator;
