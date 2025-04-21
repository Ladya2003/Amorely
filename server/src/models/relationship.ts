import mongoose from 'mongoose';

const relationshipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  photo: {
    url: { type: String },
    publicId: { type: String }
  },
  signature: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Relationship', relationshipSchema); 