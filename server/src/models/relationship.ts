import mongoose from 'mongoose';

const relationshipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'broken_up'], default: 'active' },
  photo: {
    url: { type: String },
    publicId: { type: String }
  },
  signature: { type: String }, // Оставляем для обратной совместимости
  signatures: {
    user: { type: String }, // Подпись первого партнера (userId)
    partner: { type: String } // Подпись второго партнера (partnerId)
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Relationship', relationshipSchema); 