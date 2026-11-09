import mongoose from 'mongoose';
interface AdminAccess { passwordHash: string; sessionSecret: string; }
const schema = new mongoose.Schema({ _id: { type: String, required: true }, passwordHash: { type: String, required: true }, sessionSecret: { type: String, required: true } }, { collection: 'car_service_access', versionKey: false, bufferCommands: false });
const Access = mongoose.models.CarServiceAccess || mongoose.model('CarServiceAccess', schema);
let cached: { value: AdminAccess; until: number } | null = null;
export async function adminAccess(): Promise<AdminAccess | null> {
  if (process.env.CAR_SERVICE_ADMIN_PASSWORD_HASH && (process.env.CAR_SERVICE_SESSION_SECRET || '').length >= 32) return { passwordHash: process.env.CAR_SERVICE_ADMIN_PASSWORD_HASH, sessionSecret: process.env.CAR_SERVICE_SESSION_SECRET! };
  if (cached && cached.until > Date.now()) return cached.value;
  if (mongoose.connection.readyState !== 1) return null;
  const raw = await Access.findById('single-station-demo').lean() as unknown as AdminAccess | null;
  if (!raw || raw.sessionSecret.length < 32) return null;
  cached = { value: { passwordHash: raw.passwordHash, sessionSecret: raw.sessionSecret }, until: Date.now() + 60000 };
  return cached.value;
}
