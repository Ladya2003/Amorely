import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Chip,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import CurrencyCoinIcon from './CurrencyCoinIcon';
import {
  CURRENCY_EARN_RULES,
  CURRENCY_GUIDE_SECTIONS,
  type CurrencyGuideSection,
} from '../../config/currencyRewardCatalog';

interface CurrencyGuideDialogProps {
  open: boolean;
  onClose: () => void;
}

const CurrencyGuideDialog: React.FC<CurrencyGuideDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation();

  const rulesBySection = CURRENCY_GUIDE_SECTIONS.reduce<Record<CurrencyGuideSection, typeof CURRENCY_EARN_RULES>>(
    (acc, section) => {
      acc[section] = CURRENCY_EARN_RULES.filter((rule) => rule.section === section);
      return acc;
    },
    {} as Record<CurrencyGuideSection, typeof CURRENCY_EARN_RULES>
  );

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pr: 6 }}>
        <CurrencyCoinIcon size={32} sx={{ mt: 0.25 }} />
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.3}>
            {t('pets.currencyGuide.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('pets.currencyGuide.subtitle')}
          </Typography>
        </Box>
        <IconButton
          aria-label={t('pets.currencyGuide.close')}
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 2, py: 1.5 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 1,
            px: 0.5,
            pb: 1,
            typography: 'caption',
            fontWeight: 700,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <span>{t('pets.currencyGuide.columns.action')}</span>
          <span>{t('pets.currencyGuide.columns.amount')}</span>
        </Box>

        {CURRENCY_GUIDE_SECTIONS.map((section, sectionIndex) => {
          const rules = rulesBySection[section];
          if (rules.length === 0) {
            return null;
          }

          return (
            <Box key={section} sx={{ mb: sectionIndex < CURRENCY_GUIDE_SECTIONS.length - 1 ? 2 : 0 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'primary.main' }}>
                {t(`pets.currencyGuide.sections.${section}`)}
              </Typography>

              {rules.map((rule, ruleIndex) => (
                <Box key={rule.id}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 1.5,
                      alignItems: 'start',
                      py: 1.25,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {t(`pets.currencyGuide.rules.${rule.id}.action`)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.35 }}>
                        {t(`pets.currencyGuide.rules.${rule.id}.period`)}
                      </Typography>
                    </Box>
                    <Chip
                      label={t('pets.currencyGuide.amount', { amount: rule.amount })}
                      size="small"
                      sx={(theme) => ({
                        fontWeight: 700,
                        bgcolor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 213, 79, 0.16)'
                            : '#FFF3C4',
                        color:
                          theme.palette.mode === 'dark' ? '#FFE082' : '#6B4E00',
                        border: `1px solid ${
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 213, 79, 0.45)'
                            : 'rgba(180, 130, 0, 0.45)'
                        }`,
                        flexShrink: 0,
                        '& .MuiChip-label': {
                          color: theme.palette.mode === 'dark' ? '#FFE082' : '#6B4E00',
                        },
                      })}
                    />
                  </Box>
                  {ruleIndex < rules.length - 1 && <Divider />}
                </Box>
              ))}

              {sectionIndex < CURRENCY_GUIDE_SECTIONS.length - 1 && <Divider sx={{ mt: 1.5 }} />}
            </Box>
          );
        })}
      </DialogContent>
    </ResponsiveDialog>
  );
};

export default CurrencyGuideDialog;
