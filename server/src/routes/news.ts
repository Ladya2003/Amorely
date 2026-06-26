import express, { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import News from '../models/news';
import { adminMiddleware } from '../middleware/admin';
import {
  formatNewsForAdmin,
  formatNewsForClient,
  normalizeNewsTranslations,
  parseNewsTranslationsInput,
  syncLegacyNewsFields,
} from '../i18n/newsContent';
import { resolveLocale } from '../i18n/locales';
import { getUserLocale } from '../utils/userLocale';
import { notifyNewsPublished } from '../services/pushService';
import { awardNewsRead } from '../utils/currencyRewards';

interface AuthRequest extends Request {
  userId?: string;
}

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'amorely/news',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'],
    resource_type: 'auto',
  } as any,
});

const upload = multer({ storage });

type NewsMediaItem = {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  caption?: string;
};

const getResourceTypeFromFile = (file: Express.Multer.File): 'image' | 'video' => {
  if (file.mimetype?.startsWith('video/')) {
    return 'video';
  }
  if (
    file.originalname &&
    (file.originalname.endsWith('.mp4') ||
      file.originalname.endsWith('.mov') ||
      file.originalname.endsWith('.avi'))
  ) {
    return 'video';
  }
  return 'image';
};

const buildMediaFromFiles = (files: Express.Multer.File[]): NewsMediaItem[] =>
  files.map((file) => {
    const cloudinaryFile = file as Express.Multer.File & { path: string; filename: string };
    const resourceType = getResourceTypeFromFile(file);
    return {
      url: cloudinaryFile.path,
      publicId: cloudinaryFile.filename,
      resourceType,
    };
  });

const getNewsMediaItems = (news: any): NewsMediaItem[] => {
  const items = [...(news.images ?? [])];
  if (news.image?.url && news.image.publicId) {
    const alreadyIncluded = items.some((item: NewsMediaItem) => item.publicId === news.image?.publicId);
    if (!alreadyIncluded) {
      items.unshift({
        url: news.image.url,
        publicId: news.image.publicId,
        resourceType: 'image',
      });
    }
  }
  return items;
};

const deleteNewsMediaFromCloudinary = async (mediaItems: NewsMediaItem[]) => {
  for (const media of mediaItems) {
    if (!media.publicId) {
      continue;
    }
    try {
      await cloudinary.uploader.destroy(media.publicId, {
        resource_type: media.resourceType === 'video' ? 'video' : 'image',
      });
    } catch (cloudinaryError) {
      console.error('Ошибка при удалении медиа новости из Cloudinary:', cloudinaryError);
    }
  }
};

const syncCoverImage = (news: any) => {
  const firstImage = (news.images ?? []).find((item: NewsMediaItem) => item.resourceType === 'image');
  if (firstImage) {
    news.image = {
      url: firstImage.url,
      publicId: firstImage.publicId,
    };
    return;
  }

  const firstMedia = (news.images ?? [])[0];
  if (firstMedia) {
    news.image = {
      url: firstMedia.url,
      publicId: firstMedia.publicId,
    };
    return;
  }

  news.set('image', undefined);
};

const resolveRequestLocale = async (req: AuthRequest) => {
  if (typeof req.query.locale === 'string' && req.query.locale.trim()) {
    return resolveLocale(req.query.locale);
  }
  if (req.userId) {
    return getUserLocale(req.userId);
  }
  return resolveLocale(null);
};

// Получение всех опубликованных новостей
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { category, limit = 10, page = 1 } = req.query;
    const locale = await resolveRequestLocale(req);

    const query: Record<string, unknown> = { isPublished: true };

    if (category) {
      query.category = category;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const news = await News.find(query).sort({ publishDate: -1 }).skip(skip).limit(Number(limit));

    const total = await News.countDocuments(query);

    res.json({
      news: news.map((item) => formatNewsForClient(item, locale)),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Ошибка при получении новостей:', error);
    res.status(500).json({ error: 'Ошибка при получении новостей' });
  }
});

// Отметить новость прочитанной и начислить Аморки (один раз за новость)
router.post('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params;

    const news = await News.findById(id);
    if (!news || !news.isPublished) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    const result = await awardNewsRead(userId, id);

    res.json({
      awarded: result.awarded,
      awardedAmount: result.awarded ? result.amount : 0,
      balance: result.balance,
    });
  } catch (error) {
    console.error('Ошибка при отметке прочтения новости:', error);
    res.status(500).json({ error: 'Ошибка при отметке прочтения новости' });
  }
});

// Получение конкретной новости по ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const locale = await resolveRequestLocale(req);

    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    res.json(formatNewsForClient(news, locale));
  } catch (error) {
    console.error('Ошибка при получении новости:', error);
    res.status(500).json({ error: 'Ошибка при получении новости' });
  }
});

