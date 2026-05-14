import mongoose from 'mongoose';

const encryptedKeyBackupSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceId: { type: String, required: true },
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    salt: { type: String, required: true },
    kdf: {
      name: { type: String, required: true, default: 'PBKDF2' },
      iterations: { type: Number, required: true, default: 250000 },
      hash: { type: String, required: true, default: 'SHA-256' }
    },
    version: { type: Number, required: true, default: 1 }
  },
  { timestamps: true }
);

encryptedKeyBackupSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export default mongoose.model('EncryptedKeyBackup', encryptedKeyBackupSchema);
