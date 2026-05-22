import React, { useState, useRef, useEffect } from 'react';
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
import CustomSnackbar from '../UI/CustomSnackbar';

export interface UserProfile {
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  birthday?: string;
}

interface ProfileFormProps {
  user: UserProfile;
  onSave: (userData: FormData) => Promise<void>;
  isLoading: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSave, isLoading }) => {
  const [username, setUsername] = useState(user.username || '');
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [birthday, setBirthday] = useState(() => {
    if (user.birthday) {
      // Преобразуем ISO дату в формат YYYY-MM-DD для HTML input
      const date = new Date(user.birthday);
      return date.toISOString().split('T')[0];
    }
    return '';
  });
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.avatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successToastOpen, setSuccessToastOpen] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обновляем birthday при изменении user
  useEffect(() => {
    if (user.birthday) {
      const date = new Date(user.birthday);
      setBirthday(date.toISOString().split('T')[0]);
    } else {
      setBirthday('');
    }
  }, [user.birthday]);


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
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('bio', bio);
      formData.append('birthday', birthday);
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      await onSave(formData);
      setSuccessToastOpen(true);
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error);
      setError('Не удалось сохранить изменения. Пожалуйста, попробуйте еще раз.');
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 0 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 400 }}>
        Личная информация
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <form id="profile-settings-form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar
                src={avatarPreview}
                alt={username}
                sx={{ width: 120, height: 120 }}
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
              Нажмите на иконку камеры, чтобы загрузить новое фото
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
            </Grid>
          </Grid>
        </Grid>
      </form>

      <ImageCropDialog
        open={cropDialogOpen}
        imageSrc={cropImageSrc}
        originalFile={pendingAvatarFile}
        onClose={handleCropDialogClose}
        onConfirm={handleAvatarCropped}
        title="Обрезать фото профиля"
        aspect={1}
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