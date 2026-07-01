export interface PlanFilter {
  title: string;
  description: string;
}

export const EMPTY_PLAN_FILTER: PlanFilter = {
  title: '',
  description: ''
};

export const getPlanFilterActiveCount = (filter: PlanFilter): number =>
  (filter.title.trim().length > 0 ? 1 : 0) +
  (filter.description.trim().length > 0 ? 1 : 0);

export const isPlanFilterActive = (filter: PlanFilter): boolean =>
  getPlanFilterActiveCount(filter) > 0;

interface FilterablePlanNote {
  title?: string;
  content?: string;
}

export const planNoteMatchesFilter = (
  note: FilterablePlanNote,
  filter: PlanFilter
): boolean => {
  const titleQuery = filter.title.trim();
  if (titleQuery) {
    const title = note.title?.trim() || '';
    if (!title.toLowerCase().includes(titleQuery.toLowerCase())) {
      return false;
    }
  }

  const descriptionQuery = filter.description.trim();
  if (descriptionQuery) {
    const content = note.content?.trim() || '';
    if (!content.toLowerCase().includes(descriptionQuery.toLowerCase())) {
      return false;
    }
  }

  return true;
};
