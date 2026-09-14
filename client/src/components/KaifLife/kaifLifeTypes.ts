export const KAIF_LIFE_STAGE_KEYS = ['development', 'script', 'shooting', 'editing'] as const;

export type KaifLifeStageKey = (typeof KAIF_LIFE_STAGE_KEYS)[number];

export const KAIF_LIFE_STAGE_LABELS: Record<KaifLifeStageKey, string> = {
  development: 'Разраб-ка',
  script: 'Сценарий',
  shooting: 'Съёмка',
  editing: 'Монтаж',
};

export type KaifLifeTextBlock = {
  id: string;
  type: 'text';
  text: string;
};

export type KaifLifeMediaBlock = {
  id: string;
  type: 'media';
  mediaType: 'image' | 'video';
  url: string;
  publicId: string;
  widthPercent: number;
};

export type KaifLifeDocumentBlock = {
  id: string;
  type: 'document';
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
};

export type KaifLifeContentBlock = KaifLifeTextBlock | KaifLifeMediaBlock | KaifLifeDocumentBlock;

export type KaifLifeStage = {
  done: boolean;
  inProgress: boolean;
  deadline: string | null;
  blocks: KaifLifeContentBlock[];
};

export type KaifLifeStages = Record<KaifLifeStageKey, KaifLifeStage>;

export type KaifLifeGroup = {
  _id: string;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type KaifLifeIdea = {
  _id: string;
  groupId: string;
  title: string;
  sortOrder: number;
  stages: KaifLifeStages;
  createdAt: string;
  updatedAt: string;
};

export type KaifLifeIdeaDraft = {
  title: string;
  stages: KaifLifeStages;
};

export type KaifLifeListPayload = {
  groups: KaifLifeGroup[];
  ideas: KaifLifeIdea[];
};

export type KaifLifeMoveDirection = 'up' | 'down';
