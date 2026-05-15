import mongoose from 'mongoose';
import dotenv from 'dotenv';
import News from '../src/models/news';

dotenv.config();

const title = 'Бета-тестирование Amorely — приглашаем попробовать!';
const content = `Amorely сейчас в режиме бета-тестирования. Мы активно дорабатываем приложение и будем рады, если вы его попробуете: чат, календарь, ленту и остальные функции.

Если что-то неудобно, не работает или хочется что-то изменить или добавить — напишите мне в Чат. Меня можно найти через поиск в чате по адресу vlad@gmail.com.

Спасибо, что помогаете нам делать Amorely лучше для пар!`;

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/amorely';
  await mongoose.connect(uri);

  const existing = await News.findOne({ title });
  if (existing) {
    console.log('Новость уже существует:', existing._id.toString());
    await mongoose.disconnect();
    return;
  }

  const doc = await News.create({
    title,
    content,
    category: 'announcement',
    isPublished: true,
    publishDate: new Date(),
  });

  console.log('Новость создана:', doc._id.toString());
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
