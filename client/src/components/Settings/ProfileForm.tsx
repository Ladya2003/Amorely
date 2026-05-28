import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Box, 
  TextField, 
  Avatar, 
  Typography, 
  IconButton, 
  Paper,
  Divider,
  Alert,
  Grid,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ImageCropDialog from '../UI/ImageCropDialog';
import ContentViewer from '../Calendar/ContentViewer';
import CustomSnackbar from '../UI/CustomSnackbar';
import DisplayBadgePicker from './DisplayBadgePicker';

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
}

interface ProfileFormProps {
  user: UserProfile;
  onSave: (userData: FormData) => Promise<void>;
  onBadgePreferenceSaved?: (displayBadgeGameId: string | null) => void;
}

const SAVE_DEBOUNCE_MS = 800;

const formatBirthdayValue = (birthday?: string) => {
  if (!birthday) return '';
  return new Date(birthday).toISOString().split('T')[0];
};

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSave, onBadgePreferenceSaved }) => {
  const [username, setUsername] = useState(user.username || '');
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [birthday, setBirthday] = useState(() => formatBirthdayValue(user.birthday));
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
    setBirthday(formatBirthdayValue(user.birthday));
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
    formData.append('birthday', birthday);

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
    birthday !== formatBirthdayValue(user.birthday)
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
      setError('Не удалось сохранить изменения. Пожалуйста, попробуйте еще раз.');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [buildFormData, onSave, username]);

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
      setError('Выберите файл изображения');
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
    <Paper elevation={0} sx={{ p: 3, mb: 0, bgcolor: 'transparent' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 400 }}>
        Личная информация
        {isSaving && (
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1.5 }}>
            Сохранение...
          </Typography>
        )}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box component="div">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar
                src={avatarPreview}
                alt={username}
                onClick={() => {
                  if (avatarPreview) {
                    setAvatarViewerOpen(true);
                  }
                }}
                sx={{
                  width: 120,
                  height: 120,
                  cursor: avatarPreview ? 'pointer' : 'default'
                }}
              />
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
                onClick={handleAvatarClick}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'background.paper',
                  boxShadow: 1
                }}
              >
                <PhotoCameraIcon />
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
              Нажмите на фото, чтобы открыть его на весь экран. Иконка камеры — для загрузки нового фото
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
                  helperText="Email нельзя изменить"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Логин"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Имя"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Фамилия"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="День рождения"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="Укажите дату рождения для отображения событий в ленте на день рождения"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="О себе"
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
        title="Обрезать фото профиля"
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
        message="Профиль успешно сохранён"
        severity="success"
        onClose={() => setSuccessToastOpen(false)}
      />
    </Paper>
  );
};

export default ProfileForm; 