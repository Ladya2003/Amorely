import express, { Request, Response } from 'express';
import AdminRequest, { ADMIN_REQUEST_CATEGORIES } from '../models/adminRequest';
import User from '../models/user';
import { authMiddleware } from '../middleware/auth';
import { notifyNewAdminRequest } from '../services/pushService';

interface AuthRequest extends Request {
  userId?: string;
}

const router = express.Router();

const MAX_OPEN_REQUESTS = 3;
const MIN_TEXT_LENGTH = 8;
const MAX_TEXT_LENGTH = 5000;

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const category = String(req.body?.category ?? 'question').trim();
    const text = String(req.body?.text ?? '').trim();

    if (!ADMIN_REQUEST_CATEGORIES.includes(category as (typeof ADMIN_REQUEST_CATEGORIES)[number])) {
      return res.status(400).json({ error: 'invalid_category' });
    }

    if (!text) {
      return res.status(400).json({ error: 'text_required' });
    }

    if (text.length < MIN_TEXT_LENGTH) {
      return res.status(400).json({ error: 'text_too_short' });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: 'text_too_long' });
    }

    const openCount = await AdminRequest.countDocuments({ userId, status: 'open' });
    if (openCount >= MAX_OPEN_REQUESTS) {
      return res.status(409).json({ error: 'too_many_open' });
    }

    const user = await User.findById(userId).select('locale');
    const request = await AdminRequest.create({
      userId,
      category,
      text,
      locale: user?.locale || '',
    });

    void notifyNewAdminRequest({
      requestId: request._id.toString(),
      userId,
      category,
      text,
    });

    return res.status(201).json({
      id: request._id.toString(),
      status: request.status,
      createdAt: request.createdAt,
    });
  } catch (error) {
    console.error('Ошибка при создании заявки админу:', error);
    return res.status(500).json({ error: 'submit_failed' });
  }
});

export default router;
