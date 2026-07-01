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

export const getEventFilterActiveCount = (filter: EventFilter): number =>
  (filter.dateFrom !== null ? 1 : 0) +
  (filter.dateTo !== null ? 1 : 0) +
  (filter.title.trim().length > 0 ? 1 : 0);

export const isEventFilterActive = (filter: EventFilter): boolean =>
  getEventFilterActiveCount(filter) > 0;

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
