/**
 * Загружает локальные ассеты вопросов дня на Cloudinary.
 *
 * Использование:
 *   npm run upload:daily-questions-images
 *
 * Требует CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET в server/.env
 */

import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import {
  DAILY_QUESTION_IMAGE_KEYS,
  buildDailyQuestionImageUrl,
} from '../src/dailyQuestions/dailyQuestionsImages';
import { uploadDailyQuestionImage } from '../src/services/dailyQuestionsImageService';

dotenv.config();

const main = async (): Promise<void> => {
  const uploadRequired = process.env.UPLOAD_REQUIRED === 'true';

  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const message =
      'Cloudinary не настроен — загрузка изображений вопросов дня пропущена (нужны CLOUDINARY_* в .env)';
    if (uploadRequired) {
      console.error(message);
      process.exit(1);
    }
    console.warn(message);
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dlbrkdlco',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log('Загрузка изображений вопросов дня на Cloudinary...\n');

  for (const key of DAILY_QUESTION_IMAGE_KEYS) {
    const url = await uploadDailyQuestionImage(key);
    if (url) {
      console.log(`✓ ${key}`);
      console.log(`  ${buildDailyQuestionImageUrl(key)}\n`);
    } else {
      console.error(`✗ ${key} — ошибка загрузки\n`);
      process.exitCode = 1;
    }
  }

  console.log('Готово.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
