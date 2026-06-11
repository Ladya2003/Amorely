import mongoose from 'mongoose';
import EncryptedKeyBackup from '../models/encryptedKeyBackup';

export async function hasCryptoBackup(userId: mongoose.Types.ObjectId | string): Promise<boolean> {
  const exists = await EncryptedKeyBackup.exists({
    userId: new mongoose.Types.ObjectId(userId.toString())
  });
  return !!exists;
}
