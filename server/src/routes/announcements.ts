import express, { Response } from 'express';
import AppAnnouncement from '../models/appAnnouncement';
import { ExtendedRequest } from '../types/mongoose';
import { resolveLocale, type AppLocale } from '../i18n/locales';
import { getLocalizedAnnouncementContent } from '../i18n/announcementContent';
import { awardAnnouncementRead } from '../utils/currencyRewards';
import {
  getReadAnnouncementKeys,
  markAnnouncementRead,
  markAnnouncementReadMany,
} from '../utils/readAnnouncements';

const router = express.Router();

export const listActiveAnnouncements = async (locale: AppLocale, userId?: string) => {
  const announcements = await AppAnnouncement.find({ isActive: true })
    .sort({ publishedAt: -1 })
    .lean();

  const readKeys = userId ? new Set(await getReadAnnouncementKeys(userId)) : new Set<string>();

  return announcements.map((item) => {
    const localized = getLocalizedAnnouncementContent(item, locale);
    return {
      id: item._id.toString(),
      key: item.key,
      title: localized.title,
      preview: localized.preview,
      content: localized.content,
      publishedAt: item.publishedAt,
      isRead: readKeys.has(item.key),
    };
  });
};

router.get('/', async (req: ExtendedRequest, res: Response) => {
  try {
    const locale = resolveLocale(req.query.locale as string | undefined);
    res.json({
      announcements: await listActiveAnnouncements(locale, req.userId),
    });
  } catch (error) {
    console.error('GET /api/announcements error:', error);
    res.status(500).json({ error: 'Failed to load announcements' });
  }
});

router.get('/read-keys', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const readKeys = await getReadAnnouncementKeys(userId);
    res.json({ readKeys });
  } catch (error) {
    console.error('GET /api/announcements/read-keys error:', error);
    res.status(500).json({ error: 'Failed to load read announcements' });
  }
});

router.post('/read', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const announcementKeys = Array.isArray(req.body?.announcementKeys)
      ? req.body.announcementKeys.filter((key: unknown): key is string => typeof key === 'string')
      : [];

    const readKeys = await markAnnouncementReadMany(userId, announcementKeys);
    res.json({ readKeys });
  } catch (error) {
    console.error('POST /api/announcements/read error:', error);
    res.status(500).json({ error: 'Failed to sync read announcements' });
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
    const readKeys = await markAnnouncementRead(userId, announcementKey);

    res.json({
      awarded: result.awarded,
      awardedAmount: result.awarded ? result.amount : 0,
      balance: result.balance,
      readKeys,
    });
  } catch (error) {
    console.error('POST /api/announcements/:key/read error:', error);
    res.status(500).json({ error: 'Failed to mark announcement as read' });
  }
});

export default router;
