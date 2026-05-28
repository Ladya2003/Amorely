import mongoose from 'mongoose';

const activeBoostSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    multiplier: { type: Number, required: true },
    remainingUses: { type: Number, required: true },
  },
  { _id: false }
);

const tapGameStateSchema = new mongoose.Schema({
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  relationshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Relationship',
    default: null,
    sparse: true,
    unique: true,
  },
  waitingForPartnerLink: { type: Boolean, default: false },
  round: { type: Number, default: 1 },
  targetTaps: { type: Number, default: 5 },
  activeUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  roundStarterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userTapsThisRound: { type: Number, default: 0 },
  partnerTapsThisRound: { type: Number, default: 0 },
  blockIndex: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  totalTaps: { type: Number, default: 0, index: true },
  activeBoost: { type: activeBoostSchema, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

tapGameStateSchema.index(
  { ownerUserId: 1 },
  { unique: true, partialFilterExpression: { relationshipId: null } }
);

tapGameStateSchema.pre('save', function save(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('TapGameState', tapGameStateSchema);
