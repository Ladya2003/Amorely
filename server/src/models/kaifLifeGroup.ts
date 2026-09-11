import mongoose from 'mongoose';

export interface KaifLifeGroupDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const kaifLifeGroupSchema = new mongoose.Schema<KaifLifeGroupDocument>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: '', maxlength: 200 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

kaifLifeGroupSchema.index({ userId: 1, sortOrder: 1 });

export default mongoose.model<KaifLifeGroupDocument>('KaifLifeGroup', kaifLifeGroupSchema);
