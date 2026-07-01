import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { EMPTY_PLAN_FILTER, type PlanFilter } from './planFilterUtils';

interface PlanFilterDialogProps {
  open: boolean;
  onClose: () => void;
  filter: PlanFilter;
  onApply: (filter: PlanFilter) => void;
}

const PlanFilterDialog: React.FC<PlanFilterDialogProps> = ({
  open,
  onClose,
  filter,
  onApply
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<PlanFilter>(filter);

  useEffect(() => {
    if (open) {
      setDraft(filter);
    }
  }, [open, filter]);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleClear = () => {
    setDraft(EMPTY_PLAN_FILTER);
  };

  const renderTextFieldClearAdornment = (onClear: () => void, visible: boolean) =>
    visible ? (
      <InputAdornment position="end">
        <IconButton
          size="small"
          aria-label={t('calendar.filter.clearField')}
          onClick={onClear}
          edge="end"
        >
          <ClearIcon fontSize="small" />
        </IconButton>
      </InputAdornment>
    ) : undefined;

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('calendar.plans.filter.title')}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label={t('calendar.filter.titleLabel')}
          placeholder={t('calendar.filter.titlePlaceholder')}
          value={draft.title}
          onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
          sx={{ mt: 1, mb: 2 }}
          InputProps={{
            endAdornment: renderTextFieldClearAdornment(
              () => setDraft((prev) => ({ ...prev, title: '' })),
              draft.title.length > 0
            )
          }}
        />
        <TextField
          fullWidth
          label={t('calendar.plans.filter.descriptionLabel')}
          placeholder={t('calendar.plans.filter.descriptionPlaceholder')}
          value={draft.description}
          onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
          InputProps={{
            endAdornment: renderTextFieldClearAdornment(
              () => setDraft((prev) => ({ ...prev, description: '' })),
              draft.description.length > 0
            )
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button onClick={handleClear}>
          {t('calendar.filter.clear')}
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose}>{t('calendar.common.cancel')}</Button>
          <Button onClick={handleApply} variant="contained">
            {t('calendar.filter.apply')}
          </Button>
        </Box>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default PlanFilterDialog;
