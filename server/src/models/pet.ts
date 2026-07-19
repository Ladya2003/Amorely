import mongoose from 'mongoose';
import { PET_SPECIES } from '../config/petCatalog';

const petSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  species: { type: String, enum: PET_SPECIES, required: true },
  variant: { type: String, required: true },
  name: { type: String, required: true, maxlength: 24, trim: true },
  level: { type: Number, default: 1, min: 1, max: 5 },
  subLevel: { type: Number, default: 0, min: 0 },
  affectionDelta: { type: Number, default: 0, min: -5, max: 5 },
  satiety: { type: Number, default: 60, min: 0, max: 100 },
  lastSatietyAt: { type: Date, default: null },
  lastPettedAt: { type: Date, default: null },
  affectionDecayAppliedDays: { type: Number, default: 0, min: 0 },
  pettingWindowDate: { type: String, default: null },
  pettingWindowCount: { type: Number, default: 0, min: 0, max: 2 },
  pettingRewardHalfDayKey: { type: String, default: null },
  stats: {
    affection: { type: Number, default: 10, min: 1, max: 100 },
    playfulness: { type: Number, default: 10, min: 1, max: 100 },
    charm: { type: Number, default: 10, min: 1, max: 100 },
  },
  giftedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

petSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Pet', petSchema);
