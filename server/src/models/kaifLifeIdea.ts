import mongoose from 'mongoose';

export const KAIF_LIFE_STAGE_KEYS = ['development', 'script', 'shooting', 'editing'] as const;
export type KaifLifeStageKey = (typeof KAIF_LIFE_STAGE_KEYS)[number];

export type KaifLifeContentBlock =
  | {
      id: string;
      type: 'text';
      text: string;
    }
  | {
      id: string;
      type: 'media';
      mediaType: 'image' | 'video';
      url: string;
      publicId: string;
      widthPercent: number;
    };

export type KaifLifeStage = {
  done: boolean;
  deadline: Date | null;
  blocks: KaifLifeContentBlock[];
};

export type KaifLifeStages = Record<KaifLifeStageKey, KaifLifeStage>;

export interface KaifLifeIdeaDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  stages: KaifLifeStages;
  createdAt: Date;
  updatedAt: Date;
}

const contentBlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['text', 'media'], required: true },
    text: { type: String },
    mediaType: { type: String, enum: ['image', 'video'] },
    url: { type: String },
    publicId: { type: String },
    widthPercent: { type: Number },
  },
  { _id: false }
);

const stageSchema = new mongoose.Schema(
  {
    done: { type: Boolean, default: false },
    deadline: { type: Date, default: null },
    blocks: { type: [contentBlockSchema], default: () => [] },
  },
  { _id: false }
);

const emptyStage = () => ({
  done: false,
  deadline: null,
  blocks: [] as KaifLifeContentBlock[],
});

const kaifLifeIdeaSchema = new mongoose.Schema<KaifLifeIdeaDocument>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: '' },
    stages: {
      development: { type: stageSchema, default: emptyStage },
      script: { type: stageSchema, default: emptyStage },
      shooting: { type: stageSchema, default: emptyStage },
      editing: { type: stageSchema, default: emptyStage },
    },
  },
  { timestamps: true }
);

export default mongoose.model<KaifLifeIdeaDocument>('KaifLifeIdea', kaifLifeIdeaSchema);
