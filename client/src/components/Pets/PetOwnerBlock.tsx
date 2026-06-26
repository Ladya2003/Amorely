import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface PetOwnerBlockProps {
  username?: string | null;
  avatar?: string | null;
  labelKey?: string;
  overlay?: boolean;
}

const PetOwnerBlock: React.FC<PetOwnerBlockProps> = ({
  username,
  avatar,
  labelKey = 'pets.ownerLabel',
  overlay = false,
}) => {
  const { t } = useTranslation();
  const initial = (username || '?').trim().charAt(0).toUpperCase();

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: overlay ? 1.25 : 1.5,
        borderRadius: 3,
        width: 'fit-content',
        maxWidth: '100%',
        bgcolor: overlay
          ? alpha(theme.palette.primary.dark, 0.62)
          : alpha(theme.palette.primary.main, 0.14),
        color: overlay ? theme.palette.primary.contrastText : undefined,
        backdropFilter: overlay ? 'blur(7px)' : undefined,
        WebkitBackdropFilter: overlay ? 'blur(7px)' : undefined,
        boxShadow: overlay
          ? `0 6px 20px ${alpha(theme.palette.common.black, 0.28)}`
          : undefined,
        overflow: overlay ? 'hidden' : undefined,
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <Avatar
          src={avatar || undefined}
          sx={(theme) => ({
            width: overlay ? 32 : 40,
            height: overlay ? 32 : 40,
            flexShrink: 0,
            border: overlay ? `2px solid ${alpha(theme.palette.primary.contrastText, 0.35)}` : undefined,
          })}
        >
          {initial}
        </Avatar>
        <Box sx={{ minWidth: 0, maxWidth: 100, overflow: 'hidden' }}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {t(labelKey)}
          </Typography>
          {username && (
            <Typography
              variant="caption"
              noWrap
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: overlay ? 'inherit' : 'text.secondary',
                opacity: overlay ? 0.82 : 1,
              }}
            >
              @{username}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default PetOwnerBlock;
