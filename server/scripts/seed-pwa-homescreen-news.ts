import mongoose from 'mongoose';
import dotenv from 'dotenv';
import News from '../src/models/news';

dotenv.config();

const title = 'Добавьте Amorely на главный экран';

const content = `Рекомендуем установить Amorely на домашний экран — интерфейс там удобнее, приложение открывается в один tap, и мы точно не потеряемся друг с другом :)

Ниже пошаговая инструкция для iPhone в Safari. В Chrome, Firefox и на Android шаги похожие: через «Поделиться» или меню браузера выберите «На экран „Домой“» или «Установить приложение».`;

const stepImages = [
  {
    url: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780044177/1_onzh5f.jpg',
    caption: 'Шаг 1. Откройте Amorely в Safari',
  },
  {
    url: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780044177/2_lmqxek.jpg',
    caption: 'Шаг 2. Нажмите «Поделиться»',
  },
  {
    url: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780044177/3_m6y5pm.jpg',
    caption: 'Шаг 3. Выберите «На экран „Домой“»',
  },
];

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/amorely';
  await mongoose.connect(uri);

  const doc = await News.findOneAndUpdate(
    { title },
    {
      title,
      content,
      category: 'update',
      isPublished: true,
      publishDate: new Date(),
      updatedAt: new Date(),
      image: { url: stepImages[0].url },
      images: stepImages,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(doc ? `Новость сохранена: ${doc._id.toString()}` : 'Новость не сохранена');
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
