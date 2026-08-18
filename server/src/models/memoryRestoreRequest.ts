import mongoose from 'mongoose';

const OPEN_STATUSES = ['pending', 'in_progress'] as const;

const memoryRestoreRequestSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'declined', 'cancelled', 'failed'],
      default: 'pending'
    },
    requesterDeviceId: { type: String, default: '' },
    progress: {
      events: { type: Number, default: 0 },
      plans: { type: Number, default: 0 },
      feed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

memoryRestoreRequestSchema.index(
  { fromUserId: 1, toUserId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: [...OPEN_STATUSES] } }
  }
);

memoryRestoreRequestSchema.index({ toUserId: 1, status: 1, createdAt: -1 });
memoryRestoreRequestSchema.index({ fromUserId: 1, status: 1, createdAt: -1 });

export default mongoose.model('MemoryRestoreRequest', memoryRestoreRequestSchema);
