import mongoose from 'mongoose';

const currencyActivityStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activityKey: { type: String, required: true },
  count: { type: Number, default: 0 },
  lastAwardedAt: { type: Date, default: Date.now },
});

currencyActivityStateSchema.index({ userId: 1, activityKey: 1 }, { unique: true });

export default mongoose.model('CurrencyActivityState', currencyActivityStateSchema);
