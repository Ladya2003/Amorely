import express, { Response } from 'express';
import {
  getBalance,
  getRecentTransactions,
  tryOnceActivityAward,
} from '../services/currencyService';
import { processGameMedalStipends } from '../services/gameMedalStipendService';
import { ExtendedRequest } from '../types/mongoose';

const router = express.Router();

const getWeekKey = (): string => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
};

router.get('/balance', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const wallet = await getBalance(userId);
    const transactions = await getRecentTransactions(userId, 10);
    res.json({ ...wallet, transactions });
  } catch (error) {
    console.error('GET /api/currency/balance error:', error);
    res.status(500).json({ error: 'Failed to load balance' });
  }
});

router.get('/activities', async (_req: ExtendedRequest, res: Response) => {
  try {
    res.json({ activities: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load activities' });
  }
});

router.post('/claim', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const { reason } = req.body;

    const claimConfig: Record<string, { amount: number; key: string; currencyReason: 'days_theme' | 'days_export' | 'manual_claim' }> = {
      days_theme: { amount: 5, key: `days_theme:${userId}`, currencyReason: 'days_theme' },
      days_export: { amount: 5, key: `days_export:${userId}:${getWeekKey()}`, currencyReason: 'days_export' },
    };

    const config = claimConfig[reason];
    if (!config) {
      return res.status(400).json({ error: 'Unknown claim reason' });
    }

    const result = await tryOnceActivityAward(userId, config.key, config.amount, config.currencyReason);

    res.json({
      awarded: result.awarded,
      awardedAmount: result.awarded ? result.amount : 0,
      balance: result.balance,
    });
  } catch (error) {
    console.error('POST /api/currency/claim error:', error);
    res.status(500).json({ error: 'Failed to claim reward' });
  }
});

router.post('/medal-stipends', async (req: ExtendedRequest, res: Response) => {
  const userId = req.userId as string;

  res.status(202).json({ ok: true });

  void processGameMedalStipends(userId).catch((error) => {
    console.error('POST /api/currency/medal-stipends background error:', error);
  });
});

export default router;
