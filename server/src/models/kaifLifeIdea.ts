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
    }
  | {
      id: string;
      type: 'document';
      url: string;
      publicId: string;
      fileName: string;
      mimeType: string;
    };

export type KaifLifeStage = {
  done: boolean;
  inProgress: boolean;
  deadline: Date | null;
  blocks: KaifLifeContentBlock[];
};

export type KaifLifeStages = Record<KaifLifeStageKey, KaifLifeStage>;

export interface KaifLifeIdeaDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId | null;
  title: string;
  inProgress: boolean;
  sortOrder: number;
  stages: KaifLifeStages;
  createdAt: Date;
  updatedAt: Date;
}

const contentBlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['text', 'media', 'document'], required: true },
    text: { type: String },
    mediaType: { type: String, enum: ['image', 'video'] },
    url: { type: String },
    publicId: { type: String },
    widthPercent: { type: Number },
    fileName: { type: String },
    mimeType: { type: String },
  },
  { _id: false }
);

const stageSchema = new mongoose.Schema(
  {
    done: { type: Boolean, default: false },
    inProgress: { type: Boolean, default: false },
    deadline: { type: Date, default: null },
    blocks: { type: [contentBlockSchema], default: () => [] },
  },
  { _id: false }
);

const emptyStage = () => ({
  done: false,
  inProgress: false,
  deadline: null,
  blocks: [] as KaifLifeContentBlock[],
});

const kaifLifeIdeaSchema = new mongoose.Schema<KaifLifeIdeaDocument>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'KaifLifeGroup', index: true },
    title: { type: String, default: '' },
    inProgress: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    stages: {
      development: { type: stageSchema, default: emptyStage },
      script: { type: stageSchema, default: emptyStage },
      shooting: { type: stageSchema, default: emptyStage },
      editing: { type: stageSchema, default: emptyStage },
    },
  },
  { timestamps: true }
);

kaifLifeIdeaSchema.index({ userId: 1, groupId: 1, sortOrder: 1 });

export default mongoose.model<KaifLifeIdeaDocument>('KaifLifeIdea', kaifLifeIdeaSchema);
