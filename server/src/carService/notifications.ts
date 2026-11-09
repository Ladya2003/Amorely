import { Booking } from './domain';
import { mutateWorkspace, readWorkspace } from './store';

let draining = false;
export function telegramConfigured(): boolean { return Boolean(process.env.CAR_SERVICE_TELEGRAM_BOT_TOKEN && process.env.CAR_SERVICE_TELEGRAM_CHAT_ID); }
function message(b: Booking): string {
  return ['🔧 Новая тестовая заявка · Смена', '', b.serviceName, b.date + ' в ' + b.time + ' · ' + b.duration + ' мин', 'Телефон: ' + b.phone,
    b.name ? 'Имя: ' + b.name : '', b.car ? 'Авто: ' + b.car : '', b.comment ? 'Комментарий: ' + b.comment : '',
    '', 'Заявка: ' + b.id.slice(0, 8), process.env.CAR_SERVICE_ADMIN_URL || ''].filter(Boolean).join('\n');
}
export async function drainNotifications(): Promise<void> {
  if (draining || !telegramConfigured()) return;
  draining = true;
  try {
    const state = await readWorkspace(), now = Date.now();
    const candidates = state.bookings.filter(b => b.notificationAttempts < 5 && (
      b.notification === 'pending' ||
      ((b.notification === 'failed' || b.notification === 'sending') && now - new Date(b.notificationUpdatedAt).getTime() > 120000)
    )).slice(0, 10);
    for (const candidate of candidates) {
      const claimed = await mutateWorkspace(s => {
        const b = s.bookings.find(x => x.id === candidate.id);
        if (!b || b.notification === 'sent' || b.notificationAttempts !== candidate.notificationAttempts) return null;
        b.notification = 'sending'; b.notificationAttempts++; b.notificationUpdatedAt = new Date().toISOString(); return { ...b };
      });
      if (!claimed) continue;
      let sent = false;
      try {
        const response = await fetch('https://api.telegram.org/bot' + process.env.CAR_SERVICE_TELEGRAM_BOT_TOKEN + '/sendMessage', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: process.env.CAR_SERVICE_TELEGRAM_CHAT_ID, text: message(claimed), disable_web_page_preview: true }),
          signal: AbortSignal.timeout(8000),
        });
        const result = await response.json() as { ok?: boolean }; sent = response.ok && result.ok === true;
      } catch { /* Booking stays saved; retry later. Never log token, phone or Telegram URL. */ }
      await mutateWorkspace(s => {
        const b = s.bookings.find(x => x.id === claimed.id);
        if (b) { b.notification = sent ? 'sent' : 'failed'; b.notificationUpdatedAt = new Date().toISOString(); }
      });
    }
  } catch { console.warn('Car service: notification delivery deferred.'); }
  finally { draining = false; }
}
