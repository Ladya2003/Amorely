import mongoose from 'mongoose';
import dotenv from 'dotenv';
import News from '../src/models/news';

dotenv.config();

const title = 'Игры для пар уже в Amorely!';

const content = `Мы добавили раздел «Игры» в чате — четыре активности, которые можно проходить вместе с партнёром, зарабатывать очки и попадать в рейтинг пар.

• Тыкалка — жмите на блок вместе и проходите раунды
• Угадай локацию — отметьте на карте, где находится место на фото
• Угадай рисунок — один рисует, другой угадывает
• Своя игра — поле с категориями и вопросами, как в телевизионной викторине

Откройте Чат → вкладку «Игры» и выберите, с чего начать!`;

const screenshotUrl =
  'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780044769/Screenshot_1%D0%B0%D1%80%D0%BF%D1%80%D0%B0%D0%BF%D1%80_adximn.png';

const images = [
  {
    url: screenshotUrl,
    caption: 'Четыре игры в разделе «Игры»',
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
      category: 'announcement',
      isPublished: true,
      publishDate: new Date(),
      updatedAt: new Date(),
      image: { url: screenshotUrl },
      images,
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
