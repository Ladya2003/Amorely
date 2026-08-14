import express, { Response } from 'express';
import { ExtendedRequest } from '../types/mongoose';
import { resolveLocale } from '../i18n/locales';
import { getUserLocale } from '../utils/userLocale';
import {
  completeDatingIdea,
  generateDatingIdea,
  getDatingIdeaByEventId,
  getDatingIdeasOverview,
  skipDatingIdea,
} from '../services/datingIdeasService';

const router = express.Router();

const resolveRequestLocale = async (req: ExtendedRequest) => {
  if (typeof req.query.locale === 'string' && req.query.locale.trim()) {
    return resolveLocale(req.query.locale);
  }
  if (typeof req.body?.locale === 'string' && req.body.locale.trim()) {
    return resolveLocale(req.body.locale);
  }
  return getUserLocale(req.userId as string);
};

router.get('/', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const locale = await resolveRequestLocale(req);
    const data = await getDatingIdeasOverview(userId, locale);
    res.json(data);
  } catch (error) {
    console.error('Dating ideas GET error:', error);
    res.status(500).json({ error: 'Failed to load dating ideas' });
  }
});

router.post('/generate', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const locale = await resolveRequestLocale(req);
    const result = await generateDatingIdea(userId, locale);

    if ('error' in result) {
      if (result.error === 'NO_PARTNER') {
        return res.status(400).json({ error: 'Partner required' });
      }
      if (result.error === 'INSUFFICIENT_BALANCE') {
        return res.status(402).json({
          error: 'Insufficient balance',
          balance: result.balance,
          required: result.required,
        });
      }
      return res.status(400).json({ error: 'Failed to generate idea' });
    }

    res.json({
      ...result,
      awardedAmount: 0,
    });
  } catch (error) {
    console.error('Dating ideas generate error:', error);
    res.status(500).json({ error: 'Failed to generate dating idea' });
  }
});

router.get('/by-event/:eventId', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const { eventId } = req.params;
    const locale = await resolveRequestLocale(req);
    const result = await getDatingIdeaByEventId(userId, eventId, locale);

    if ('error' in result) {
      if (result.error === 'NO_PARTNER') {
        return res.status(400).json({ error: 'Partner required' });
      }
      return res.status(404).json({ error: 'Idea not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Dating ideas by-event GET error:', error);
    res.status(500).json({ error: 'Failed to load dating idea' });
  }
});

router.post('/:ideaId/skip', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const { ideaId } = req.params;
    const locale = await resolveRequestLocale(req);
    const result = await skipDatingIdea(userId, ideaId, locale);

    if ('error' in result) {
      if (result.error === 'NO_PARTNER') {
        return res.status(400).json({ error: 'Partner required' });
      }
      return res.status(404).json({ error: 'Idea not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Dating ideas skip error:', error);
    res.status(500).json({ error: 'Failed to skip dating idea' });
  }
});

router.post('/:ideaId/complete', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const { ideaId } = req.params;
    const { eventId } = req.body || {};
    const locale = await resolveRequestLocale(req);

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const result = await completeDatingIdea(userId, ideaId, eventId, locale);

    if ('error' in result) {
      if (result.error === 'NO_PARTNER') {
        return res.status(400).json({ error: 'Partner required' });
      }
      return res.status(404).json({ error: 'Idea not found' });
    }

    res.json({
      ...result,
      awardedAmount: result.awardedAmount || 0,
      balance: result.balance,
    });
  } catch (error) {
    console.error('Dating ideas complete error:', error);
    res.status(500).json({ error: 'Failed to complete dating idea' });
  }
});

export default router;
