import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useTranslation } from 'react-i18next';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import { useAuth } from '../../../contexts/AuthContext';
import { useRelationship } from '../../../hooks/useRelationship';
import type { CategoryResults } from './types';
import AnswerInput from './AnswerInput';
import { ResultImageChoiceBlock, ResultTextChoiceBlock } from './ResultQuestionBlocks';
import { getSimilarityRingSx } from './dailyQuestionsStyles';
import { getResultQuestionCardSx, getResultQuestionTitleSx, getResultEditButtonSx } from './resultQuestionStyles';

interface CategoryResultsViewProps {
  results: CategoryResults;
  onNotifyPartner: () => void;
  onEditAnswer: (questionId: string, value: string) => Promise<CategoryResults | null>;
  notifyLoading?: boolean;
  notifySent?: boolean;
  readOnly?: boolean;
}

const getDisplayName = (firstName?: string, username?: string, fallback = '') =>
  firstName?.trim() || username?.trim() || fallback;

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
  const { user } = useAuth();
  const { partner } = useRelationship();
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editingItem = results.items.find((item) => item.questionId === editingQuestionId);

  const userProfile = {
    avatar: user?.avatar,
    name: getDisplayName(user?.firstName, user?.username, t('dailyQuestions.youFallback')),
  };

  const partnerProfile = partner
    ? {
        avatar: partner.avatar,
        name: getDisplayName(partner.firstName, partner.username, t('dailyQuestions.partnerFallback')),
      }
    : null;

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
          <Typography variant="body2" sx={{ color: 'text.secondary' }} mb={1.5}>
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

      {results.items.map((item, index) => {
        const isEditing = editingQuestionId === item.questionId;
        const isImage = item.questionType === 'image';

        if (isEditing) {
          return (
            <Box key={item.questionId} sx={getResultQuestionCardSx(theme)}>
              <Typography sx={getResultQuestionTitleSx(theme)}>
                {index + 1}. {item.questionText}
              </Typography>
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
                  onClick={() => setEditingQuestionId(null)}
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
          );
        }

        return (
          <Box key={item.questionId} sx={{ position: 'relative' }}>
            {!readOnly && item.userAnswer && (
              <IconButton
                size="small"
                onClick={() => setEditingQuestionId(item.questionId)}
                disabled={Boolean(editingQuestionId) || saving}
                sx={getResultEditButtonSx(theme)}
                aria-label={t('dailyQuestions.editAnswer')}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            )}

            {isImage ? (
              <ResultImageChoiceBlock
                index={index}
                item={item}
                user={userProfile}
                partner={partnerProfile}
              />
            ) : (
              <ResultTextChoiceBlock
                index={index}
                item={item}
                user={userProfile}
                partner={partnerProfile}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default CategoryResultsView;
