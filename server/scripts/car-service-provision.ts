import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { emptyWorkspace } from '../src/carService/domain';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
async function main(): Promise<void> {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured.');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db!, collection = db.collection('car_service_access');
  const exists = await collection.findOne({ _id: 'single-station-demo' } as never);
  if (exists) console.log('Car service admin already exists; credentials unchanged.');
  else {
    const password = crypto.randomBytes(18).toString('base64url');
    const passwordHash = await bcrypt.hash(password, 12), sessionSecret = crypto.randomBytes(48).toString('base64url');
    const output = path.resolve(__dirname, '../../../car-service/MVP-access.local.txt');
    fs.writeFileSync(output, 'Смена — доступ к демонстрационной админке\n\nКабинет: https://ladya2003.github.io/car-service/admin/\nПароль: ' + password + '\n\nЛокально: http://127.0.0.1:4175/car-service/admin/\nНе публикуйте этот файл и не добавляйте в git.\n', 'utf8');
    await collection.insertOne({ _id: 'single-station-demo', passwordHash, sessionSecret } as never);
    console.log('Admin provisioned. Credentials saved to ignored MVP-access.local.txt.');
  }
  await db.collection('car_service_workspace').updateOne({ _id: 'single-station-demo' } as never, { $setOnInsert: { _id: 'single-station-demo', ...emptyWorkspace() } }, { upsert: true });
  await mongoose.disconnect();
}
main().catch(() => { console.error('Car service provisioning failed. No secrets logged.'); process.exitCode = 1; void mongoose.disconnect(); });
