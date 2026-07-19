import express, { Response } from 'express';
import AppAnnouncement from '../models/appAnnouncement';
import { ExtendedRequest } from '../types/mongoose';
import { resolveLocale } from '../i18n/locales';
import { getLocalizedAnnouncementContent } from '../i18n/announcementContent';
import { awardAnnouncementRead } from '../utils/currencyRewards';

const router = express.Router();

router.get('/', async (req: ExtendedRequest, res: Response) => {
  try {
    const locale = resolveLocale(req.query.locale as string | undefined);
    const announcements = await AppAnnouncement.find({ isActive: true })
      .sort({ publishedAt: -1 })
      .lean();

    res.json({
      announcements: announcements.map((item) => {
        const localized = getLocalizedAnnouncementContent(item, locale);
        return {
          id: item._id.toString(),
          key: item.key,
          title: localized.title,
          preview: localized.preview,
          content: localized.content,
          publishedAt: item.publishedAt,
        };
      }),
    });
  } catch (error) {
    console.error('GET /api/announcements error:', error);
    res.status(500).json({ error: 'Failed to load announcements' });
  }
});

router.post('/:key/read', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const announcementKey = String(req.params.key || '').trim();

    if (!announcementKey) {
      return res.status(400).json({ error: 'Announcement key required' });
    }

    const announcement = await AppAnnouncement.findOne({ key: announcementKey, isActive: true });
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const result = await awardAnnouncementRead(userId, announcementKey);

    res.json({
      awarded: result.awarded,
      awardedAmount: result.awarded ? result.amount : 0,
      balance: result.balance,
    });
  } catch (error) {
    console.error('POST /api/announcements/:key/read error:', error);
    res.status(500).json({ error: 'Failed to mark announcement as read' });
  }
});

export default router;
