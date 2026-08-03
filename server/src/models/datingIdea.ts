import mongoose from 'mongoose';

const datingIdeaSchema = new mongoose.Schema({
  relationshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Relationship',
    required: true,
    index: true,
  },
  ideaKey: { type: String, required: true },
  emoji: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'skipped'],
    default: 'active',
    index: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: String },
  completedAt: { type: Date },
  skippedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

datingIdeaSchema.index({ relationshipId: 1, createdAt: -1 });
datingIdeaSchema.index({ relationshipId: 1, status: 1 });

export default mongoose.model('DatingIdea', datingIdeaSchema);
