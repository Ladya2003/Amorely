import {
  KAIF_LIFE_STAGE_KEYS,
  type KaifLifeContentBlock,
  type KaifLifeIdeaDraft,
  type KaifLifeMediaBlock,
  type KaifLifeStage,
  type KaifLifeStages,
  type KaifLifeTextBlock,
} from './kaifLifeTypes';

export const createBlockId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `kl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createTextBlock = (text = ''): KaifLifeTextBlock => ({
  id: createBlockId(),
  type: 'text',
  text,
});

export const createEmptyStage = (): KaifLifeStage => ({
  done: false,
  deadline: null,
  blocks: [createTextBlock()],
});

export const createEmptyStages = (): KaifLifeStages => ({
  development: createEmptyStage(),
  script: createEmptyStage(),
  shooting: createEmptyStage(),
  editing: createEmptyStage(),
});

export const createEmptyDraft = (): KaifLifeIdeaDraft => ({
  title: '',
  stages: createEmptyStages(),
});

export const cloneDraft = (draft: KaifLifeIdeaDraft): KaifLifeIdeaDraft =>
  JSON.parse(JSON.stringify(draft)) as KaifLifeIdeaDraft;

export const ensureStageTextBlocks = (stage: KaifLifeStage): KaifLifeStage => {
  if (stage.blocks.some((block) => block.type === 'text')) {
    return stage;
  }
  return {
    ...stage,
    blocks: [...stage.blocks, createTextBlock()],
  };
};

export const normalizeDraft = (draft: KaifLifeIdeaDraft): KaifLifeIdeaDraft => ({
  title: draft.title,
  stages: KAIF_LIFE_STAGE_KEYS.reduce((acc, key) => {
    acc[key] = ensureStageTextBlocks(draft.stages[key] ?? createEmptyStage());
    return acc;
  }, {} as KaifLifeStages),
});

export const isIdeaMeaningful = (draft: KaifLifeIdeaDraft): boolean => {
  if (draft.title.trim()) {
    return true;
  }

  return KAIF_LIFE_STAGE_KEYS.some((key) => {
    const stage = draft.stages[key];
    if (!stage) {
      return false;
    }
    if (stage.done || stage.deadline) {
      return true;
    }
    return stage.blocks.some((block) => {
      if (block.type === 'media') {
        return true;
      }
      if (block.type === 'text') {
        return Boolean(block.text.trim());
      }
      const _exhaustive: never = block;
      return _exhaustive;
    });
  });
};

export type MediaInsert = Omit<KaifLifeMediaBlock, 'id' | 'type'>;

export const insertMediaAtCursor = (
  blocks: KaifLifeContentBlock[],
  mediaItems: MediaInsert[],
  focusedTextId: string | null,
  cursor: number
): { blocks: KaifLifeContentBlock[]; focusTextId: string } => {
  const mediaBlocks: KaifLifeMediaBlock[] = mediaItems.map((item) => ({
    id: createBlockId(),
    type: 'media',
    mediaType: item.mediaType,
    url: item.url,
    publicId: item.publicId,
    widthPercent: item.widthPercent,
  }));

  const trailingText = createTextBlock();

  if (!focusedTextId) {
    const next = [...blocks, ...mediaBlocks, trailingText];
    return { blocks: next, focusTextId: trailingText.id };
  }

  const index = blocks.findIndex((block) => block.id === focusedTextId);
  if (index < 0 || blocks[index].type !== 'text') {
    const next = [...blocks, ...mediaBlocks, trailingText];
    return { blocks: next, focusTextId: trailingText.id };
  }

  const textBlock = blocks[index];
  if (textBlock.type !== 'text') {
    const next = [...blocks, ...mediaBlocks, trailingText];
    return { blocks: next, focusTextId: trailingText.id };
  }

  const safeCursor = Math.max(0, Math.min(cursor, textBlock.text.length));
  const before = textBlock.text.slice(0, safeCursor);
  const after = textBlock.text.slice(safeCursor);
  const nextBlocks: KaifLifeContentBlock[] = [];

  if (index > 0) {
    nextBlocks.push(...blocks.slice(0, index));
  }

  nextBlocks.push({ ...textBlock, text: before });
  nextBlocks.push(...mediaBlocks);

  if (after) {
    const afterBlock = createTextBlock(after);
    nextBlocks.push(afterBlock);
    nextBlocks.push(...blocks.slice(index + 1));
    return { blocks: nextBlocks, focusTextId: afterBlock.id };
  }

  nextBlocks.push(trailingText);
  nextBlocks.push(...blocks.slice(index + 1));
  return { blocks: nextBlocks, focusTextId: trailingText.id };
};

export type DocumentGroup =
  | { type: 'text'; block: KaifLifeTextBlock }
  | { type: 'mediaRow'; blocks: KaifLifeMediaBlock[] };

export const groupDocumentBlocks = (blocks: KaifLifeContentBlock[]): DocumentGroup[] => {
  const groups: DocumentGroup[] = [];
  let mediaBuffer: KaifLifeMediaBlock[] = [];

  const flushMedia = () => {
    if (mediaBuffer.length > 0) {
      groups.push({ type: 'mediaRow', blocks: mediaBuffer });
      mediaBuffer = [];
    }
  };

  for (const block of blocks) {
    if (block.type === 'media') {
      mediaBuffer.push(block);
      continue;
    }
    if (block.type === 'text') {
      flushMedia();
      groups.push({ type: 'text', block });
      continue;
    }
    const _exhaustive: never = block;
    return _exhaustive;
  }

  flushMedia();
  return groups;
};

export const defaultMediaWidth = (count: number): number => {
  if (count <= 1) {
    return 48;
  }
  return Math.max(24, Math.floor(96 / count));
};
