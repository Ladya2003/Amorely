import mongoose from 'mongoose';

const relationshipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'broken_up'], default: 'active' },
  breakupContentHandledBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  breakupContentChoices: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      keepEvents: { type: Boolean, default: false },
      keepPlans: { type: Boolean, default: false }
    }
  ],
  photo: {
    url: { type: String },
    publicId: { type: String }
  },
  signature: { type: String }, // Оставляем для обратной совместимости
  signatures: {
    user: { type: String }, // Подпись первого партнера (userId)
    partner: { type: String } // Подпись второго партнера (partnerId)
  },
  badges: [
    {
      gameId: { type: String, required: true },
      rank: { type: Number, required: true, min: 1, max: 3 },
      updatedAt: { type: Date, default: Date.now },
    },
  ],
  daysAchievementsAwarded: [{ type: String }],
  daysAchievementsInitialized: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Relationship', relationshipSchema); 