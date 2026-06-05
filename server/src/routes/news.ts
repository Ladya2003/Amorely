import express, { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import News from '../models/news';
import { adminMiddleware } from '../middleware/admin';

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

// Получение всех опубликованных новостей
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, limit = 10, page = 1 } = req.query;

    const query: Record<string, unknown> = { isPublished: true };

    if (category) {
      query.category = category;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const news = await News.find(query).sort({ publishDate: -1 }).skip(skip).limit(Number(limit));

    const total = await News.countDocuments(query);

    res.json({
      news,
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

// Получение конкретной новости по ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    res.json(news);
  } catch (error) {
    console.error('Ошибка при получении новости:', error);
    res.status(500).json({ error: 'Ошибка при получении новости' });
  }
});

// Создание новой новости (только для админов)
router.post('/', adminMiddleware, upload.array('media'), async (req: Request, res: Response) => {
  try {
    const { title, content, category, isPublished } = req.body;
    const files = (req.files as Express.Multer.File[]) ?? [];

    if (!title || !content) {
      return res.status(400).json({ error: 'Не указаны обязательные поля' });
    }

    const images = buildMediaFromFiles(files);
    const newNews = new News({
      title,
      content,
      category: category || 'announcement',
      isPublished: isPublished === 'true' || isPublished === true,
      images,
    });

    syncCoverImage(newNews);

    const savedNews = await newNews.save();

    res.status(201).json({
      message: 'Новость успешно создана',
      news: savedNews,
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
    const { title, content, category, isPublished, removedMediaPublicIds } = req.body;
    const files = (req.files as Express.Multer.File[]) ?? [];

    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    if (title) {
      news.title = title;
    }
    if (content) {
      news.content = content;
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

    syncCoverImage(news);
    news.updatedAt = new Date();

    const updatedNews = await news.save();

    res.json({
      message: 'Новость успешно обновлена',
      news: updatedNews,
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
