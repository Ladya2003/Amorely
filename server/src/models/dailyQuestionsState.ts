import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  value: { type: String, required: true },
}, { _id: false });

const userCategoryProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: String, required: true },
  answers: { type: [answerSchema], default: [] },
  completedAt: { type: Date },
}, { _id: false });

const categoryBothCompletedSchema = new mongoose.Schema({
  categoryId: { type: String, required: true },
  completedAt: { type: Date, required: true },
}, { _id: false });

const historyRoundSchema = new mongoose.Schema({
  roundKey: { type: String, required: true },
  categoryIds: [{ type: String }],
  bothCompletedAllAt: { type: Date },
  categoryBothCompleted: { type: [categoryBothCompletedSchema], default: [] },
  progress: { type: [userCategoryProgressSchema], default: [] },
  archivedAt: { type: Date, default: Date.now },
}, { _id: false });

const dailyQuestionsStateSchema = new mongoose.Schema({
  relationshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Relationship', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'broken_up'], default: 'active' },
  roundKey: { type: String, required: true },
  categoryIds: [{ type: String }],
  roundStartedAt: { type: Date, default: Date.now },
  bothCompletedAllAt: { type: Date },
  categoryBothCompleted: { type: [categoryBothCompletedSchema], default: [] },
  progress: { type: [userCategoryProgressSchema], default: [] },
  history: { type: [historyRoundSchema], default: [] },
}, {
  timestamps: true,
});

dailyQuestionsStateSchema.index({ relationshipId: 1 }, { unique: true });

export default mongoose.model('DailyQuestionsState', dailyQuestionsStateSchema);
