import mongoose, { Document } from 'mongoose';

export interface DrawStroke {
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  isEraser?: boolean;
  isFill?: boolean;
}

export interface DrawGuessAttempt {
  userId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface DrawCurrentRound {
  wordId: string;
  drawerUserId: mongoose.Types.ObjectId;
  status: 'drawing' | 'awaiting_guesser' | 'guessing' | 'revealed';
  drawingStartedAt: Date;
  drawingDeadlineAt: Date;
  guessingStartedAt: Date | null;
  guessingDeadlineAt: Date | null;
  strokes: DrawStroke[];
  redoStrokes: DrawStroke[];
  guessAttempts: DrawGuessAttempt[];
  guessText: string | null;
  guessedByUserId: mongoose.Types.ObjectId | null;
  pointsEarned: number | null;
  wasCorrect: boolean | null;
  dismissedRevealUserIds: mongoose.Types.ObjectId[];
}

export interface DrawGameStateDocument extends Document {
  relationshipId: mongoose.Types.ObjectId;
  totalScore: number;
  roundsCompleted: number;
  scoredRoundsCompleted: number;
  scoredRoundsDayKey: string | null;
  scoredRoundsToday: number;
  usedWordIds: string[];
  readyUserIds: mongoose.Types.ObjectId[];
  lobbyCountdownEndsAt: Date | null;
  currentRound: DrawCurrentRound | null;
  createdAt: Date;
  updatedAt: Date;
}

const drawPointSchema = new mongoose.Schema(
  { x: { type: Number, required: true }, y: { type: Number, required: true } },
  { _id: false }
);

const drawStrokeSchema = new mongoose.Schema(
  {
    points: { type: [drawPointSchema], default: [] },
    color: { type: String, default: '#111111' },
    width: { type: Number, default: 4 },
    isEraser: { type: Boolean, default: false },
    isFill: { type: Boolean, default: false },
  },
  { _id: false }
);

const drawCurrentRoundSchema = new mongoose.Schema(
  {
    wordId: { type: String, required: true },
    drawerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['drawing', 'awaiting_guesser', 'guessing', 'revealed'],
      default: 'drawing',
    },
    drawingStartedAt: { type: Date, required: true },
    drawingDeadlineAt: { type: Date, required: true },
    guessingStartedAt: { type: Date, default: null },
    guessingDeadlineAt: { type: Date, default: null },
    strokes: { type: [drawStrokeSchema], default: [] },
    redoStrokes: { type: [drawStrokeSchema], default: [] },
    guessAttempts: {
      type: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          text: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    guessText: { type: String, default: null },
    guessedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    pointsEarned: { type: Number, default: null },
    wasCorrect: { type: Boolean, default: null },
    dismissedRevealUserIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
  },
  { _id: false }
);

const drawGameStateSchema = new mongoose.Schema({
  relationshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Relationship',
    required: true,
    unique: true,
    index: true,
  },
  totalScore: { type: Number, default: 0, index: true },
  roundsCompleted: { type: Number, default: 0 },
  scoredRoundsCompleted: { type: Number, default: 0 },
  scoredRoundsDayKey: { type: String, default: null },
  scoredRoundsToday: { type: Number, default: 0 },
  usedWordIds: { type: [String], default: [] },
  readyUserIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  lobbyCountdownEndsAt: { type: Date, default: null },
  currentRound: { type: drawCurrentRoundSchema, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

drawGameStateSchema.pre('save', function save(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<DrawGameStateDocument>('DrawGameState', drawGameStateSchema);
