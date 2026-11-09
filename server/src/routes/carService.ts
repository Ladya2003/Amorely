import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SERVICES, STATUSES, ServiceError, addBlock, createBooking, getSlots, nowInMinsk, setSettings, updateBooking } from '../carService/domain';
import { mutateWorkspace, readWorkspace } from '../carService/store';
import { adminAccess } from '../carService/auth';
import { drainNotifications, telegramConfigured } from '../carService/notifications';

const router = express.Router();
const counters = new Map<string, { count: number; until: number }>();
function limit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (counters.size > 5000) for (const [id, item] of counters) if (item.until < now) counters.delete(id);
  const current = counters.get(key);
  if (!current || current.until < now) { counters.set(key, { count: 1, until: now + windowMs }); return false; }
  current.count++; return current.count > max;
}
async function configured(): Promise<boolean> { return Boolean(await adminAccess()); }
async function protectedRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const access = await adminAccess();
    if (!access) { res.status(503).json({ error: 'Администратор ещё не настроен.' }); return; }
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
    jwt.verify(token, access.sessionSecret, { algorithms: ['HS256'], audience: 'car-service-admin', issuer: 'car-service' });
    next();
  } catch { res.status(401).json({ error: 'Войдите в кабинет администратора.' }); }
}
function asyncRoute(fn: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction): void => { fn(req, res).catch(next); };
}
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
router.get('/health', asyncRoute(async (_req, res) => res.json({ ok: true, module: 'car-service', configured: await configured() })));
router.get('/config', asyncRoute(async (_req, res) => {
  const state = await readWorkspace();
  res.json({ name: 'Смена', city: 'Фаниполь', demo: true, timezone: 'Europe/Minsk', today: nowInMinsk().date, horizonDays: 60, services: SERVICES, settings: state.settings, ready: await configured() });
}));
router.get('/slots', asyncRoute(async (req, res) => {
  const state = await readWorkspace();
  res.json({ date: req.query.date, slots: getSlots(state, String(req.query.date || ''), String(req.query.serviceId || '')) });
}));
router.post('/bookings', asyncRoute(async (req, res) => {
  if (!(await configured())) throw new ServiceError(503, 'Демо записи ещё настраивается. Попробуйте позже.');
  if (limit('booking:' + (req.ip || 'unknown'), 20, 3600000)) throw new ServiceError(429, 'Слишком много тестовых заявок. Попробуйте позже.');
  const result = await mutateWorkspace(state => createBooking(state, req.body || {}, 'website'));
  void drainNotifications();
  res.status(result.created ? 201 : 200).json({ booking: { id: result.booking.id, serviceName: result.booking.serviceName, date: result.booking.date, time: result.booking.time, duration: result.booking.duration, status: result.booking.status } });
}));
router.post('/admin/login', asyncRoute(async (req, res) => {
  if (!(await configured())) throw new ServiceError(503, 'Доступ к админке ещё не настроен.');
  if (limit('login:' + (req.ip || 'unknown'), 10, 15 * 60000)) throw new ServiceError(429, 'Слишком много попыток входа. Повторите через 15 минут.');
  if (typeof req.body?.password !== 'string' || req.body.password.length > 200 || !(await bcrypt.compare(req.body.password, (await adminAccess())!.passwordHash))) throw new ServiceError(401, 'Неверный пароль.');
  const token = jwt.sign({ purpose: 'admin' }, (await adminAccess())!.sessionSecret, { algorithm: 'HS256', expiresIn: '8h', audience: 'car-service-admin', issuer: 'car-service' });
  res.json({ token, expiresIn: 28800 });
}));
router.use('/admin', protectedRoute);
router.get('/admin/state', asyncRoute(async (_req, res) => {
  const state = await readWorkspace();
  res.json({ ...state, services: SERVICES, statuses: STATUSES, telegram: { configured: telegramConfigured(), failed: state.bookings.filter(b => b.notification === 'failed').length } });
  void drainNotifications();
}));
router.post('/admin/bookings', asyncRoute(async (req, res) => {
  const result = await mutateWorkspace(state => createBooking(state, req.body || {}, 'phone'));
  res.status(result.created ? 201 : 200).json({ booking: result.booking });
}));
router.patch('/admin/bookings/:id', asyncRoute(async (req, res) => {
  const booking = await mutateWorkspace(state => updateBooking(state, req.params.id, req.body || {}));
  res.json({ booking });
}));
router.post('/admin/blocks', asyncRoute(async (req, res) => {
  const block = await mutateWorkspace(state => addBlock(state, req.body || {})); res.status(201).json({ block });
}));
router.delete('/admin/blocks/:id', asyncRoute(async (req, res) => {
  await mutateWorkspace(state => { state.blocks = state.blocks.filter(b => b.id !== req.params.id); }); res.json({ ok: true });
}));
router.put('/admin/settings', asyncRoute(async (req, res) => {
  const settings = await mutateWorkspace(state => setSettings(state, req.body || {})); res.json({ settings });
}));
router.post('/admin/notifications/retry', asyncRoute(async (_req, res) => {
  await mutateWorkspace(state => {
    state.bookings.forEach(b => { if (b.notification === 'failed' || b.notification === 'pending') { b.notification = 'pending'; b.notificationAttempts = 0; } });
  });
  void drainNotifications(); res.json({ ok: true });
}));
router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ServiceError) { res.status(error.status).json({ error: error.message }); return; }
  console.error('Car service: request failed.'); res.status(500).json({ error: 'Не удалось выполнить действие. Попробуйте ещё раз.' });
});
const notificationTimer = setInterval(() => { void drainNotifications(); }, 60000);
notificationTimer.unref();
export default router;
