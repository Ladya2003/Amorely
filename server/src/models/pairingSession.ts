import mongoose from 'mongoose';

const pairingSessionSchema = new mongoose.Schema(
  {
    pairingId: { type: String, required: true, unique: true, index: true },
    requesterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requesterDeviceId: { type: String, required: true },
    requesterEphemeralPublicKey: { type: String, required: true },
    shortCode: { type: String, required: true },
    encryptedPayload: { type: String, required: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'consumed', 'expired'],
      default: 'pending',
      index: true
    },
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

export default mongoose.model('PairingSession', pairingSessionSchema);
