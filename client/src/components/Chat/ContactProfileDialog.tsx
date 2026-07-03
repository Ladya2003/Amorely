import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Box,
  CircularProgress,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import CloseIcon from '@mui/icons-material/Close';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import axios from 'axios';
import { API_URL } from '../../config';
import ContentViewer from '../Calendar/ContentViewer';
import { Contact } from './ChatList';
import GameBadges, { AvatarGameRankMedal } from '../Games/GameBadges';
import type { RelationshipBadge } from '../../utils/gameBadges';
import { formatChatBirthday, getChatPlaceholderBio } from '../../localization/chatHelpers';
import PetSection from '../Pets/PetSection';
import PetDetailView from '../Pets/PetDetailView';
import type { Pet } from '../../services/petsService';
import {
  CONTACT_PROFILE_AVATAR_SIZE,
  getContactProfileAvatarWrapSx,
  getContactProfileBioSx,
  getContactProfileBirthdaySx,
  getContactProfileDialogContentSx,
  getContactProfileHeroSx,
  getContactProfileIdentitySx,
  getContactProfileMetaSx,
  getContactProfileNameSx,
  getContactProfileRootSx,
  getContactProfileSectionSx,
  getContactProfileSectionTitleSx,
} from './contactProfileDialogStyles';

export interface ContactProfile extends Contact {
  bio?: string;
  birthday?: string | null;
  badges?: RelationshipBadge[];
  displayBadgeGameId?: string | null;
}

interface ContactProfileDialogProps {
  open: boolean;
  onClose: () => void;
  contact: Contact | null;
}

const ContactProfileDialog: React.FC<ContactProfileDialogProps> = ({ open, onClose, contact }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [profile, setProfile] = useState<ContactProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !contact?.id) {
      setProfile(null);
      setAvatarViewerOpen(false);
      setSelectedPetId(null);
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

    return getChatPlaceholderBio(t, fullName, displayProfile.id);
  }, [displayProfile, fullName, t]);

  const birthdayLabel = formatChatBirthday(displayProfile?.birthday, i18n.language);
  const avatarUrl = displayProfile?.avatar || '';
  const contactId = displayProfile?.id ?? contact?.id ?? null;
  const showingPet = Boolean(selectedPetId);

  const handleClose = () => {
    setAvatarViewerOpen(false);
    setSelectedPetId(null);
    onClose();
  };

  const handlePetSelect = (pet: Pet) => {
    setSelectedPetId(pet.id);
  };

  return (
    <>
      <ResponsiveDialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {showingPet ? t('pets.sectionTitle') : t('chat.profile.title')}
          <IconButton onClick={handleClose} aria-label={t('chat.profile.closeAria')} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={getContactProfileDialogContentSx()}>
          {showingPet && selectedPetId ? (
            <PetDetailView
              petId={selectedPetId}
              ownerUserId={contactId ?? undefined}
              visitOnly
              embedded
              onBack={() => setSelectedPetId(null)}
            />
          ) : isLoading && !displayProfile ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : displayProfile ? (
            <Box sx={getContactProfileRootSx()}>
              <Box sx={getContactProfileHeroSx()}>
                <Box sx={getContactProfileAvatarWrapSx()}>
                  <AvatarGameRankMedal
                    badges={profile?.badges}
                    displayGameId={profile?.displayBadgeGameId}
                    showBadge={profile?.showDisplayBadge !== false}
                    avatarSize={CONTACT_PROFILE_AVATAR_SIZE}
                  >
                    <Avatar
                      src={avatarUrl}
                      alt={fullName}
                      onClick={() => {
                        if (avatarUrl) {
                          setAvatarViewerOpen(true);
                        }
                      }}
                      sx={{
                        width: CONTACT_PROFILE_AVATAR_SIZE,
                        height: CONTACT_PROFILE_AVATAR_SIZE,
                        cursor: avatarUrl ? 'pointer' : 'default',
                        boxShadow: 2,
                      }}
                    />
                  </AvatarGameRankMedal>
                </Box>

                <Box sx={getContactProfileIdentitySx()}>
                  <Typography component="h2" sx={getContactProfileNameSx()}>
                    {fullName}
                  </Typography>

                  {displayProfile.username && (
                    <Typography sx={getContactProfileMetaSx()}>@{displayProfile.username}</Typography>
                  )}

                  {displayProfile.email && (
                    <Typography sx={getContactProfileMetaSx()} noWrap>
                      {displayProfile.email}
                    </Typography>
                  )}

                  {birthdayLabel && (
                    <Box sx={getContactProfileBirthdaySx(theme)}>
                      <CakeOutlinedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                        {birthdayLabel}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box sx={getContactProfileBioSx(theme, !displayProfile.bio?.trim())}>
                <Typography variant="body2">{bioText}</Typography>
              </Box>

              {profile?.badges && profile.badges.length > 0 && (
                <Box sx={getContactProfileSectionSx(theme)}>
                  <Typography component="span" sx={getContactProfileSectionTitleSx()}>
                    {t('chat.profile.medals')}
                  </Typography>
                  <GameBadges badges={profile.badges} variant="list" dense />
                </Box>
              )}

              {contactId && (
                <PetSection
                  variant="readonly"
                  userId={contactId}
                  embedded
                  compact
                  onPetSelect={handlePetSelect}
                />
              )}
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
