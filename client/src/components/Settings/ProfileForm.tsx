import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { 
  Box, 
  TextField, 
  Avatar, 
  Typography, 
  IconButton, 
  Alert,
  Grid,
  useTheme,
} from '@mui/material';
import AppDatePicker from '../UI/AppDatePicker';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ImageCropDialog from '../UI/ImageCropDialog';
import ContentViewer from '../Calendar/ContentViewer';
import CustomSnackbar from '../UI/CustomSnackbar';
import DisplayBadgePicker from './DisplayBadgePicker';
import { DATE_INPUT_FORMAT } from '../../localization/calendarHelpers';
import {
  getSettingsAvatarButtonSx,
  getSettingsAvatarWrapSx,
  getSettingsSectionDividerSx,
  getSettingsSectionSavingSx,
  getSettingsSectionTitleSx,
} from './settingsPageStyles';

export interface UserProfile {
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  birthday?: string;
  displayBadgeGameId?: string | null;
  role?: 'user' | 'admin';
}

interface ProfileFormProps {
  user: UserProfile;
  onSave: (userData: FormData) => Promise<void>;
  onBadgePreferenceSaved?: (displayBadgeGameId: string | null) => void;
}

const SAVE_DEBOUNCE_MS = 800;

const parseBirthdayDate = (birthday?: string): Date | null => {
  if (!birthday) return null;
  const date = new Date(birthday);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatBirthdayForApi = (birthday: Date | null): string => {
  if (!birthday) return '';
  return format(birthday, 'yyyy-MM-dd');
};

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSave, onBadgePreferenceSaved }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [username, setUsername] = useState(user.username || '');
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [birthday, setBirthday] = useState<Date | null>(() => parseBirthdayDate(user.birthday));
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.avatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successToastOpen, setSuccessToastOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const isMountedRef = useRef(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBirthday(parseBirthdayDate(user.birthday));
  }, [user.birthday]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(user.avatar);
    }
  }, [user.avatar, avatarFile]);

  const buildFormData = useCallback((avatarOverride?: File | null) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('bio', bio);
    formData.append('birthday', formatBirthdayForApi(birthday));

    const avatarToUpload = avatarOverride !== undefined ? avatarOverride : avatarFile;
    if (avatarToUpload) {
      formData.append('avatar', avatarToUpload);
    }

    return formData;
  }, [username, firstName, lastName, bio, birthday, avatarFile]);

  const isTextDirty = useCallback(() => (
    username !== (user.username || '') ||
    firstName !== (user.firstName || '') ||
    lastName !== (user.lastName || '') ||
    bio !== (user.bio || '') ||
    formatBirthdayForApi(birthday) !== formatBirthdayForApi(parseBirthdayDate(user.birthday))
  ), [username, firstName, lastName, bio, birthday, user]);

  const saveProfile = useCallback(async (avatarOverride?: File | null) => {
    if (isSavingRef.current || !username.trim()) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      await onSave(buildFormData(avatarOverride));
      setAvatarFile(null);
      setSuccessToastOpen(true);
    } catch (saveError) {
      console.error('Ошибка при сохранении профиля:', saveError);
      setError(t('settings.profile.errors.saveFailed'));
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [buildFormData, onSave, username, t]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    if (!isTextDirty()) {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveProfile();
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [username, firstName, lastName, bio, birthday, isTextDirty, saveProfile]);
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('settings.profile.errors.imageRequired'));
      return;
    }

    setPendingAvatarFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropDialogClose = () => {
    setCropDialogOpen(false);
    setCropImageSrc(null);
    setPendingAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarCropped = (file: File) => {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    void saveProfile(file);
  };

  return (
    <Box>
      <Typography component="h2" sx={getSettingsSectionTitleSx()}>
        {t('settings.profile.personalInfo')}
        {isSaving && (
          <Typography component="span" sx={getSettingsSectionSavingSx()}>
            {t('settings.profile.saving')}
          </Typography>
        )}
      </Typography>
      <Box component="hr" sx={getSettingsSectionDividerSx(theme)} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box component="div">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={getSettingsAvatarWrapSx(theme)}>
              <Avatar
                src={avatarPreview}
                alt={username}
                onClick={() => {
                  if (avatarPreview) {
                    setAvatarViewerOpen(true);
                  }
                }}
                sx={{
                  cursor: avatarPreview ? 'pointer' : 'default'
                }}
              />
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
                onClick={handleAvatarClick}
                size="small"
                sx={getSettingsAvatarButtonSx(theme)}
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
              <input
                ref={fileInputRef}
                accept="image/*"
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" align="center">
              {t('settings.profile.avatarHint')}
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={user.email}
                  disabled
                  variant="outlined"
                  helperText={t('settings.profile.emailHelper')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('settings.profile.username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('settings.profile.firstName')}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('settings.profile.lastName')}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                  <AppDatePicker
                    label={t('settings.profile.birthday')}
                    value={birthday}
                    onChange={(newValue) => setBirthday(newValue)}
                    format={DATE_INPUT_FORMAT}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        helperText: t('settings.profile.birthdayHelper'),
                      },
                    }}
                  />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('settings.profile.bio')}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  multiline
                  rows={4}
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DisplayBadgePicker
                  userId={user._id}
                  displayBadgeGameId={user.displayBadgeGameId}
                  onSaved={(displayBadgeGameId) => onBadgePreferenceSaved?.(displayBadgeGameId)}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      <ImageCropDialog
        open={cropDialogOpen}
        imageSrc={cropImageSrc}
        originalFile={pendingAvatarFile}
        onClose={handleCropDialogClose}
        onConfirm={handleAvatarCropped}
        title={t('settings.profile.cropTitle')}
        aspect={1}
      />

      <ContentViewer
        open={avatarViewerOpen}
        onClose={() => setAvatarViewerOpen(false)}
        fullScreen
        content={
          avatarPreview
            ? {
                mediaUrl: avatarPreview,
                resourceType: 'image'
              }
            : null
        }
      />

      <CustomSnackbar
        open={!!error}
        message={error}
        severity="error"
        autoHideDuration={6000}
        onClose={() => setError(null)}
      />

      <CustomSnackbar
        open={successToastOpen}
        message={t('settings.profile.saveSuccess')}
        severity="success"
        onClose={() => setSuccessToastOpen(false)}
      />
    </Box>
  );
};

export default ProfileForm; 