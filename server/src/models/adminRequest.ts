import mongoose from 'mongoose';

export const ADMIN_REQUEST_CATEGORIES = ['question', 'feature', 'bug', 'other'] as const;
export type AdminRequestCategory = (typeof ADMIN_REQUEST_CATEGORIES)[number];

const adminRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: ADMIN_REQUEST_CATEGORIES, required: true, default: 'question' },
    text: { type: String, required: true, trim: true, maxlength: 5000 },
    locale: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
    adminNote: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

adminRequestSchema.index({ createdAt: -1 });
adminRequestSchema.index({ userId: 1, status: 1 });

export default mongoose.model('AdminRequest', adminRequestSchema);
