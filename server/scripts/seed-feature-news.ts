/**
 * Ensures feature announcement news exist (daily questions, pets, dating ideas).
 * Also runs automatically on server start.
 * Run: npx ts-node scripts/seed-feature-news.ts
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ensureFeatureNews } from '../src/services/ensureFeatureNews';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/amorely';
  await mongoose.connect(uri);
  await ensureFeatureNews();
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
