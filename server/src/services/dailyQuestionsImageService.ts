import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import {
  DAILY_QUESTION_IMAGE_KEYS,
  DAILY_QUESTIONS_IMAGE_FOLDER,
  type DailyQuestionImageKey,
} from '../dailyQuestions/dailyQuestionsImages';

const ASSETS_DIR = path.join(__dirname, '../../assets/daily-questions');

const hasCloudinaryCredentials = (): boolean =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

export const uploadDailyQuestionImage = async (key: DailyQuestionImageKey): Promise<string | null> => {
  const filePath = path.join(ASSETS_DIR, `${key}.jpg`);
  if (!fs.existsSync(filePath)) {
    console.warn(`Файл изображения вопроса дня не найден: ${filePath}`);
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: DAILY_QUESTIONS_IMAGE_FOLDER,
      public_id: key,
      overwrite: true,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Не удалось загрузить изображение «${key}» в Cloudinary:`, error);
    return null;
  }
};

/** Загружает все локальные ассеты вопросов дня на Cloudinary (идемпотентно). */
export const ensureDailyQuestionImagesUploaded = async (): Promise<void> => {
  if (!hasCloudinaryCredentials()) {
    console.warn(
      'Cloudinary не настроен — изображения вопросов дня не загружены (нужны CLOUDINARY_* в .env)'
    );
    return;
  }

  let uploaded = 0;
  for (const key of DAILY_QUESTION_IMAGE_KEYS) {
    const url = await uploadDailyQuestionImage(key);
    if (url) {
      uploaded += 1;
    }
  }

  if (uploaded > 0) {
    console.log(`Изображения вопросов дня на Cloudinary: ${uploaded}/${DAILY_QUESTION_IMAGE_KEYS.length}`);
  }
};
