import express, { Request, Response } from 'express';
import { processPlanNoteDeadlineReminders } from '../services/planNoteDeadlineService';

const router = express.Router();

const verifyCronSecret = (req: Request, res: Response): boolean => {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    res.status(503).json({ error: 'CRON_SECRET не настроен на сервере' });
    return false;
  }

  const headerSecret = req.header('x-cron-secret')?.trim();
  const querySecret =
    typeof req.query.secret === 'string' ? req.query.secret.trim() : '';
  const provided = headerSecret || querySecret;

  if (provided !== secret) {
    res.status(401).json({ error: 'Неверный секрет cron' });
    return false;
  }

  return true;
};

/**
 * Cron endpoint for plan note deadline reminders.
 *
 * Recommended schedule: every 2 hours.
 * Example: GET /api/cron/plan-deadline-reminders?secret=YOUR_CRON_SECRET
 * Or header: x-cron-secret: YOUR_CRON_SECRET
 */
router.get('/plan-deadline-reminders', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req, res)) {
    return;
  }

  try {
    const result = await processPlanNoteDeadlineReminders();
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error) {
    console.error('Ошибка cron-напоминаний о дедлайнах заметок:', error);
    res.status(500).json({ error: 'Ошибка обработки напоминаний о дедлайнах' });
  }
});

export default router;
