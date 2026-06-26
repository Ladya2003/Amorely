import mongoose from 'mongoose';

const userWalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0, min: 0 },
  lifetimeEarned: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userWalletSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('UserWallet', userWalletSchema);
