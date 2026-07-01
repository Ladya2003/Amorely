import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';

export interface EventMediaItem {
  _id: string;
  url: string;
  resourceType: 'image' | 'video';
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
  sortOrder?: number;
  createdAt?: string;
}

export const sortEventMediaItems = <T extends { sortOrder?: number; createdAt?: string }>(
  items: T[]
): T[] =>
  [...items].sort((a, b) => {
    const orderA = a.sortOrder ?? 0;
    const orderB = b.sortOrder ?? 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });

export type EventEditorMediaItem =
  | { key: string; kind: 'existing'; media: EventMediaItem }
  | { key: string; kind: 'new'; file: File; preview: string };

export type EventMediaSequenceSlot =
  | { existingId: string }
  | { newMediaIndex: number };

export const createNewMediaItem = (file: File): Extract<EventEditorMediaItem, { kind: 'new' }> => ({
  key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  kind: 'new',
  file,
  preview: URL.createObjectURL(file),
});

export const getNewFilesFromMediaItems = (items: EventEditorMediaItem[]): File[] =>
  items.filter((item): item is Extract<EventEditorMediaItem, { kind: 'new' }> => item.kind === 'new')
    .map((item) => item.file);

export const buildMediaSequence = (items: EventEditorMediaItem[]): EventMediaSequenceSlot[] => {
  let newMediaIndex = 0;

  return items.map((item) => {
    if (item.kind === 'existing') {
      return { existingId: item.media._id };
    }

    const slot = { newMediaIndex };
    newMediaIndex += 1;
    return slot;
  });
};

export const revokeNewMediaPreviews = (items: EventEditorMediaItem[]) => {
  items.forEach((item) => {
    if (item.kind === 'new') {
      URL.revokeObjectURL(item.preview);
    }
  });
};

export const moveMediaItem = (
  items: EventEditorMediaItem[],
  index: number,
  direction: -1 | 1
): EventEditorMediaItem[] => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
};
