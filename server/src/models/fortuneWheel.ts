import mongoose from 'mongoose';

export interface FortuneWheelDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  tasks: string[];
  createdAt: Date;
  updatedAt: Date;
}

const fortuneWheelSchema = new mongoose.Schema<FortuneWheelDocument>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    title: { type: String, trim: true, maxlength: 200, default: '' },
    tasks: {
      type: [{ type: String, trim: true, maxlength: 2000 }],
      default: [],
      validate: {
        validator: (tasks: string[]) => tasks.length <= 100,
        message: 'Слишком много заданий (максимум 100)',
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model<FortuneWheelDocument>('FortuneWheel', fortuneWheelSchema);
