import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { startOfMonth } from 'date-fns';
import ResponsiveDialog from '../UI/ResponsiveDialog';

interface MonthYearPickerDialogProps {
  open: boolean;
  onClose: () => void;
  value: Date;
  onChange: (date: Date) => void;
}

const MonthYearPickerDialog: React.FC<MonthYearPickerDialogProps> = ({
  open,
  onClose,
  value,
  onChange
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  const handleDraftChange = (date: Date | null) => {
    if (!date) {
      return;
    }

    setDraft(startOfMonth(date));
  };

  const handleReset = () => {
    setDraft(startOfMonth(new Date()));
  };

  const handleApply = () => {
    onChange(draft);
    onClose();
  };

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('calendar.monthPicker.title')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', justifyContent: 'center', pt: 0, pb: 1 }}>
        <DateCalendar
            value={draft}
            onChange={handleDraftChange}
            views={['year', 'month']}
            openTo="month"
          />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose}>{t('calendar.monthPicker.close')}</Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleReset}>{t('calendar.monthPicker.reset')}</Button>
          <Button onClick={handleApply} variant="contained">
            {t('calendar.monthPicker.apply')}
          </Button>
        </Box>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default MonthYearPickerDialog;
