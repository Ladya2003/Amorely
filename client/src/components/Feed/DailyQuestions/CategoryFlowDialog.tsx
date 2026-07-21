import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ResponsiveDialog from '../../UI/ResponsiveDialog';
import { getAppModalActionsSx } from '../../../theme/modalStyles';
import type { CategoryDetail, DailyQuestion } from './types';
import AnswerInput from './AnswerInput';
import {
  fetchCategoryDetail,
  submitDailyAnswer,
} from '../../../services/dailyQuestionsService';
import { getQuestionProgressSx } from './dailyQuestionsStyles';

interface CategoryFlowDialogProps {
  open: boolean;
  categoryId: string | null;
  onClose: () => void;
  onComplete: () => void;
  onShowResults: (categoryId: string) => void;
}

const CategoryFlowDialog: React.FC<CategoryFlowDialogProps> = ({
  open,
  categoryId,
  onClose,
  onComplete,
  onShowResults,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<CategoryDetail | null>(null);
  const [step, setStep] = useState(0);
  const [textValue, setTextValue] = useState('');
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const redirectToResults = useCallback(
    (id: string) => {
      onClose();
      onComplete();
      onShowResults(id);
    },
    [onClose, onComplete, onShowResults]
  );

  const loadCategory = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      const data = await fetchCategoryDetail(categoryId);
      setDetail(data);

      if (data.results?.userCompleted) {
        redirectToResults(categoryId);
        return;
      }

      const firstUnanswered = data.questions.findIndex(
        (question) =>
          !data.results?.items.some(
            (item) => item.questionId === question.id && item.userAnswer
          )
      );

      if (firstUnanswered === -1) {
        redirectToResults(categoryId);
        return;
      }

      setStep(firstUnanswered);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [categoryId, redirectToResults]);

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
      const updatedState = await submitDailyAnswer(categoryId, currentQuestion.id, value);
      const categoryStatus = updatedState.categories?.find((cat) => cat.id === categoryId);

      if (categoryStatus?.userCompleted) {
        redirectToResults(categoryId);
        return;
      }

      const refreshed = await fetchCategoryDetail(categoryId);
      setDetail(refreshed);

      const nextUnanswered = refreshed.questions.findIndex(
        (question) =>
          !refreshed.results?.items.some(
            (item) => item.questionId === question.id && item.userAnswer
          )
      );

      if (nextUnanswered === -1) {
        redirectToResults(categoryId);
        return;
      }

      setStep(nextUnanswered);
      setTextValue('');
      setSelectedValue(null);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    return (
      <AnswerInput
        type={currentQuestion.type}
        textValue={textValue}
        selectedValue={selectedValue}
        options={currentQuestion.options}
        images={currentQuestion.images}
        onTextChange={setTextValue}
        onSelect={setSelectedValue}
        disabled={submitting}
        autoFocus
      />
    );
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
            <Typography variant="h6" fontWeight={600} mb={2.5} color="text.primary">
              {currentQuestion.text}
            </Typography>
            {renderQuestionInput()}
          </>
        )}
      </DialogContent>
      <DialogActions sx={getAppModalActionsSx(theme)}>
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
