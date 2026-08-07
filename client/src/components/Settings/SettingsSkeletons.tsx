import React from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';
import {
  SETTINGS_ACTION_RADIUS,
  SETTINGS_INNER_RADIUS,
  getSettingsAvatarWrapSx,
  getSettingsListItemSx,
  getSettingsSectionDividerSx,
} from './settingsPageStyles';

const FieldSkeleton: React.FC<{ labelWidth?: number | string }> = ({ labelWidth = 96 }) => (
  <Box sx={{ mb: 2 }}>
    <Skeleton variant="text" animation="wave" width={labelWidth} height={18} sx={{ mb: 0.75 }} />
    <Skeleton
      variant="rounded"
      animation="wave"
      height={48}
      sx={{ borderRadius: `${SETTINGS_INNER_RADIUS}px` }}
    />
  </Box>
);

/** Скелетон вкладки «Профиль» */
export const ProfileSettingsSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box aria-busy="true">
      <Skeleton variant="text" animation="wave" width={120} height={28} sx={{ mb: 0.5 }} />
      <Box component="hr" sx={getSettingsSectionDividerSx(theme)} />
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Box sx={getSettingsAvatarWrapSx(theme)}>
          <Skeleton variant="circular" animation="wave" width={120} height={120} />
        </Box>
      </Box>
      <FieldSkeleton labelWidth={80} />
      <FieldSkeleton labelWidth={100} />
      <FieldSkeleton labelWidth={90} />
      <FieldSkeleton labelWidth={72} />
      <Skeleton variant="text" animation="wave" width={72} height={18} sx={{ mb: 0.75 }} />
      <Skeleton
        variant="rounded"
        animation="wave"
        height={96}
        sx={{ borderRadius: `${SETTINGS_INNER_RADIUS}px` }}
      />
    </Box>
  );
};

/** Скелетон блока партнёра */
export const PartnerFormSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box aria-busy="true" sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1 }}>
        <Skeleton variant="text" animation="wave" width={140} height={28} />
        <Skeleton
          variant="rounded"
          animation="wave"
          width={140}
          height={40}
          sx={{ borderRadius: '19px' }}
        />
      </Box>
      <Box component="hr" sx={getSettingsSectionDividerSx(theme)} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Skeleton variant="circular" animation="wave" width={56} height={56} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton variant="text" animation="wave" width="55%" height={22} />
          <Skeleton variant="text" animation="wave" width="40%" height={18} />
        </Box>
      </Box>
      <FieldSkeleton labelWidth={120} />
    </Box>
  );
};

/** Скелетон списка заявок партнёра */
export const PartnerRequestsSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box aria-busy="true">
      {[0, 1].map((key) => (
        <Box key={key} sx={getSettingsListItemSx(theme)}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
            <Skeleton variant="circular" animation="wave" width={44} height={44} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton variant="text" animation="wave" width="50%" height={20} />
              <Skeleton variant="text" animation="wave" width="35%" height={16} />
            </Box>
          </Box>
          <Skeleton
            variant="rounded"
            animation="wave"
            width={88}
            height={32}
            sx={{ borderRadius: `${SETTINGS_ACTION_RADIUS}px` }}
          />
        </Box>
      ))}
    </Box>
  );
};

/** Скелетон вкладки «Тема» */
export const ThemeSettingsSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box aria-busy="true">
      <Skeleton variant="text" animation="wave" width={100} height={28} sx={{ mb: 0.5 }} />
      <Box component="hr" sx={getSettingsSectionDividerSx(theme)} />
      <Skeleton variant="text" animation="wave" width={80} height={20} sx={{ mb: 1 }} />
      <Skeleton
        variant="rounded"
        animation="wave"
        height={48}
        sx={{ borderRadius: `${SETTINGS_INNER_RADIUS}px`, mb: 1 }}
      />
      <Skeleton variant="text" animation="wave" width="70%" height={18} sx={{ mb: 2 }} />
      <Box component="hr" sx={getSettingsSectionDividerSx(theme)} />
      <Skeleton variant="text" animation="wave" width={100} height={20} sx={{ mb: 1 }} />
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} variant="text" animation="wave" width="45%" height={36} sx={{ mb: 0.5 }} />
      ))}
      <Box component="hr" sx={getSettingsSectionDividerSx(theme)} />
      <Skeleton variant="text" animation="wave" width={120} height={20} sx={{ mb: 1.5 }} />
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <Skeleton key={key} variant="circular" animation="wave" width={48} height={48} />
        ))}
      </Box>
    </Box>
  );
};

/** Скелетон вкладки «Уведомления» */
export const NotificationSettingsSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box aria-busy="true">
      <Skeleton variant="text" animation="wave" width={140} height={28} sx={{ mb: 0.5 }} />
      <Box component="hr" sx={getSettingsSectionDividerSx(theme)} />
      <Skeleton variant="text" animation="wave" width={100} height={20} sx={{ mb: 1.5 }} />
      {[0, 1, 2, 3, 4].map((key) => (
        <Box
          key={key}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            py: 1.25,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
            <Skeleton variant="circular" animation="wave" width={28} height={28} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" animation="wave" width="55%" height={20} />
              <Skeleton variant="text" animation="wave" width="75%" height={16} />
            </Box>
          </Box>
          <Skeleton
            variant="rounded"
            animation="wave"
            width={42}
            height={26}
            sx={{ borderRadius: 999 }}
          />
        </Box>
      ))}
    </Box>
  );
};

/** Скелетон вкладки «Безопасность» */
export const SecuritySettingsSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box aria-busy="true">
      <Skeleton variant="text" animation="wave" width={130} height={28} sx={{ mb: 0.5 }} />
      <Box component="hr" sx={getSettingsSectionDividerSx(theme)} />
      <FieldSkeleton labelWidth={140} />
      <FieldSkeleton labelWidth={120} />
      <FieldSkeleton labelWidth={160} />
      <Skeleton
        variant="rounded"
        animation="wave"
        width={200}
        height={42}
        sx={{ borderRadius: '19px', mt: 1 }}
      />
    </Box>
  );
};
