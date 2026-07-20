import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useTranslation } from 'react-i18next';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import type { CategoryResults } from './types';
import AnswerInput from './AnswerInput';
import {
  getSimilarityRingSx,
  getResultItemSx,
} from './dailyQuestionsStyles';

interface CategoryResultsViewProps {
  results: CategoryResults;
  onNotifyPartner: () => void;
  onEditAnswer: (questionId: string, value: string) => Promise<CategoryResults | null>;
  notifyLoading?: boolean;
  notifySent?: boolean;
  readOnly?: boolean;
}

const CategoryResultsView: React.FC<CategoryResultsViewProps> = ({
  results,
  onNotifyPartner,
  onEditAnswer,
  notifyLoading,
  notifySent,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editingItem = results.items.find((item) => item.questionId === editingQuestionId);

  useEffect(() => {
    if (!editingItem) {
      setTextValue('');
      setSelectedValue(null);
      return;
    }

    if (editingItem.questionType === 'text') {
      setTextValue(editingItem.userAnswer);
      setSelectedValue(null);
    } else {
      setSelectedValue(editingItem.userAnswer || null);
      setTextValue('');
    }
  }, [editingItem]);

  const startEditing = (questionId: string) => {
    setEditingQuestionId(questionId);
  };

  const cancelEditing = () => {
    setEditingQuestionId(null);
  };

  const canSaveEdit = () => {
    if (!editingItem) return false;
    if (editingItem.questionType === 'text') {
      return Boolean(textValue.trim());
    }
    return Boolean(selectedValue);
  };

  const hasEditChanges = () => {
    if (!editingItem) return false;
    if (editingItem.questionType === 'text') {
      return textValue.trim() !== editingItem.userAnswer;
    }
    return selectedValue !== editingItem.userAnswer;
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !canSaveEdit()) return;

    const value =
      editingItem.questionType === 'text' ? textValue.trim() : (selectedValue as string);

    setSaving(true);
    try {
      const updated = await onEditAnswer(editingItem.questionId, value);
      if (updated) {
        setEditingQuestionId(null);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {results.bothCompleted && results.similarity !== null && (
        <Box sx={getSimilarityRingSx(theme, results.similarity)}>
          {results.similarity}%
        </Box>
      )}

      {results.bothCompleted && results.similarity !== null && (
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
          {t('dailyQuestions.similarityLabel')}
        </Typography>
      )}

      {!readOnly && !results.partnerCompleted && results.userCompleted && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            {t('dailyQuestions.partnerNotFinished')}
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<NotificationsActiveOutlinedIcon />}
            onClick={onNotifyPartner}
            disabled={notifyLoading || notifySent || saving}
            sx={{ textTransform: 'none' }}
          >
            {notifySent
              ? t('dailyQuestions.notifySent')
              : t('dailyQuestions.notifyPartner')}
          </Button>
        </Box>
      )}

      {results.items.map((item) => {
        const isEditing = editingQuestionId === item.questionId;

        return (
          <Box key={item.questionId} sx={getResultItemSx(theme, item.isMatch)}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 1,
                mb: 1,
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
                {item.questionText}
              </Typography>
              {!readOnly && item.userAnswer && !isEditing && (
                <Button
                  size="small"
                  startIcon={<EditOutlinedIcon fontSize="small" />}
                  onClick={() => startEditing(item.questionId)}
                  disabled={Boolean(editingQuestionId) || saving}
                  sx={{ textTransform: 'none', flexShrink: 0, minWidth: 0 }}
                >
                  {t('dailyQuestions.editAnswer')}
                </Button>
              )}
            </Box>

            {isEditing ? (
              <Box mt={1.5}>
                <AnswerInput
                  type={item.questionType as 'text' | 'choice' | 'image'}
                  textValue={textValue}
                  selectedValue={selectedValue}
                  options={item.options}
                  images={item.images}
                  onTextChange={setTextValue}
                  onSelect={setSelectedValue}
                  disabled={saving}
                  autoFocus
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    onClick={cancelEditing}
                    disabled={saving}
                    sx={{ textTransform: 'none' }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => void handleSaveEdit()}
                    disabled={saving || !canSaveEdit() || !hasEditChanges()}
                    sx={{ textTransform: 'none' }}
                  >
                    {saving ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      t('dailyQuestions.saveAnswer')
                    )}
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" mb={0.5}>
                  {t('dailyQuestions.yourAnswer')}: {item.userAnswerLabel || '—'}
                </Typography>
                {item.partnerAnswerLabel ? (
                  <Typography variant="body2">
                    {t('dailyQuestions.partnerAnswer')}: {item.partnerAnswerLabel}
                    {item.isMatch === true && ' ✓'}
                    {item.isMatch === false && ' ✗'}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    {t('dailyQuestions.partnerNoAnswer')}
                  </Typography>
                )}
              </>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default CategoryResultsView;
