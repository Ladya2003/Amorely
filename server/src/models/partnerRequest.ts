import mongoose from 'mongoose';

const partnerRequestSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relationshipStartDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled', 'superseded'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

partnerRequestSchema.index(
  { fromUserId: 1, toUserId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

export default mongoose.model('PartnerRequest', partnerRequestSchema);
