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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { DATE_INPUT_FORMAT, getDateFnsLocale } from '../../localization/calendarHelpers';
import { EMPTY_EVENT_FILTER, type EventFilter } from './eventFilterUtils';

interface EventFilterDialogProps {
  open: boolean;
  onClose: () => void;
  filter: EventFilter;
  onApply: (filter: EventFilter) => void;
}

const EventFilterDialog: React.FC<EventFilterDialogProps> = ({
  open,
  onClose,
  filter,
  onApply
}) => {
  const { t, i18n } = useTranslation();
  const [draft, setDraft] = useState<EventFilter>(filter);

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
    setDraft(EMPTY_EVENT_FILTER);
  };

  const renderClearButton = (onClear: () => void, visible: boolean) =>
    visible ? (
      <IconButton
        size="small"
        aria-label={t('calendar.filter.clearField')}
        onClick={onClear}
        sx={{ flexShrink: 0 }}
      >
        <ClearIcon fontSize="small" />
      </IconButton>
    ) : null;

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('calendar.filter.title')}</DialogTitle>
      <DialogContent>
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={getDateFnsLocale(i18n.language)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, mb: 2 }}>
            <DatePicker
              label={t('calendar.filter.dateFrom')}
              value={draft.dateFrom}
              onChange={(date) => setDraft((prev) => ({ ...prev, dateFrom: date }))}
              format={DATE_INPUT_FORMAT}
              sx={{ flex: 1 }}
              slotProps={{
                textField: {
                  fullWidth: true
                }
              }}
            />
            {renderClearButton(
              () => setDraft((prev) => ({ ...prev, dateFrom: null })),
              draft.dateFrom !== null
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
            <DatePicker
              label={t('calendar.filter.dateTo')}
              value={draft.dateTo}
              onChange={(date) => setDraft((prev) => ({ ...prev, dateTo: date }))}
              format={DATE_INPUT_FORMAT}
              minDate={draft.dateFrom ?? undefined}
              sx={{ flex: 1 }}
              slotProps={{
                textField: {
                  fullWidth: true
                }
              }}
            />
            {renderClearButton(
              () => setDraft((prev) => ({ ...prev, dateTo: null })),
              draft.dateTo !== null
            )}
          </Box>
        </LocalizationProvider>
        <TextField
          fullWidth
          label={t('calendar.filter.titleLabel')}
          placeholder={t('calendar.filter.titlePlaceholder')}
          value={draft.title}
          onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
          InputProps={{
            endAdornment: draft.title.length > 0 ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label={t('calendar.filter.clearField')}
                  onClick={() => setDraft((prev) => ({ ...prev, title: '' }))}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined
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

export default EventFilterDialog;
