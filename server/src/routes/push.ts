import express, { Response } from 'express';
import PushSubscription from '../models/pushSubscription';
import { ExtendedRequest } from '../types/mongoose';
import { getVapidPublicKey, isPushConfigured } from '../services/pushService';

const router = express.Router();

router.get('/vapid-public-key', (_req, res: Response) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey || !isPushConfigured()) {
    return res.status(503).json({ error: 'Push-уведомления не настроены на сервере' });
  }
  res.json({ publicKey });
});

router.post('/subscribe', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    if (!isPushConfigured()) {
      return res.status(503).json({ error: 'Push-уведомления не настроены на сервере' });
    }

    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'Некорректная подписка' });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        },
        userAgent: req.headers['user-agent']
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Подписка сохранена' });
  } catch (error) {
    console.error('Ошибка подписки на push:', error);
    res.status(500).json({ error: 'Ошибка подписки на push-уведомления' });
  }
});

router.delete('/subscribe', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { endpoint } = req.body;

    if (endpoint) {
      await PushSubscription.deleteOne({ userId, endpoint });
    } else {
      await PushSubscription.deleteMany({ userId });
    }

    res.json({ message: 'Подписка удалена' });
  } catch (error) {
    console.error('Ошибка отписки от push:', error);
    res.status(500).json({ error: 'Ошибка отписки от push-уведомлений' });
  }
});

export default router;
