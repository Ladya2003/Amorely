import mongoose from 'mongoose';

const chatBlockSchema = new mongoose.Schema({
  blockerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  blockedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

chatBlockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

export default mongoose.model('ChatBlock', chatBlockSchema);
