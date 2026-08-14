import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../config';

interface AdminIconToggleProps {
  userId: string;
  showAdminIcon?: boolean;
  onSaved: (showAdminIcon: boolean) => void;
}

const AdminIconToggle: React.FC<AdminIconToggleProps> = ({
  userId,
  showAdminIcon = true,
  onSaved,
}) => {
  const { t } = useTranslation();
  const [showIcon, setShowIcon] = useState(showAdminIcon);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setShowIcon(showAdminIcon);
  }, [showAdminIcon]);

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.checked;
    const previousValue = showIcon;

    setShowIcon(nextValue);
    setToggling(true);
    setError(null);
    onSaved(nextValue);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/settings/user/${userId}`,
        { showAdminIcon: nextValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSaved(response.data.user?.showAdminIcon !== false);
    } catch {
      setShowIcon(previousValue);
      onSaved(previousValue);
      setError(t('settings.adminIcon.errors.visibilityFailed'));
    } finally {
      setToggling(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {t('settings.adminIcon.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t('settings.adminIcon.description')}
      </Typography>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showIcon}
            disabled={toggling}
            onChange={handleToggle}
          />
        }
        label={t('settings.adminIcon.show')}
      />
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default AdminIconToggle;
