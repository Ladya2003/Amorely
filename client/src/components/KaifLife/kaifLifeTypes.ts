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

export type KaifLifeContentBlock = KaifLifeTextBlock | KaifLifeMediaBlock;

export type KaifLifeStage = {
  done: boolean;
  deadline: string | null;
  blocks: KaifLifeContentBlock[];
};

export type KaifLifeStages = Record<KaifLifeStageKey, KaifLifeStage>;

export type KaifLifeIdea = {
  _id: string;
  title: string;
  stages: KaifLifeStages;
  createdAt: string;
  updatedAt: string;
};

export type KaifLifeIdeaDraft = {
  title: string;
  stages: KaifLifeStages;
};
