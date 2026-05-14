import mongoose from 'mongoose';

const oneTimePreKeySchema = new mongoose.Schema(
  {
    keyId: { type: String, required: true },
    publicKey: { type: String, required: true }
  },
  { _id: false }
);

const cryptoDeviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    identityPublicKey: { type: String, required: true },
    signedPreKey: {
      keyId: { type: String, required: true },
      publicKey: { type: String, required: true },
      signature: { type: String, required: true }
    },
    oneTimePreKeys: { type: [oneTimePreKeySchema], default: [] },
    lastSeen: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

cryptoDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export default mongoose.model('CryptoDevice', cryptoDeviceSchema);
