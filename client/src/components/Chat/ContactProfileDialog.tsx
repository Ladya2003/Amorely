import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  CircularProgress,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import CloseIcon from '@mui/icons-material/Close';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import axios from 'axios';
import { API_URL } from '../../config';
import ContentViewer from '../Calendar/ContentViewer';
import { Contact } from './ChatList';

export interface ContactProfile extends Contact {
  bio?: string;
  birthday?: string | null;
}

interface ContactProfileDialogProps {
  open: boolean;
  onClose: () => void;
  contact: Contact | null;
}

const PLACEHOLDER_BIOS = [
  (name: string) =>
    `${name} пока не оставил(а) описание — видимо, сюрпризы любит не только в переписке.`,
  (name: string) =>
    `О ${name} пока известно только одно: с этим человеком переписка точно не скучная.`,
  (name: string) =>
    `${name} решил(а), что лучше загадочности, чем длинного описания. Уважаем.`,
  (name: string) =>
    `Биография ${name} в разработке. Пока что главное — хороший чат и отличное настроение.`,
  (name: string) =>
    `${name} хранит описание в секрете или еще пока не добавил(а)`
];

const getPlaceholderBio = (name: string, seed: string) => {
  const safeName = name.trim() || 'Собеседник';
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index) * (index + 1)) % PLACEHOLDER_BIOS.length;
  }

  return PLACEHOLDER_BIOS[hash](safeName);
};

const formatBirthday = (birthday?: string | null) => {
  if (!birthday) return null;

  const date = new Date(birthday);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long'
  });
};

const ContactProfileDialog: React.FC<ContactProfileDialogProps> = ({ open, onClose, contact }) => {
  const [profile, setProfile] = useState<ContactProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);

  useEffect(() => {
    if (!open || !contact?.id) {
      setProfile(null);
      setAvatarViewerOpen(false);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      setIsLoading(true);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/contacts/${contact.id}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!cancelled) {
          setProfile(response.data);
        }
      } catch {
        if (!cancelled) {
          setProfile({
            ...contact,
            bio: contact.bio || '',
            birthday: contact.birthday ?? null
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [open, contact]);

  const displayProfile = profile || contact;
  const fullName = useMemo(() => {
    if (!displayProfile) return '';

    const composedName = [displayProfile.firstName, displayProfile.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return composedName || displayProfile.name;
  }, [displayProfile]);

  const bioText = useMemo(() => {
    if (!displayProfile) return '';

    const trimmedBio = displayProfile.bio?.trim();
    if (trimmedBio) return trimmedBio;

    return getPlaceholderBio(fullName, displayProfile.id);
  }, [displayProfile, fullName]);

  const birthdayLabel = formatBirthday(displayProfile?.birthday);
  const avatarUrl = displayProfile?.avatar || '';

  const handleClose = () => {
    setAvatarViewerOpen(false);
    onClose();
  };

  return (
    <>
      <ResponsiveDialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            mx: 2
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1
          }}
        >
          Профиль
          <IconButton onClick={handleClose} aria-label="Закрыть профиль" size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 0, pb: 3 }}>
          {isLoading && !displayProfile ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : displayProfile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Avatar
                src={avatarUrl}
                alt={fullName}
                onClick={() => {
                  if (avatarUrl) {
                    setAvatarViewerOpen(true);
                  }
                }}
                sx={{
                  width: 112,
                  height: 112,
                  mb: 2,
                  cursor: avatarUrl ? 'pointer' : 'default',
                  boxShadow: 2
                }}
              />

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {fullName}
              </Typography>

              {displayProfile.username && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  @{displayProfile.username}
                </Typography>
              )}

              {displayProfile.email && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: birthdayLabel ? 1 : 1.5 }}>
                  {displayProfile.email}
                </Typography>
              )}

              {birthdayLabel && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    mb: 1.5,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: '999px',
                    bgcolor: 'action.hover'
                  }}
                >
                  <CakeOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="body2">{birthdayLabel}</Typography>
                </Box>
              )}

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  lineHeight: 1.6,
                  fontStyle: displayProfile.bio?.trim() ? 'normal' : 'italic'
                }}
              >
                {bioText}
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
      </ResponsiveDialog>

      <ContentViewer
        open={avatarViewerOpen}
        onClose={() => setAvatarViewerOpen(false)}
        content={
          avatarUrl
            ? {
                mediaUrl: avatarUrl,
                resourceType: 'image'
              }
            : null
        }
      />
    </>
  );
};

export default ContactProfileDialog;
