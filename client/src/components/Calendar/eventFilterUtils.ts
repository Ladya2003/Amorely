import { endOfDay, startOfDay } from 'date-fns';

export interface EventFilter {
  dateFrom: Date | null;
  dateTo: Date | null;
  title: string;
}

export const EMPTY_EVENT_FILTER: EventFilter = {
  dateFrom: null,
  dateTo: null,
  title: ''
};

export const isEventFilterActive = (filter: EventFilter): boolean =>
  filter.dateFrom !== null || filter.dateTo !== null || filter.title.trim().length > 0;

interface FilterableEvent {
  title?: string;
  eventDate?: string;
  createdAt?: string;
  date?: string;
}

const getEventDate = (event: FilterableEvent): Date =>
  new Date(event.eventDate || event.date || event.createdAt || 0);

export const eventMatchesFilter = (event: FilterableEvent, filter: EventFilter): boolean => {
  const eventDate = getEventDate(event);

  if (filter.dateFrom && eventDate < startOfDay(filter.dateFrom)) {
    return false;
  }

  if (filter.dateTo && eventDate > endOfDay(filter.dateTo)) {
    return false;
  }

  const query = filter.title.trim();
  if (query) {
    const title = event.title?.trim() || '';
    if (!title.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
  }

  return true;
};
