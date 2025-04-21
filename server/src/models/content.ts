import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Если контент для партнера
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  resourceType: { type: String, enum: ['image', 'video'], required: true },
  frequency: {
    count: { type: Number, default: 3 },
    hours: { type: Number, default: 24 }
  },
  displayedCount: { type: Number, default: 0 },
  lastDisplayed: { type: Date },
  nextDisplay: { type: Date },
  customDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Content', contentSchema); 