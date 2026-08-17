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
import { lighten, type Theme } from '@mui/material/styles';
import { MODAL_TEXT_SECONDARY_LIGHT } from '../../theme/modalStyles';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import CurrencyCoinIcon from './CurrencyCoinIcon';
import {
  CURRENCY_EARN_RULES,
  CURRENCY_GUIDE_SECTIONS,
  type CurrencyGuideSection,
} from '../../config/currencyRewardCatalog';
import { CloseIcon } from '../UI/icons';

const getSectionTitleColor = (theme: Theme) =>
  lighten(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.48 : 0.42);

const getRulePeriodColor = (theme: Theme) =>
  theme.palette.mode === 'light' ? 'rgba(255, 236, 242, 0.62)' : theme.palette.text.secondary;

const getAmountChipSx = (theme: Theme) => {
  const isDark = theme.palette.mode === 'dark';
  const text = isDark ? '#FFE082' : '#6B4E00';

  return {
    fontWeight: 700,
    flexShrink: 0,
    bgcolor: `${isDark ? 'rgba(255, 213, 79, 0.16)' : 'rgba(255, 243, 196, 0.92)'} !important`,
    color: `${text} !important`,
    border: `1px solid ${isDark ? 'rgba(255, 213, 79, 0.45)' : 'rgba(180, 130, 0, 0.45)'} !important`,
    '& .MuiChip-label': {
      color: `${text} !important`,
    },
  };
};

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
          sx={(theme) => ({
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 1,
            px: 0.5,
            pb: 1,
            typography: 'caption',
            fontWeight: 700,
            color:
              theme.palette.mode === 'light'
                ? MODAL_TEXT_SECONDARY_LIGHT
                : theme.palette.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          })}
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
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={(theme) => ({
                  mb: 1,
                  color: `${getSectionTitleColor(theme)} !important`,
                })}
              >
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
                      <Typography
                        variant="caption"
                        display="block"
                        sx={(theme) => ({
                          mt: 0.35,
                          color: `${getRulePeriodColor(theme)} !important`,
                        })}
                      >
                        {t(`pets.currencyGuide.rules.${rule.id}.period`)}
                      </Typography>
                    </Box>
                    <Chip
                      label={t('pets.currencyGuide.amount', { amount: rule.amount })}
                      size="small"
                      sx={getAmountChipSx}
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
