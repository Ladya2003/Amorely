import React from 'react';
import { Avatar, Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { CategoryResultItem } from './types';
import {
  getResultAnswerBubbleSx,
  getResultAnswerRowSx,
  getResultAvatarSx,
  getResultImageAvatarSx,
  getResultImageAvatarWrapSx,
  getResultImageCardSx,
  getResultImagePairSx,
  getResultImagePhotoSx,
  getResultImagePlaceholderSx,
  getResultMutedTextSx,
  getResultQuestionCardSx,
  getResultQuestionTitleSx,
} from './resultQuestionStyles';

interface ParticipantProfile {
  avatar?: string;
  name: string;
}

interface ResultTextChoiceBlockProps {
  index: number;
  item: CategoryResultItem;
  user: ParticipantProfile;
  partner: ParticipantProfile | null;
}

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const ResultTextChoiceBlock: React.FC<ResultTextChoiceBlockProps> = ({
  index,
  item,
  user,
  partner,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box sx={getResultQuestionCardSx(theme)}>
      <Typography sx={getResultQuestionTitleSx(theme)}>
        {index + 1}. {item.questionText}
      </Typography>

      <Box sx={getResultAnswerRowSx('left')}>
        <Avatar src={user.avatar} sx={getResultAvatarSx()}>
          {getInitials(user.name)}
        </Avatar>
        <Typography component="span" sx={getResultAnswerBubbleSx(theme, 'left')}>
          {item.userAnswerLabel || '—'}
        </Typography>
      </Box>

      {item.partnerAnswerLabel ? (
        <Box sx={getResultAnswerRowSx('right')}>
          <Avatar src={partner?.avatar} sx={getResultAvatarSx()}>
            {getInitials(partner?.name ?? t('dailyQuestions.partnerFallback'))}
          </Avatar>
          <Typography component="span" sx={getResultAnswerBubbleSx(theme, 'right')}>
            {item.partnerAnswerLabel}
          </Typography>
        </Box>
      ) : (
        <Typography
          variant="body2"
          textAlign="right"
          sx={getResultMutedTextSx(theme)}
        >
          {t('dailyQuestions.partnerNoAnswer')}
        </Typography>
      )}
    </Box>
  );
};

interface ResultImageChoiceBlockProps {
  index: number;
  item: CategoryResultItem;
  user: ParticipantProfile;
  partner: ParticipantProfile | null;
}

export const ResultImageChoiceBlock: React.FC<ResultImageChoiceBlockProps> = ({
  index,
  item,
  user,
  partner,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const userImage = item.images?.find((img) => img.id === item.userAnswer);
  const partnerImage = item.images?.find((img) => img.id === item.partnerAnswer);

  const renderCard = (
    profile: ParticipantProfile,
    imageUrl?: string,
    label?: string,
    placeholder?: string
  ) => (
    <Box sx={getResultImageCardSx(theme)}>
      {imageUrl ? (
        <Box
          component="img"
          src={imageUrl}
          alt={label ?? ''}
          sx={getResultImagePhotoSx()}
          loading="lazy"
        />
      ) : (
        <Box sx={getResultImagePlaceholderSx(theme)}>{placeholder}</Box>
      )}
      <Box sx={getResultImageAvatarWrapSx()}>
        <Avatar src={profile.avatar} sx={getResultImageAvatarSx(theme)}>
          {getInitials(profile.name)}
        </Avatar>
      </Box>
    </Box>
  );

  return (
    <Box sx={getResultQuestionCardSx(theme)}>
      <Typography sx={getResultQuestionTitleSx(theme)}>
        {index + 1}. {item.questionText}
      </Typography>

      <Box sx={getResultImagePairSx()}>
        {renderCard(user, userImage?.url, userImage?.label, t('dailyQuestions.noYourAnswer'))}
        {partner
          ? renderCard(
              partner,
              partnerImage?.url,
              partnerImage?.label,
              t('dailyQuestions.partnerNoAnswerShort')
            )
          : renderCard(
              { name: t('dailyQuestions.partnerFallback') },
              undefined,
              undefined,
              t('dailyQuestions.partnerNoAnswerShort')
            )}
      </Box>
    </Box>
  );
};
