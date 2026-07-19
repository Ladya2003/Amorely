import express, { Response } from 'express';
import { ExtendedRequest } from '../types/mongoose';
import { resolvePartnerContext } from '../utils/resolvePartnerId';
import { resolveLocale } from '../i18n/locales';
import { getUserLocale } from '../utils/userLocale';
import {
  getOrCreateState,
  buildDailyQuestionsResponse,
  getCategoryQuestions,
  submitAnswer,
  getCategoryResults,
  getHistory,
  notifyPartnerAboutQuestions,
} from '../services/dailyQuestionsService';

const router = express.Router();

const resolveRequestLocale = async (req: ExtendedRequest) => {
  if (typeof req.query.locale === 'string' && req.query.locale.trim()) {
    return resolveLocale(req.query.locale);
  }
  return getUserLocale(req.userId as string);
};

router.get('/', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const locale = await resolveRequestLocale(req);
    const { hasPartner } = await resolvePartnerContext(userId);

    if (!hasPartner) {
      return res.json({ hasPartner: false });
    }

    const state = await getOrCreateState(userId);
    if (!state) {
      return res.json({ hasPartner: false });
    }

    res.json(buildDailyQuestionsResponse(state, userId, locale));
  } catch (error) {
    console.error('Daily questions GET error:', error);
    res.status(500).json({ error: 'Failed to load daily questions' });
  }
});

router.get('/category/:categoryId', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const locale = await resolveRequestLocale(req);
    const { categoryId } = req.params;

    const state = await getOrCreateState(userId);
    if (!state) {
      return res.status(404).json({ error: 'No active relationship' });
    }

    const questions = getCategoryQuestions(categoryId, locale);
    if (!questions) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const results = getCategoryResults(state, userId, categoryId, locale);

    res.json({ ...questions, results });
  } catch (error) {
    console.error('Daily questions category GET error:', error);
    res.status(500).json({ error: 'Failed to load category' });
  }
});

router.post('/answer', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const locale = await resolveRequestLocale(req);
    const { categoryId, questionId, value } = req.body;

    if (!categoryId || !questionId || value === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await submitAnswer(
      userId,
      categoryId,
      questionId,
      String(value),
      locale
    );
    res.json(response);
  } catch (error: any) {
    console.error('Daily questions answer error:', error);
    res.status(400).json({ error: error.message || 'Failed to submit answer' });
  }
});

router.get('/results/:categoryId', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const locale = await resolveRequestLocale(req);
    const { categoryId } = req.params;

    const state = await getOrCreateState(userId);
    if (!state) {
      return res.status(404).json({ error: 'No active relationship' });
    }

    const results = getCategoryResults(state, userId, categoryId, locale);
    if (!results) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(results);
  } catch (error) {
    console.error('Daily questions results error:', error);
    res.status(500).json({ error: 'Failed to load results' });
  }
});

router.get('/history', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const locale = await resolveRequestLocale(req);

    const state = await getOrCreateState(userId);
    if (!state) {
      return res.json([]);
    }

    res.json(getHistory(state, userId, locale));
  } catch (error) {
    console.error('Daily questions history error:', error);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

router.post('/notify-partner', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const { categoryId } = req.body;

    await notifyPartnerAboutQuestions(userId, categoryId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Daily questions notify error:', error);
    res.status(400).json({ error: error.message || 'Failed to notify partner' });
  }
});

export default router;
