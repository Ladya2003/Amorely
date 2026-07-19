import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ResponsiveDialog from '../../UI/ResponsiveDialog';
import { getAppModalActionsSx } from '../../../theme/modalStyles';
import type { CategoryDetail, DailyQuestion } from './types';
import {
  fetchCategoryDetail,
  submitDailyAnswer,
} from '../../../services/dailyQuestionsService';
import { getImageChoiceSx, getQuestionProgressSx } from './dailyQuestionsStyles';

interface CategoryFlowDialogProps {
  open: boolean;
  categoryId: string | null;
  onClose: () => void;
  onComplete: () => void;
}

const CategoryFlowDialog: React.FC<CategoryFlowDialogProps> = ({
  open,
  categoryId,
  onClose,
  onComplete,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<CategoryDetail | null>(null);
  const [step, setStep] = useState(0);
  const [textValue, setTextValue] = useState('');
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const loadCategory = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      const data = await fetchCategoryDetail(categoryId);
      setDetail(data);

      const firstUnanswered = data.questions.findIndex(
        (_q: unknown, idx: number) => !data.results?.items[idx]?.userAnswer
      );
      setStep(firstUnanswered >= 0 ? firstUnanswered : 0);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    if (open && categoryId) {
      void loadCategory();
    } else {
      setDetail(null);
      setStep(0);
      setTextValue('');
      setSelectedValue(null);
    }
  }, [open, categoryId, loadCategory]);

  const questions = detail?.questions ?? [];
  const currentQuestion: DailyQuestion | undefined = questions[step];
  const progress = questions.length ? ((step + 1) / questions.length) * 100 : 0;

  const handleSubmit = async () => {
    if (!categoryId || !currentQuestion) return;

    let value = '';
    if (currentQuestion.type === 'text') {
      value = textValue.trim();
      if (!value) return;
    } else {
      value = selectedValue ?? '';
      if (!value) return;
    }

    setSubmitting(true);
    try {
      await submitDailyAnswer(categoryId, currentQuestion.id, value);

      if (step + 1 >= questions.length) {
        onComplete();
        onClose();
      } else {
        setStep((s) => s + 1);
        setTextValue('');
        setSelectedValue(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.type === 'text') {
      return (
        <TextField
          fullWidth
          multiline
          minRows={3}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={t('dailyQuestions.textPlaceholder')}
          autoFocus
        />
      );
    }

    if (currentQuestion.type === 'choice' && currentQuestion.options) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {currentQuestion.options.map((opt) => (
            <Button
              key={opt.id}
              variant={selectedValue === opt.id ? 'contained' : 'outlined'}
              onClick={() => setSelectedValue(opt.id)}
              sx={{ textTransform: 'none', justifyContent: 'flex-start', py: 1.25 }}
            >
              {opt.label}
            </Button>
          ))}
        </Box>
      );
    }

    if (currentQuestion.type === 'image' && currentQuestion.images) {
      return (
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {currentQuestion.images.map((img) => (
            <Box
              key={img.id}
              sx={getImageChoiceSx(theme, selectedValue === img.id)}
              onClick={() => setSelectedValue(img.id)}
              role="button"
              tabIndex={0}
            >
              <img src={img.url} alt={img.label} loading="lazy" />
              <Typography variant="caption" display="block" p={0.75} fontWeight={600}>
                {img.label}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }

    return null;
  };

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {detail ? `${detail.emoji} ${detail.title}` : t('dailyQuestions.title')}
      </DialogTitle>
      <DialogContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {!loading && currentQuestion && (
          <>
            <Box sx={getQuestionProgressSx(theme)}>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 4 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t('dailyQuestions.questionOf', { current: step + 1, total: questions.length })}
            </Typography>
            <Typography variant="h6" fontWeight={600} mb={2.5}>
              {currentQuestion.text}
            </Typography>
            {renderQuestionInput()}
          </>
        )}
      </DialogContent>
      <DialogActions sx={getAppModalActionsSx()}>
        <Button onClick={onClose} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={
            submitting ||
            !currentQuestion ||
            (currentQuestion.type === 'text' ? !textValue.trim() : !selectedValue)
          }
        >
          {step + 1 >= questions.length
            ? t('dailyQuestions.finish')
            : t('dailyQuestions.next')}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default CategoryFlowDialog;
