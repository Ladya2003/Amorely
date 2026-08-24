import express, { Request, Response } from 'express';
import { sendSupportInboxEmail } from '../services/emailService';

const router = express.Router();

const MIN_MESSAGE_LENGTH = 8;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_NAME_LENGTH = 120;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 5;

const submissionsByIp = new Map<string, number[]>();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const recent = (submissionsByIp.get(ip) || []).filter((at) => now - at < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    submissionsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  submissionsByIp.set(ip, recent);
  return false;
};

router.post('/support', async (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'too_many_requests' });
    }

    const name = String(req.body?.name ?? '').trim();
    const email = String(req.body?.email ?? '').trim();
    const message = String(req.body?.message ?? '').trim();

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'fields_required' });
    }
    if (name.length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: 'name_too_long' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'invalid_email' });
    }
    if (message.length < MIN_MESSAGE_LENGTH) {
      return res.status(400).json({ error: 'text_too_short' });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: 'text_too_long' });
    }

    await sendSupportInboxEmail({ name, email, message });
    return res.status(201).json({ ok: true });
  } catch {
    console.error('Ошибка при отправке обращения в поддержку');
    return res.status(500).json({ error: 'submit_failed' });
  }
});

export default router;
