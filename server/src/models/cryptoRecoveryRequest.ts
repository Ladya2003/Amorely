import mongoose from 'mongoose';

const YES_NO_UNSURE = ['yes', 'no', 'unsure'] as const;
const REMEMBER_OPTIONS = ['yes', 'partial', 'no'] as const;
const CONTEXT_OPTIONS = ['calendar', 'feed', 'chat', 'plans', 'other'] as const;

const backupSnapshotSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    createdAt: { type: Date },
    updatedAt: { type: Date }
  },
  { _id: false }
);

const deviceSnapshotSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    createdAt: { type: Date },
    updatedAt: { type: Date },
    lastSeen: { type: Date }
  },
  { _id: false }
);

const cryptoRecoveryRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    multiplePassphrases: { type: String, enum: YES_NO_UNSURE, required: true },
    hasOldDeviceAccess: { type: String, enum: YES_NO_UNSURE, required: true },
    rememberOldPassphrase: { type: String, enum: REMEMBER_OPTIONS, required: true },
    context: { type: String, enum: CONTEXT_OPTIONS, default: 'other' },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    currentDeviceId: { type: String, trim: true, default: '' },
    userAgent: { type: String, trim: true, default: '' },
    backupCount: { type: Number, required: true, default: 0 },
    backups: { type: [backupSnapshotSchema], default: [] },
    deviceCount: { type: Number, required: true, default: 0 },
    devices: { type: [deviceSnapshotSchema], default: [] },
    status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
    adminNote: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

cryptoRecoveryRequestSchema.index({ createdAt: -1 });
cryptoRecoveryRequestSchema.index({ userId: 1, status: 1 });

export type CryptoRecoveryYesNoUnsure = (typeof YES_NO_UNSURE)[number];
export type CryptoRecoveryRememberOption = (typeof REMEMBER_OPTIONS)[number];
export type CryptoRecoveryContext = (typeof CONTEXT_OPTIONS)[number];

export default mongoose.model('CryptoRecoveryRequest', cryptoRecoveryRequestSchema);
