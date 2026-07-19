import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AppAnnouncement from '../src/models/appAnnouncement';
import { notifyAppAnnouncement } from '../src/services/pushService';

dotenv.config();

const ANNOUNCEMENT_KEY = 'pet-feeding-v1';

const ruTitle = 'Кормление питомцев';
const ruPreview =
  'Новая шкала сытости, кнопка «Покормить» и награда +5 Аморок за полную сытость.';
const ruContent = `У каждого питомца теперь есть сытость. Следите за ней, кормите вовремя — и получайте бонусы!

• Корм — 2 Аморки, +10–20 сытости
• Сытость падает на 2/час
• Полная сытость (100) — +5 Аморок
• На карточке видно настроение: 😾 / 😐 / 😊

Загляните к питомцу на главной!`;

const enTitle = 'Feed your pets';
const enPreview =
  'New satiety stat, Feed button, and +5 AmoreCoins when satiety reaches 100.';
const enContent = `Every pet now has satiety. Keep an eye on it, feed on time — and earn bonuses!

• Food costs 2 AmoreCoins and restores 10–20 satiety
• Satiety drops by 2 per hour
• Full satiety (100) — +5 AmoreCoins
• Mood emoji on the card: 😾 / 😐 / 😊

Visit your pet on the home screen!`;

const pushBodyRu = 'Новое: кормите питомцев и зарабатывайте Аморки!';
const pushBodyEn = 'New: feed your pets and earn AmoreCoins!';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/amorely';
  const shouldSendPush = process.argv.includes('--push');

  await mongoose.connect(uri);

  const existing = await AppAnnouncement.findOne({ key: ANNOUNCEMENT_KEY });
  const doc = await AppAnnouncement.findOneAndUpdate(
    { key: ANNOUNCEMENT_KEY },
    {
      key: ANNOUNCEMENT_KEY,
      translations: {
        ru: { title: ruTitle, preview: ruPreview, content: ruContent },
        en: { title: enTitle, preview: enPreview, content: enContent },
      },
      pushTitle: 'Amorely',
      pushBody: pushBodyRu,
      isActive: true,
      publishedAt: existing?.publishedAt ?? new Date(),
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Объявление сохранено: ${doc._id.toString()} (${ANNOUNCEMENT_KEY})`);

  if (shouldSendPush && !doc.pushSentAt) {
    const result = await notifyAppAnnouncement({
      announcementKey: ANNOUNCEMENT_KEY,
      pushTitle: doc.pushTitle,
      pushBody: doc.pushBody || pushBodyRu,
    });
    doc.pushSentAt = new Date();
    await doc.save();
    console.log(`Push отправлен ${result.sent} пользователям с подпиской`);
  } else if (shouldSendPush && doc.pushSentAt) {
    console.log('Push уже был отправлен ранее. Для повторной отправки сбросьте pushSentAt вручную.');
  } else {
    console.log('Push не отправлялся. Запустите с флагом --push для рассылки.');
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
