import mongoose, { Document } from 'mongoose';

export interface QuizAnswerEntry {
  userId: mongoose.Types.ObjectId;
  text: string;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface QuizCurrentQuestion {
  cellKey: string;
  categoryId: string;
  points: number;
  questionId: string;
  startedAt: Date;
  deadlineAt: Date;
  status: 'answering' | 'revealed';
  answers: QuizAnswerEntry[];
  pointsAwardedTotal: number;
}

export interface QuizBoardCell {
  cellKey: string;
  categoryId: string;
  categoryName: string;
  points: number;
  questionId: string;
  used: boolean;
}

export interface QuizGameStateDocument extends Document {
  relationshipId: mongoose.Types.ObjectId;
  totalScore: number;
  boardDayKey: string | null;
  boardCells: QuizBoardCell[];
  usedCellKeys: string[];
  seenQuestionIds: string[];
  readyUserIds: mongoose.Types.ObjectId[];
  lobbyCountdownEndsAt: Date | null;
  sessionActive: boolean;
  pickerUserId: mongoose.Types.ObjectId | null;
  nextBoardAvailableAt: Date | null;
  currentQuestion: QuizCurrentQuestion | null;
  createdAt: Date;
  updatedAt: Date;
}

const quizAnswerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    /** Пустая строка — участник не успел ответить до дедлайна */
    text: { type: String, default: '' },
    isCorrect: { type: Boolean, required: true },
    pointsEarned: { type: Number, required: true },
  },
  { _id: false }
);

const quizCurrentQuestionSchema = new mongoose.Schema(
  {
    cellKey: { type: String, required: true },
    categoryId: { type: String, required: true },
    points: { type: Number, required: true },
    questionId: { type: String, required: true },
    startedAt: { type: Date, required: true },
    deadlineAt: { type: Date, required: true },
    status: { type: String, enum: ['answering', 'revealed'], default: 'answering' },
    answers: { type: [quizAnswerSchema], default: [] },
    pointsAwardedTotal: { type: Number, default: 0 },
  },
  { _id: false }
);

const quizBoardCellSchema = new mongoose.Schema(
  {
    cellKey: { type: String, required: true },
    categoryId: { type: String, required: true },
    categoryName: { type: String, required: true },
    points: { type: Number, required: true },
    questionId: { type: String, required: true },
    used: { type: Boolean, default: false },
  },
  { _id: false }
);

const quizGameStateSchema = new mongoose.Schema({
  relationshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Relationship',
    required: true,
    unique: true,
    index: true,
  },
  totalScore: { type: Number, default: 0, index: true },
  boardDayKey: { type: String, default: null },
  boardCells: { type: [quizBoardCellSchema], default: [] },
  usedCellKeys: { type: [String], default: [] },
  seenQuestionIds: { type: [String], default: [] },
  readyUserIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  lobbyCountdownEndsAt: { type: Date, default: null },
  sessionActive: { type: Boolean, default: false },
  pickerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  nextBoardAvailableAt: { type: Date, default: null },
  currentQuestion: { type: quizCurrentQuestionSchema, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

quizGameStateSchema.pre('save', function save(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<QuizGameStateDocument>('QuizGameState', quizGameStateSchema);
