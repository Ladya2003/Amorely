import { useState, useEffect, useCallback } from 'react';
import {
  saveEventDraftMedia,
  loadEventDraftMedia,
  clearEventDraftMedia
} from './eventDraftMediaStore';

export interface EventDraft {
  id: string;
  date: Date | null;
  title: string;
  description: string;
  files: File[];
  previews: string[];
  timestamp: number;
}

const DRAFT_KEY = 'calendar_event_draft';
const AUTOSAVE_DELAY = 1000;

const filesFingerprint = (files: File[]) =>
  files.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join('|');

const persistDraft = async (draftToPersist: EventDraft) => {
  const draftToSave = {
    ...draftToPersist,
    timestamp: Date.now(),
    files: [],
    previews: []
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draftToSave));

  if (draftToPersist.files.length > 0) {
    await saveEventDraftMedia(draftToPersist.files);
  } else {
    await clearEventDraftMedia();
  }
};

export const useEventDraft = () => {
  const [draft, setDraft] = useState<EventDraft>({
    id: Date.now().toString(),
    date: null,
    title: '',
    description: '',
    files: [],
    previews: [],
    timestamp: Date.now()
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        const savedFiles = await loadEventDraftMedia();

        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.date) {
            parsed.date = new Date(parsed.date);
          }
          parsed.files = savedFiles;
          parsed.previews = [];
          setDraft(parsed);
        } else if (savedFiles.length > 0) {
          setDraft((prev) => ({ ...prev, files: savedFiles, previews: [] }));
        }
      } catch (error) {
        console.error('Ошибка при загрузке черновика:', error);
      } finally {
        setIsDraftLoaded(true);
      }
    };

    loadDraft();
  }, []);

  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(async () => {
      try {
        await persistDraft(draft);
        setHasChanges(false);
      } catch (error) {
        console.error('Ошибка при сохранении черновика:', error);
      }
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(timer);
  }, [
    draft.title,
    draft.description,
    draft.date?.getTime(),
    filesFingerprint(draft.files),
    hasChanges
  ]);

  const updateDraft = useCallback((updates: Partial<EventDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const flushDraft = useCallback(async (updates?: Partial<EventDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...updates };
      persistDraft(next)
        .then(() => setHasChanges(false))
        .catch((error) => console.error('Ошибка при сохранении черновика:', error));
      return next;
    });
  }, []);

  const clearDraft = useCallback(() => {
    const clear = async () => {
      try {
        localStorage.removeItem(DRAFT_KEY);
        await clearEventDraftMedia();
        setDraft({
          id: Date.now().toString(),
          date: null,
          title: '',
          description: '',
          files: [],
          previews: [],
          timestamp: Date.now()
        });
        setHasChanges(false);
      } catch (error) {
        console.error('Ошибка при очистке черновика:', error);
      }
    };
    clear();
  }, []);

  const hasDraft = !!(
    draft.title ||
    draft.description ||
    draft.date ||
    draft.files.length > 0
  );

  return {
    draft,
    updateDraft,
    flushDraft,
    clearDraft,
    hasDraft,
    hasChanges,
    isDraftLoaded
  };
};
