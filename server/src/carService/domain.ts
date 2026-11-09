import { randomUUID } from 'crypto';

export const STATUSES = ['new', 'confirmed', 'completed', 'cancelled', 'no_show'] as const;
export type BookingStatus = typeof STATUSES[number];
export interface Service { id: string; name: string; category: string; duration: number; price: number; description: string; }
export const SERVICES: Service[] = [
  { id: 'diagnostics', name: 'Диагностика автомобиля', category: 'Диагностика', duration: 60, price: 45, description: 'Проверим автомобиль и составим понятный план работ.' },
  { id: 'oil', name: 'Замена масла и фильтров', category: 'Обслуживание', duration: 60, price: 35, description: 'Плановое обслуживание двигателя. Материалы оплачиваются отдельно.' },
  { id: 'brakes', name: 'Обслуживание тормозов', category: 'Ремонт', duration: 90, price: 65, description: 'Осмотр тормозной системы и замена колодок после согласования.' },
  { id: 'tires', name: 'Шиномонтаж', category: 'Колёса', duration: 60, price: 60, description: 'Сезонная смена колёс и балансировка. Цена зависит от размера.' },
  { id: 'alignment', name: 'Развал-схождение', category: 'Колёса', duration: 60, price: 75, description: 'Проверка и регулировка углов установки колёс.' },
  { id: 'inspection', name: 'Осмотр перед ремонтом', category: 'Диагностика', duration: 30, price: 25, description: 'Если пока непонятно, что случилось: начнём с осмотра.' },
];
export interface Settings { open: string; close: string; weekdays: number[]; capacity: number; lunchStart: string; lunchEnd: string; }
export const DEFAULT_SETTINGS: Settings = { open: '09:00', close: '19:00', weekdays: [1, 2, 3, 4, 5, 6], capacity: 1, lunchStart: '13:00', lunchEnd: '14:00' };
export interface Booking {
  id: string; requestId: string; serviceId: string; serviceName: string; duration: number; price: number;
  date: string; time: string; bay: number; name: string; phone: string; car: string; comment: string;
  note: string; status: BookingStatus; source: 'website' | 'phone'; createdAt: string; updatedAt: string;
  notification: 'pending' | 'sending' | 'sent' | 'disabled' | 'failed'; notificationAttempts: number;
  notificationUpdatedAt: string; consentAt: string;
}
export interface Block { id: string; date: string; start: string; end: string; reason: string; }
export interface Workspace { revision: number; settings: Settings; bookings: Booking[]; blocks: Block[]; }
export class ServiceError extends Error { constructor(public status: number, message: string) { super(message); } }
export const minutes = (time: string): number => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const clock = (n: number): string => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
export const nowInMinsk = (now = new Date()): { date: string; time: string } => {
  const local = new Date(now.getTime() + 3 * 3600000);
  return { date: local.toISOString().slice(0, 10), time: local.toISOString().slice(11, 16) };
};
export function validateDate(date: unknown): string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ServiceError(400, 'Укажите корректную дату.');
  const parsed = new Date(date + 'T12:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new ServiceError(400, 'Такой даты нет в календаре.');
  const today = nowInMinsk().date;
  if (date < today || date > new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)) throw new ServiceError(400, 'Запись открыта на ближайшие 60 дней.');
  return date;
}
function validTime(t: unknown): t is string { return typeof t === 'string' && /^(?:[01]\d|2[0-3]):[03]0$/.test(t); }
const overlap = (a: number, b: number, x: number, y: number): boolean => a < y && x < b;
export function availableBay(state: Workspace, date: string, time: string, duration: number, ignoreId?: string): number | null {
  const settings = state.settings, start = minutes(time), end = start + duration;
  const weekday = new Date(date + 'T12:00:00Z').getUTCDay(), now = nowInMinsk();
  if (!validTime(time) || !settings.weekdays.includes(weekday) || start < minutes(settings.open) || end > minutes(settings.close)) return null;
  if (date < now.date || (date === now.date && start < minutes(now.time) + 60)) return null;
  if (settings.lunchStart && overlap(start, end, minutes(settings.lunchStart), minutes(settings.lunchEnd))) return null;
  if (state.blocks.some(b => b.date === date && overlap(start, end, minutes(b.start), minutes(b.end)))) return null;
  for (let bay = 1; bay <= settings.capacity; bay++) {
    if (!state.bookings.some(b => b.id !== ignoreId && b.date === date && b.bay === bay && b.status !== 'cancelled' && overlap(start, end, minutes(b.time), minutes(b.time) + b.duration))) return bay;
  }
  return null;
}
export function getSlots(state: Workspace, date: string, serviceId: string): { time: string; available: boolean }[] {
  const service = SERVICES.find(s => s.id === serviceId);
  if (!service) throw new ServiceError(400, 'Выберите услугу.');
  validateDate(date);
  const result = [];
  for (let t = minutes(state.settings.open); t + service.duration <= minutes(state.settings.close); t += 30) result.push({ time: clock(t), available: availableBay(state, date, clock(t), service.duration) !== null });
  return result;
}
const field = (value: unknown, max: number): string => {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > max) throw new ServiceError(400, 'Проверьте длину и формат полей.');
  return value.trim();
};
export function createBooking(state: Workspace, body: Record<string, unknown>, source: 'website' | 'phone'): { booking: Booking; created: boolean } {
  const requestId = field(body.requestId, 64);
  if (!/^[a-zA-Z0-9-]{16,64}$/.test(requestId)) throw new ServiceError(400, 'Обновите страницу и повторите запись.');
  const existing = state.bookings.find(b => b.requestId === requestId);
  if (existing) return { booking: existing, created: false };
  if (state.bookings.length >= 2000) throw new ServiceError(409, 'Демо заполнено. Обратитесь к администратору.');
  if (source === 'website' && body.consent !== true) throw new ServiceError(400, 'Подтвердите согласие на обработку заявки.');
  if (field(body.website, 200)) throw new ServiceError(400, 'Не удалось отправить форму.');
  const service = SERVICES.find(s => s.id === body.serviceId);
  if (!service) throw new ServiceError(400, 'Выберите услугу.');
  const date = validateDate(body.date), time = field(body.time, 5);
  const phone = field(body.phone, 40).replace(/\D/g, '');
  if (!/^375(?:25|29|33|44)\d{7}$/.test(phone)) throw new ServiceError(400, 'Введите телефон в формате +375 (29) 123-45-67.');
  const name = field(body.name, 80), car = field(body.car, 100), comment = field(body.comment, 500);
  const bay = availableBay(state, date, time, service.duration);
  if (bay === null) throw new ServiceError(409, 'Это время уже занято или недоступно. Выберите другое окно.');
  const now = new Date().toISOString();
  const booking: Booking = { id: randomUUID(), requestId, serviceId: service.id, serviceName: service.name, duration: service.duration, price: service.price,
    date, time, bay, name, phone: '+' + phone, car, comment, note: '', status: 'new', source, createdAt: now, updatedAt: now,
    notification: source === 'website' ? 'pending' : 'disabled', notificationAttempts: 0, notificationUpdatedAt: now, consentAt: now };
  state.bookings.push(booking);
  return { booking, created: true };
}
export function updateBooking(state: Workspace, id: string, body: Record<string, unknown>): Booking {
  const booking = state.bookings.find(b => b.id === id);
  if (!booking) throw new ServiceError(404, 'Заявка не найдена.');
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as BookingStatus)) throw new ServiceError(400, 'Неизвестный статус.');
    if (booking.status === 'cancelled' && body.status !== 'cancelled') {
      const bay = availableBay(state, booking.date, booking.time, booking.duration, id);
      if (bay === null) throw new ServiceError(409, 'Нельзя восстановить запись: время уже занято или прошло.');
      booking.bay = bay;
    }
    booking.status = body.status as BookingStatus;
  }
  if (body.note !== undefined) booking.note = field(body.note, 1000);
  if (body.date !== undefined || body.time !== undefined) {
    const date = validateDate(body.date ?? booking.date), time = field(body.time ?? booking.time, 5);
    const bay = availableBay(state, date, time, booking.duration, id);
    if (bay === null) throw new ServiceError(409, 'Новое время недоступно.');
    booking.date = date; booking.time = time; booking.bay = bay;
  }
  booking.updatedAt = new Date().toISOString();
  return booking;
}
export function addBlock(state: Workspace, body: Record<string, unknown>): Block {
  const date = validateDate(body.date), start = field(body.start, 5), end = field(body.end, 5), reason = field(body.reason, 100);
  if (!validTime(start) || !validTime(end) || minutes(start) >= minutes(end)) throw new ServiceError(400, 'Проверьте начало и конец перерыва.');
  if (state.bookings.some(b => b.date === date && b.status !== 'cancelled' && overlap(minutes(start), minutes(end), minutes(b.time), minutes(b.time) + b.duration))) throw new ServiceError(409, 'В этом интервале уже есть запись. Сначала перенесите или отмените её.');
  if (state.blocks.length >= 500) throw new ServiceError(409, 'Достигнут лимит перерывов демо.');
  const block = { id: randomUUID(), date, start, end, reason }; state.blocks.push(block); return block;
}
export function setSettings(state: Workspace, body: Record<string, unknown>): Settings {
  const { open, close, lunchStart, lunchEnd, capacity, weekdays } = body;
  if (!validTime(open) || !validTime(close) || minutes(open) >= minutes(close)) throw new ServiceError(400, 'Проверьте рабочие часы.');
  if (!Array.isArray(weekdays) || !weekdays.length || weekdays.some(n => !Number.isInteger(n) || n < 0 || n > 6)) throw new ServiceError(400, 'Выберите рабочие дни.');
  if (!Number.isInteger(capacity) || Number(capacity) < 1 || Number(capacity) > 4) throw new ServiceError(400, 'В демо доступно от 1 до 4 постов.');
  if (lunchStart !== '' || lunchEnd !== '') {
    if (!validTime(lunchStart) || !validTime(lunchEnd) || minutes(lunchStart) >= minutes(lunchEnd) || minutes(lunchStart) < minutes(open) || minutes(lunchEnd) > minutes(close)) throw new ServiceError(400, 'Перерыв должен находиться внутри рабочего дня.');
  }
  const proposed: Settings = { open, close, lunchStart: String(lunchStart), lunchEnd: String(lunchEnd), capacity: Number(capacity), weekdays: [...new Set(weekdays as number[])] };
  const today = nowInMinsk().date;
  for (const b of state.bookings.filter(b => b.date >= today && b.status !== 'cancelled')) {
    if (b.bay > proposed.capacity || !proposed.weekdays.includes(new Date(b.date + 'T12:00:00Z').getUTCDay()) || minutes(b.time) < minutes(open) || minutes(b.time) + b.duration > minutes(close) ||
      (proposed.lunchStart && overlap(minutes(b.time), minutes(b.time) + b.duration, minutes(proposed.lunchStart), minutes(proposed.lunchEnd)))) throw new ServiceError(409, 'Новое расписание конфликтует с существующими записями. Сначала перенесите их.');
  }
  state.settings = proposed; return proposed;
}
export function emptyWorkspace(): Workspace { return { revision: 0, settings: { ...DEFAULT_SETTINGS, weekdays: [...DEFAULT_SETTINGS.weekdays] }, bookings: [], blocks: [] }; }
