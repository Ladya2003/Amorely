import mongoose from 'mongoose';

const reportMediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ['image', 'video'], required: true },
  },
  { _id: false }
);

const adminMessageSchema = new mongoose.Schema(
  {
    target: { type: String, enum: ['reporter', 'reported'], required: true },
    text: { type: String, required: true },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatReportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true, trim: true },
  media: { type: [reportMediaSchema], default: [] },
  adminMessages: { type: [adminMessageSchema], default: [] },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.model('ChatReport', chatReportSchema);
