import mongoose, { Document } from 'mongoose';

export interface GeoRoundGuess {
  userId: mongoose.Types.ObjectId;
  lat: number;
  lng: number;
}

export interface GeoCurrentRound {
  locationId: string;
  startedAt: Date;
  deadlineAt: Date;
  status: 'guessing' | 'revealed';
  guesses: GeoRoundGuess[];
  pointsEarned: number | null;
  timedOut: boolean;
}

export interface GeoGameStateDocument extends Document {
  relationshipId: mongoose.Types.ObjectId;
  totalScore: number;
  roundsCompleted: number;
  points: number;
  usedLocationIds: string[];
  roundsDayKey: string | null;
  roundsPlayedToday: number;
  readyUserIds: mongoose.Types.ObjectId[];
  lobbyCountdownEndsAt: Date | null;
  currentRound: GeoCurrentRound | null;
  createdAt: Date;
  updatedAt: Date;
}

const geoRoundGuessSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const geoCurrentRoundSchema = new mongoose.Schema(
  {
    locationId: { type: String, required: true },
    startedAt: { type: Date, required: true },
    deadlineAt: { type: Date, required: true },
    status: { type: String, enum: ['guessing', 'revealed'], default: 'guessing' },
    guesses: { type: [geoRoundGuessSchema], default: [] },
    pointsEarned: { type: Number, default: null },
    timedOut: { type: Boolean, default: false },
  },
  { _id: false }
);

const geoGameStateSchema = new mongoose.Schema({
  relationshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Relationship',
    required: true,
    unique: true,
    index: true,
  },
  totalScore: { type: Number, default: 0, index: true },
  roundsCompleted: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  usedLocationIds: { type: [String], default: [] },
  roundsDayKey: { type: String, default: null },
  roundsPlayedToday: { type: Number, default: 0 },
  readyUserIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  lobbyCountdownEndsAt: { type: Date, default: null },
  currentRound: { type: geoCurrentRoundSchema, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

geoGameStateSchema.pre('save', function save(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<GeoGameStateDocument>('GeoGameState', geoGameStateSchema);
