export type CalendarMainTab = 'calendar' | 'plans';
export type CalendarViewMode = 'circles' | 'grid';

export type CalendarUiPreferences = {
  mainTab: CalendarMainTab;
  calendarView: CalendarViewMode;
  plansCategory: string | null;
};

const STORAGE_VERSION = 1;

const DEFAULT_PREFS: CalendarUiPreferences = {
  mainTab: 'calendar',
  calendarView: 'circles',
  plansCategory: null
};

export function getCalendarUiStorageKey(userId: string): string {
  return `amorely.calendarUi.v${STORAGE_VERSION}.${userId}`;
}

export function readCalendarUiPreferences(userId: string): CalendarUiPreferences {
  try {
    const raw = localStorage.getItem(getCalendarUiStorageKey(userId));
    if (!raw) {
      return { ...DEFAULT_PREFS };
    }

    const parsed = JSON.parse(raw) as Partial<CalendarUiPreferences>;

    return {
      mainTab: parsed.mainTab === 'plans' ? 'plans' : 'calendar',
      calendarView: parsed.calendarView === 'grid' ? 'grid' : 'circles',
      plansCategory: typeof parsed.plansCategory === 'string' ? parsed.plansCategory : null
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function updateCalendarUiPreferences(
  userId: string,
  partial: Partial<CalendarUiPreferences>
): CalendarUiPreferences {
  const next = { ...readCalendarUiPreferences(userId), ...partial };
  localStorage.setItem(getCalendarUiStorageKey(userId), JSON.stringify(next));
  return next;
}
