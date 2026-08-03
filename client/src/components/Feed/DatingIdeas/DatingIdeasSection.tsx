import React, { useCallback, useEffect, useState } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchDatingIdeas } from '../../../services/datingIdeasService';
import { PARTNER_CHANGED_EVENT } from '../../../hooks/useRelationship';
import { getDatingIdeasSectionSx } from './datingIdeasStyles';
import CurrencyCoinIcon from '../../Pets/CurrencyCoinIcon';

const DatingIdeasSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [cost, setCost] = useState(1);
  const [hasActive, setHasActive] = useState(false);

  const load = useCallback(async () => {
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
      sx={getDatingIdeasSectionSx(theme)}
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
            {hasActive ? t('datingIdeas.sectionActiveHint') : t('datingIdeas.sectionHint', { cost })}
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
