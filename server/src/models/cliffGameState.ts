import mongoose from 'mongoose';

const cliffBoulderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    metal: { type: String, enum: ['iron', 'copper'], required: true },
    yield: { type: Number, required: true, min: 4, max: 8 },
    tapsRequired: { type: Number, required: true, min: 5, max: 20 },
    tapsDone: { type: Number, default: 0, min: 0 },
    depleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const cliffCaveBoulderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    resource: { type: String, enum: ['iron', 'copper', 'quartz', 'resin'], required: true },
    side: { type: String, enum: ['owner', 'partner'], required: true },
    yield: { type: Number, required: true, min: 4, max: 8 },
    tapsRequired: { type: Number, required: true, min: 5, max: 20 },
    tapsDone: { type: Number, default: 0, min: 0 },
    depleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const cliffPickaxePurchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['iron', 'copper'], required: true },
  },
  { _id: false }
);

const cliffPlayerProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stonesRemaining: { type: Number, default: 20, min: 0 },
    holesCompleted: { type: Number, default: 0, min: 0, max: 3 },
    encouragementUses: { type: Number, default: 0, min: 0, max: 5 },
    encouragementCooldownUntil: { type: Date, default: null },
    ropeIndex: { type: Number, default: 0, min: 0, max: 8 },
    ballsRemaining: { type: Number, default: 5, min: 0, max: 5 },
    ballsScore: { type: Number, default: 0, min: 0 },
    caveIron: { type: Number, default: 0, min: 0 },
    caveCopper: { type: Number, default: 0, min: 0 },
    caveQuartz: { type: Number, default: 0, min: 0 },
    caveResin: { type: Number, default: 0, min: 0 },
    caveWickCup: { type: Number, default: 0, min: 0 },
    caveLensFlask: { type: Number, default: 0, min: 0 },
    caveLampBody: { type: Number, default: 0, min: 0 },
    caveLantern: { type: Number, default: 0, min: 0 },
    guideX: { type: Number, default: 0 },
    guideY: { type: Number, default: 0 },
    guideEscaped: { type: Boolean, default: false },
    guidePetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', default: null },
    guideRunsLeft: { type: Number, default: 0, min: 0, max: 5 },
    guideRunsTotal: { type: Number, default: 0, min: 0, max: 5 },
    guideScoutIndex: { type: Number, default: 0, min: 0 },
    guideTrailUntil: { type: Date, default: null },
    guideTrailCells: { type: [String], default: [] },
    guideLastForkX: { type: Number, default: null },
    guideLastForkY: { type: Number, default: null },
    guideTrapTold: { type: Boolean, default: false },
    wordsX: { type: Number, default: 0 },
    wordsY: { type: Number, default: 0 },
    wordsBaseY: { type: Number, default: 0 },
    wordsFuel: { type: Number, default: 12, min: 0, max: 12 },
    wordsCheckpoint: { type: Number, default: 0, min: 0, max: 3 },
    wordsCleared: { type: Boolean, default: false },
    wordsUsedPhrases: { type: [String], default: [] },
    wordsShowFuelHint: { type: Boolean, default: false },
    wordsFuelHintTold: { type: Boolean, default: false },
    wordsIntroTold: { type: Boolean, default: false },
  },
  { _id: false }
);

const cliffGameStateSchema = new mongoose.Schema({
  relationshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Relationship',
    required: true,
    unique: true,
  },
  runId: { type: String, required: true },
  scene: {
    type: String,
    enum: ['hub', 'bridge', 'lift', 'ropes', 'balls', 'caves', 'guides', 'words', 'finished'],
    default: 'hub',
  },
  altitudeM: { type: Number, default: 10 },
  gateDestroyed: { type: Boolean, default: false },
  runStartedAt: { type: Date, default: null },
  runPausedAt: { type: Date, default: null },
  bestTimeMs: { type: Number, default: null },
  lastTimeMs: { type: Number, default: null },
  iron: { type: Number, default: 0, min: 0 },
  copper: { type: Number, default: 0, min: 0 },
  hasAxe: { type: Boolean, default: false },
  hasIronPickaxe: { type: Boolean, default: false },
  hasCopperPickaxe: { type: Boolean, default: false },
  purchasedPickaxes: { type: [cliffPickaxePurchaseSchema], default: [] },
  boulders: { type: [cliffBoulderSchema], default: [] },
  caveBoulders: { type: [cliffCaveBoulderSchema], default: [] },
  mineCycleStartedAt: { type: Date, default: null },
  presentUserIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  introPlayedUserIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  playerProgress: { type: [cliffPlayerProgressSchema], default: [] },
  holeExpandedForUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  holeExpandedUntil: { type: Date, default: null },
  bridgeRepaired: { type: Boolean, default: false },
  liftRaised: { type: Boolean, default: false },
  liftPetIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  wordsFailSeq: { type: Number, default: 0, min: 0 },
  wordsCameraY: { type: Number, default: 0 },
  wordsLastPhraseUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  wordsLastPhraseId: { type: String, default: null },
  wordsLastPhraseAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

cliffGameStateSchema.pre('save', function save(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('CliffGameState', cliffGameStateSchema);