// Создание новой новости (только для админов)
router.post('/', adminMiddleware, upload.array('media'), async (req: Request, res: Response) => {
  try {
    const { title, content, category, isPublished, translations } = req.body;
    const files = (req.files as Express.Multer.File[]) ?? [];

    const parsedTranslations = parseNewsTranslationsInput(translations);
    const effectiveTranslations =
      parsedTranslations ??
      normalizeNewsTranslations({
        title: typeof title === 'string' ? title : '',
        content: typeof content === 'string' ? content : '',
      });

    if (!effectiveTranslations.ru?.title?.trim() || !effectiveTranslations.ru?.content?.trim()) {
      return res.status(400).json({ error: 'Не указаны обязательные поля (русский заголовок и текст)' });
    }

    const images = buildMediaFromFiles(files);
    const newNews = new News({
      category: category || 'announcement',
      isPublished: isPublished === 'true' || isPublished === true,
      images,
      translations: effectiveTranslations,
    });

    syncLegacyNewsFields(newNews);
    syncCoverImage(newNews);

    const savedNews = await newNews.save();

    if (savedNews.isPublished) {
      void notifyNewsPublished({
        newsId: savedNews._id.toString(),
        title: savedNews.translations?.ru?.title || savedNews.title || 'Новая новость'
      });
    }

    res.status(201).json({
      message: 'Новость успешно создана',
      news: formatNewsForAdmin(savedNews),
    });
  } catch (error) {
    console.error('Ошибка при создании новости:', error);
    res.status(500).json({ error: 'Ошибка при создании новости' });
  }
});

// Обновление новости (только для админов)
router.put('/:id', adminMiddleware, upload.array('media'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category, isPublished, removedMediaPublicIds, translations } = req.body;
    const files = (req.files as Express.Multer.File[]) ?? [];

    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    const wasPublished = news.isPublished;

    const parsedTranslations = parseNewsTranslationsInput(translations);
    if (parsedTranslations) {
      news.set('translations', parsedTranslations);
    } else if (title || content) {
      const currentTranslations = normalizeNewsTranslations(news);
      currentTranslations.ru = {
        title: typeof title === 'string' ? title.trim() : currentTranslations.ru?.title ?? news.title ?? '',
        content:
          typeof content === 'string' ? content.trim() : currentTranslations.ru?.content ?? news.content ?? '',
      };
      news.set('translations', currentTranslations);
    }

    if (category) {
      news.category = category;
    }
    if (isPublished !== undefined) {
      news.isPublished = isPublished === 'true' || isPublished === true;
    }

    let removedIds: string[] = [];
    if (removedMediaPublicIds) {
      try {
        removedIds = JSON.parse(removedMediaPublicIds);
      } catch {
        return res.status(400).json({ error: 'Некорректный список удалённых медиа' });
      }
    }

    if (removedIds.length > 0) {
      const currentMedia = getNewsMediaItems(news);
      const removedMedia = currentMedia.filter((item) => removedIds.includes(item.publicId));
      await deleteNewsMediaFromCloudinary(removedMedia);

      const remainingImages = (news.images ?? []).filter(
        (item: { publicId?: string | null }) => !removedIds.includes(item.publicId ?? '')
      );
      news.set('images', remainingImages);
      if (news.image?.publicId && removedIds.includes(news.image.publicId)) {
        news.set('image', undefined);
      }
    }

    if (files.length > 0) {
      const newMedia = buildMediaFromFiles(files);
      news.set('images', [...(news.images ?? []), ...newMedia]);
    }

    syncLegacyNewsFields(news);
    syncCoverImage(news);
    news.updatedAt = new Date();

    const updatedNews = await news.save();

    if (updatedNews.isPublished && !wasPublished) {
      void notifyNewsPublished({
        newsId: updatedNews._id.toString(),
        title: updatedNews.translations?.ru?.title || updatedNews.title || 'Новая новость'
      });
    }

    res.json({
      message: 'Новость успешно обновлена',
      news: formatNewsForAdmin(updatedNews),
    });
  } catch (error) {
    console.error('Ошибка при обновлении новости:', error);
    res.status(500).json({ error: 'Ошибка при обновлении новости' });
  }
});

// Удаление новости (только для админов)
router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    await deleteNewsMediaFromCloudinary(getNewsMediaItems(news));
    await News.findByIdAndDelete(id);

    res.json({
      message: 'Новость успешно удалена',
    });
  } catch (error) {
    console.error('Ошибка при удалении новости:', error);
    res.status(500).json({ error: 'Ошибка при удалении новости' });
  }
});

export default router;
