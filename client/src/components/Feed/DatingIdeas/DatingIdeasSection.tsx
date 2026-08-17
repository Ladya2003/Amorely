import React, { useCallback, useEffect, useState } from 'react';
import { Box, Paper, Skeleton, Typography, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchDatingIdeas } from '../../../services/datingIdeasService';
import { PARTNER_CHANGED_EVENT } from '../../../hooks/useRelationship';
import { usePartnerId } from '../../../hooks/usePartnerId';
import { getDatingIdeasSectionSx } from './datingIdeasStyles';
import CurrencyCoinIcon from '../../Pets/CurrencyCoinIcon';
import { AutoAwesomeIcon, ChevronRightIcon } from '../../UI/icons';

const DatingIdeasSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const partnerId = usePartnerId();
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [cost, setCost] = useState(100);
  const [hasActive, setHasActive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDatingIdeas(i18n.language);
      if (!data.hasPartner) {
        setVisible(false);
        return;
      }
      setVisible(true);
      setCost(data.cost ?? 1);
      setHasActive(Boolean(data.active));
    } catch {
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }, [i18n.language]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onPartnerChanged = () => {
      void load();
    };
    window.addEventListener(PARTNER_CHANGED_EVENT, onPartnerChanged);
    return () => window.removeEventListener(PARTNER_CHANGED_EVENT, onPartnerChanged);
  }, [load]);

  if (loading) {
    // Без партнёра секция скрыта — не резервируем место, чтобы не прыгала вёрстка
    if (!partnerId) {
      return null;
    }

    return (
      <Paper
        elevation={0}
        sx={{
          ...getDatingIdeasSectionSx(theme),
          cursor: 'default',
          '&:hover': { transform: 'none' },
        }}
        aria-busy="true"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Skeleton variant="rounded" width={48} height={48} animation="wave" sx={{ borderRadius: '16px', flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="45%" height={28} animation="wave" />
            <Skeleton variant="text" width="70%" height={20} animation="wave" sx={{ mt: 0.35 }} />
          </Box>
          <Skeleton variant="rounded" width={24} height={24} animation="wave" sx={{ flexShrink: 0 }} />
        </Box>
      </Paper>
    );
  }

  if (!visible) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      role="button"
      tabIndex={0}
      onClick={() => navigate('/dating-ideas')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate('/dating-ideas');
        }
      }}
      sx={{
        ...getDatingIdeasSectionSx(theme),
        cursor: 'pointer',
      }}
      aria-label={t('datingIdeas.sectionAria')}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: (tTheme) =>
              tTheme.palette.mode === 'light'
                ? 'rgba(255,255,255,0.55)'
                : 'rgba(0,0,0,0.22)',
            color: 'primary.main',
          }}
        >
          <AutoAwesomeIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.25 }}>
            {t('datingIdeas.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            {hasActive ? t('datingIdeas.sectionActiveHint') : t('datingIdeas.sectionHint')}
          </Typography>
          {!hasActive && (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
              <CurrencyCoinIcon size={16} />
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                {t('datingIdeas.costLabel', { cost })}
              </Typography>
            </Box>
          )}
        </Box>
        <ChevronRightIcon color="action" />
      </Box>
    </Paper>
  );
};

export default DatingIdeasSection;
