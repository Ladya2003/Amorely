export const DAILY_QUESTIONS_CLOUDINARY_CLOUD = 'dlbrkdlco';
export const DAILY_QUESTIONS_IMAGE_FOLDER = 'daily-questions';

export const DAILY_QUESTION_IMAGE_KEYS = [
  'modern',
  'cozy',
  'cottage',
  'loft',
  'beach',
  'mountain',
  'city',
  'garden',
  'kitchen',
  'bedroom',
  'balcony',
  'fireplace',
] as const;

export type DailyQuestionImageKey = (typeof DAILY_QUESTION_IMAGE_KEYS)[number];

/** Карточки вопросов дня: 400×300, crop fill — как раньше с Unsplash. */
export const buildDailyQuestionImageUrl = (key: DailyQuestionImageKey): string =>
  `https://res.cloudinary.com/${DAILY_QUESTIONS_CLOUDINARY_CLOUD}/image/upload/w_400,h_300,c_fill/${DAILY_QUESTIONS_IMAGE_FOLDER}/${key}.jpg`;

export const DAILY_QUESTION_IMAGES: Record<DailyQuestionImageKey, string> =
  DAILY_QUESTION_IMAGE_KEYS.reduce(
    (acc, key) => {
      acc[key] = buildDailyQuestionImageUrl(key);
      return acc;
    },
    {} as Record<DailyQuestionImageKey, string>
  );
