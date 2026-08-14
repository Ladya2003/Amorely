import React from 'react';
import { Avatar, Box, Typography, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useTranslation } from 'react-i18next';
import AvatarAdminIcon, { AdminBadgeIcon } from '../../Chat/AvatarAdminIcon';
import { getAdminRequestExampleCardSx } from './adminRequestStyles';

const AVATAR_SIZE = 72;

const RealAvatarFace: React.FC = () => (
  <svg viewBox="0 0 72 72" width={AVATAR_SIZE} height={AVATAR_SIZE} aria-hidden>
    <defs>
      <linearGradient id="admin-request-real-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F4C6B5" />
        <stop offset="100%" stopColor="#E8A890" />
      </linearGradient>
    </defs>
    <rect width="72" height="72" fill="url(#admin-request-real-bg)" />
    <circle cx="36" cy="28" r="13" fill="#F7D7C8" />
    <ellipse cx="36" cy="58" rx="20" ry="16" fill="#5B7C99" />
    <path d="M22 26c3-10 25-12 28 0 1 4-2 8-6 9-8 2-16 1-22-2v-7Z" fill="#3A2A22" />
    <circle cx="31" cy="28" r="1.6" fill="#2C211C" />
    <circle cx="41" cy="28" r="1.6" fill="#2C211C" />
    <path d="M33 34c1.4 1.6 4.6 1.6 6 0" stroke="#C07A68" strokeWidth="1.4" fill="none" strokeLinecap="round" />
  </svg>
);

const FakeAvatarFace: React.FC = () => (
  <svg viewBox="0 0 72 72" width={AVATAR_SIZE} height={AVATAR_SIZE} aria-hidden>
    <defs>
      <linearGradient id="admin-request-fake-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#D7B89A" />
        <stop offset="100%" stopColor="#C49A78" />
      </linearGradient>
    </defs>
    <rect width="72" height="72" fill="url(#admin-request-fake-bg)" />
    <circle cx="36" cy="29" r="13" fill="#E8C8A8" />
    <ellipse cx="36" cy="59" rx="21" ry="16" fill="#6B4F3A" />
    <path d="M20 24c6-11 27-10 31 2 1 4-3 7-8 8-9 2-18 0-23-4v-6Z" fill="#1F1612" />
    <circle cx="31" cy="29" r="1.6" fill="#2C211C" />
    <circle cx="42" cy="29" r="1.6" fill="#2C211C" />
    <path d="M33 35c1.6 1.4 5 1.4 6.4 0" stroke="#A87458" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    {/* Badge painted into the photo itself — inside the circle, slightly off */}
    <g transform="translate(8 46) rotate(-12) scale(0.92)">
      <circle cx="10" cy="10" r="9" fill="#C9A227" />
      <circle cx="10" cy="10" r="9" fill="none" stroke="#F4E4A6" strokeWidth="1.4" />
      <path
        d="M10 4.1 15.1 6.2v4.1c0 3.05-2.2 5.45-5.1 6.2-2.9-.75-5.1-3.15-5.1-6.2V6.2L10 4.1Z"
        fill="#F4E4A6"
      />
      <path
        d="M10 6.15 13.35 7.5v2.55c0 1.95-1.4 3.5-3.35 4.05-1.95-.55-3.35-2.1-3.35-4.05V7.5L10 6.15Z"
        fill="#C9A227"
      />
    </g>
  </svg>
);

const AdminBadgeExamples: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        {t('feed.adminRequest.badgeTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.75 }}>
        {t('feed.adminRequest.badgeText')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.25 }}>
        <Box sx={getAdminRequestExampleCardSx(theme, 'real')}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <AvatarAdminIcon show avatarSize={AVATAR_SIZE}>
              <Avatar
                sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, bgcolor: 'transparent' }}
                alt={t('feed.adminRequest.realName')}
              >
                <RealAvatarFace />
              </Avatar>
            </AvatarAdminIcon>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.25 }}>
            <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="caption" fontWeight={700} color="success.main">
              {t('feed.adminRequest.realLabel')}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block">
            {t('feed.adminRequest.realHint')}
          </Typography>
        </Box>

        <Box sx={getAdminRequestExampleCardSx(theme, 'fake')}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Avatar
              sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, bgcolor: 'transparent' }}
              alt={t('feed.adminRequest.fakeName')}
            >
              <FakeAvatarFace />
            </Avatar>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.25 }}>
            <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />
            <Typography variant="caption" fontWeight={700} color="error.main">
              {t('feed.adminRequest.fakeLabel')}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block">
            {t('feed.adminRequest.fakeHint')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5, justifyContent: 'center' }}>
        <AdminBadgeIcon size={16} />
        <Typography variant="caption" color="text.secondary">
          {t('feed.adminRequest.badgeLegend')}
        </Typography>
      </Box>
    </Box>
  );
};

export default AdminBadgeExamples;
