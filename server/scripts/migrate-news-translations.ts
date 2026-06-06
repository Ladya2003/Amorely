/**
 * Migrates legacy title/content fields into translations.ru.
 * Run: npx ts-node scripts/migrate-news-translations.ts
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import News from '../src/models/news';
import { normalizeNewsTranslations, syncLegacyNewsFields } from '../src/i18n/newsContent';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/amorely';
  await mongoose.connect(uri);

  const items = await News.find();
  let migrated = 0;

  for (const item of items) {
    const translations = normalizeNewsTranslations(item);
    const needsMigration = !item.translations?.ru?.title?.trim() && Boolean(item.title?.trim());

    item.set('translations', translations);
    syncLegacyNewsFields(item);

    if (needsMigration || item.isModified('translations')) {
      await item.save();
      migrated += 1;
      console.log('Migrated:', item._id.toString(), '->', translations.ru?.title);
    }
  }

  console.log(`Done. Processed ${items.length}, migrated ${migrated}.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
