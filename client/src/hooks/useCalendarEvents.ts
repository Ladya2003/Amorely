export const CALENDAR_EVENTS_CHANGED_EVENT = 'amorely:calendar-events-changed';

export const notifyCalendarEventsChanged = () => {
  window.dispatchEvent(new CustomEvent(CALENDAR_EVENTS_CHANGED_EVENT));
};
