import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  CircularProgress,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ViewListIcon from '@mui/icons-material/ViewList';
import { format } from 'date-fns';
import axios from 'axios';
import ResponsiveDialog from '../../../UI/ResponsiveDialog';
import { API_URL } from '../../../../config';
import { formatCalendarDate, formatCalendarMonthYear } from '../../../../localization/calendarHelpers';
import {
  getCalendarGridDayTitleSx,
  getCalendarGridMonthTitleSx,
  getCalendarGridTileSx,
} from '../../../Calendar/calendarPageStyles';
import { ColorTheme } from './ColorPicker';
import { getDaysTogetherActionButtonSx } from '../daysTogetherStyles';

export interface SignatureHistoryItem {
  _id: string;
  userId: string;
  signature: string;
  createdAt: string;
}

interface SignaturesHistoryDialogProps {
  colorTheme: ColorTheme;
  relationshipOwnerId?: string | null;
  currentUserId?: string;
}

interface GroupedMonth {
  monthKey: string;
  monthDate: Date;
  days: Array<{
    date: Date;
    items: SignatureHistoryItem[];
  }>;
}

const groupSignaturesByMonth = (items: SignatureHistoryItem[]): GroupedMonth[] => {
  const byMonth = items.reduce<Record<string, { monthDate: Date; days: Record<string, { date: Date; items: SignatureHistoryItem[] }> }>>(
    (acc, item) => {
      const itemDate = new Date(item.createdAt);
      const monthKey = format(itemDate, 'yyyy-MM');
      const dayKey = format(itemDate, 'yyyy-MM-dd');

      if (!acc[monthKey]) {
        acc[monthKey] = {
          monthDate: new Date(itemDate.getFullYear(), itemDate.getMonth(), 1),
          days: {},
        };
      }

      if (!acc[monthKey].days[dayKey]) {
        acc[monthKey].days[dayKey] = { date: itemDate, items: [] };
      }

      acc[monthKey].days[dayKey].items.push(item);
      return acc;
    },
    {}
  );

  return Object.entries(byMonth)
    .map(([monthKey, monthData]) => ({
      monthKey,
      monthDate: monthData.monthDate,
      days: Object.values(monthData.days).sort((a, b) => b.date.getTime() - a.date.getTime()),
    }))
    .sort((a, b) => b.monthDate.getTime() - a.monthDate.getTime());
};

const SignaturesHistoryDialog: React.FC<SignaturesHistoryDialogProps> = ({
  colorTheme,
  relationshipOwnerId,
  currentUserId,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SignatureHistoryItem[]>([]);
  const [previewItem, setPreviewItem] = useState<SignatureHistoryItem | null>(null);

  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/feed/relationship/signatures`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch signature history:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void fetchHistory();
    }
  }, [open, fetchHistory]);

  const groupedMonths = useMemo(() => groupSignaturesByMonth(items), [items]);

  const getAuthorLabel = (item: SignatureHistoryItem) => {
    const isOwnerEntry = relationshipOwnerId && item.userId === relationshipOwnerId;
    const isCurrentUserEntry = currentUserId && item.userId === currentUserId;

    if (isCurrentUserEntry) {
      return t('feed.signaturesHistory.you');
    }
    if (isOwnerEntry) {
      return t('feed.signatureUser');
    }
    return t('feed.signaturePartner');
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setPreviewItem(null);
  };

  return (
    <>
      <Tooltip title={t('feed.signaturesHistory.openHint')} arrow>
        <IconButton
          onClick={handleOpen}
          aria-label={t('feed.signaturesHistory.openHint')}
          sx={getDaysTogetherActionButtonSx(theme, colorTheme)}
        >
          <ViewListIcon />
        </IconButton>
      </Tooltip>

      <ResponsiveDialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          {t('feed.signaturesHistory.title')}
          <IconButton onClick={handleClose} aria-label={t('feed.signaturesHistory.close')} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : items.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              {t('feed.signaturesHistory.empty')}
            </Typography>
          ) : (
            groupedMonths.map((month) => (
              <Box key={month.monthKey} sx={{ mb: 2 }}>
                <Typography sx={getCalendarGridMonthTitleSx(theme)}>
                  {formatCalendarMonthYear(month.monthDate, i18n.language)}
                </Typography>

                {month.days.map((day) => (
                  <Box key={day.date.toISOString()} sx={{ mb: 3 }}>
                    <Typography sx={getCalendarGridDayTitleSx()}>
                      {formatCalendarDate(day.date, i18n.language)}
                    </Typography>
                    <Grid container spacing={1}>
                      {day.items.map((item) => (
                        <Grid size={{ xs: 4, sm: 3 }} key={item._id}>
                          <Box
                            sx={getCalendarGridTileSx(theme)}
                            onClick={() => setPreviewItem(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setPreviewItem(item);
                              }
                            }}
                            aria-label={getAuthorLabel(item)}
                          >
                            <Box
                              component="img"
                              src={item.signature}
                              alt={getAuthorLabel(item)}
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                bgcolor: 'rgba(0,0,0,0.55)',
                                color: 'white',
                                px: 0.5,
                                py: 0.25,
                              }}
                            >
                              <Typography variant="caption" noWrap sx={{ fontSize: '0.65rem' }}>
                                {getAuthorLabel(item)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}
              </Box>
            ))
          )}
        </DialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        maxWidth="md"
        fullWidth
      >
        {previewItem && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
              <Box>
                <Typography component="span" variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {getAuthorLabel(previewItem)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {formatCalendarDate(new Date(previewItem.createdAt), i18n.language)}
                </Typography>
              </Box>
              <IconButton onClick={() => setPreviewItem(null)} aria-label={t('feed.signaturesHistory.close')} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              <Box
                component="img"
                src={previewItem.signature}
                alt={getAuthorLabel(previewItem)}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  borderRadius: 2,
                  objectFit: 'contain',
                }}
              />
            </DialogContent>
          </>
        )}
      </ResponsiveDialog>
    </>
  );
};

export default SignaturesHistoryDialog;
