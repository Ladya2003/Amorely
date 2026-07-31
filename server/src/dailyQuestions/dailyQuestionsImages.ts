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
  'restaurant_candle',
  'picnic_park',
  'camping_tent',
  'roadtrip_car',
  'forest_walk',
  'lake_calm',
  'gym_couple',
  'yoga_calm',
  'cinema_date',
  'couch_movie',
  'train_travel',
  'airplane_window',
  'puppy_cuddle',
  'cat_lap',
  'boho_decor',
  'minimalist_home',
  'coffee_morning',
  'breakfast_bed',
  'rainy_window',
  'snow_couple',
  'sunset_beach',
  'party_friends',
  'wine_evening',
  'polaroid_wall',
  'city_night',
  'art_studio',
  'museum_art',
  'farmers_market',
  'stargazing',
  'vintage_room',
  'flowers_bouquet',
  'handwritten_note',
  'dance_floor',
  'wedding_dance',
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
