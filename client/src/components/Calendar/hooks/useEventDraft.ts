import { useState, useEffect, useCallback } from 'react';

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
const AUTOSAVE_DELAY = 1000; // Автосохранение через 1 секунду после изменений

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
  const [isSaving, setIsSaving] = useState(false);

  // Загрузка черновика из localStorage при монтировании
  useEffect(() => {
    const loadDraft = () => {
      try {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          // Восстанавливаем дату как объект Date
          if (parsed.date) {
            parsed.date = new Date(parsed.date);
          }
          // Не восстанавливаем файлы и превью (их нельзя сохранить в localStorage)
          parsed.files = [];
          parsed.previews = [];
          setDraft(parsed);
        }
      } catch (error) {
        console.error('Ошибка при загрузке черновика:', error);
      }
    };

    loadDraft();
  }, []);

  // Автосохранение черновика в localStorage
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      try {
        setIsSaving(true);
        const draftToSave = {
          ...draft,
          timestamp: Date.now(),
          // Не сохраняем files и previews в localStorage
          files: [],
          previews: []
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftToSave));
        setHasChanges(false);
        setIsSaving(false);
      } catch (error) {
        console.error('Ошибка при сохранении черновика:', error);
        setIsSaving(false);
      }
    }, AUTOSAVE_DELAY);

    return () => {
      clearTimeout(timer);
    };
  }, [draft.title, draft.description, draft.date?.getTime(), hasChanges]); // Отслеживаем конкретные поля

  // Обновление черновика
  const updateDraft = useCallback((updates: Partial<EventDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  // Очистка черновика
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
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
  }, []);

  // Проверка наличия черновика (вычисляемое значение, а не функция)
  const hasDraft = !!(draft.title || draft.description || draft.date);

  return {
    draft,
    updateDraft,
    clearDraft,
    hasDraft,
    isSaving,
    hasChanges
  };
};

