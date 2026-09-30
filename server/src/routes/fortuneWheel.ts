import express, { Response, NextFunction } from 'express';
import { ExtendedRequest } from '../types/mongoose';
import User from '../models/user';
import FortuneWheel from '../models/fortuneWheel';

const router = express.Router();

const MAX_TASKS = 100;
const MAX_TASK_LENGTH = 2000;
const MAX_TITLE_LENGTH = 200;

const requireKaifLifeAccess = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.userId).select('kaifLifeIdeasEnabled');
    if (!user?.kaifLifeIdeasEnabled) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    next();
  } catch (error) {
    console.error('Fortune wheel access check error:', error);
    res.status(500).json({ error: 'Ошибка доступа' });
  }
};

router.use(requireKaifLifeAccess);

const sanitizeTasks = (raw: unknown): string[] | null => {
  if (!Array.isArray(raw)) {
    return null;
  }

  const tasks = raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_TASKS);

  if (tasks.some((task) => task.length > MAX_TASK_LENGTH)) {
    return null;
  }

  return tasks;
};

const sanitizeTitle = (raw: unknown): string | null => {
  if (typeof raw !== 'string') {
    return null;
  }
  return raw.trim().slice(0, MAX_TITLE_LENGTH);
};

const toPayload = (doc: { title: string; tasks: string[]; updatedAt?: Date }) => ({
  title: doc.title ?? '',
  tasks: doc.tasks ?? [],
  updatedAt: doc.updatedAt?.toISOString?.() ?? null,
});

router.get('/', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    let wheel = await FortuneWheel.findOne({ userId });

    if (!wheel) {
      wheel = await FortuneWheel.create({ userId, title: '', tasks: [] });
    }

    res.json({ wheel: toPayload(wheel) });
  } catch (error) {
    console.error('Fortune wheel fetch error:', error);
    res.status(500).json({ error: 'Не удалось загрузить колесо фортуны' });
  }
});

router.put('/', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const title = sanitizeTitle(req.body?.title);
    const tasks = sanitizeTasks(req.body?.tasks);

    if (title === null || tasks === null) {
      return res.status(400).json({ error: 'Некорректные данные' });
    }

    const wheel = await FortuneWheel.findOneAndUpdate(
      { userId },
      { title, tasks },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ wheel: toPayload(wheel!) });
  } catch (error) {
    console.error('Fortune wheel save error:', error);
    res.status(500).json({ error: 'Не удалось сохранить колесо фортуны' });
  }
});

export default router;
