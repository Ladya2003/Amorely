import express, { Response } from 'express';
import AppAnnouncement from '../models/appAnnouncement';
import { ExtendedRequest } from '../types/mongoose';
import { resolveLocale } from '../i18n/locales';
import { getLocalizedAnnouncementContent } from '../i18n/announcementContent';

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

export default router;
