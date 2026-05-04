import mongoose from 'mongoose';

const feedRotationItemSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
  showCount: { type: Number, default: 0 },
  lastShownAt: { type: Date }
}, { _id: false });

const currentSlotsSchema = new mongoose.Schema({
  birthdayContentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  anniversaryContentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  randomContentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }]
}, { _id: false });

const feedRotationStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'broken_up'], default: 'active' },
  items: { type: [feedRotationItemSchema], default: [] },
  currentSlots: {
    type: currentSlotsSchema,
    default: () => ({ randomContentIds: [] })
  },
  lastGeneratedSlot: { type: String },
  lastGeneratedAt: { type: Date }
}, {
  timestamps: true
});

feedRotationStateSchema.index({ userId: 1, partnerId: 1 }, { unique: true });

export default mongoose.model('FeedRotationState', feedRotationStateSchema);
