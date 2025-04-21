import express, { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import News from '../models/news';

const router = express.Router();

// Настройка хранилища Cloudinary для multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'amorely/news',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    resource_type: 'image'
  } as any
});

const upload = multer({ storage });

// Получение всех опубликованных новостей
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, limit = 10, page = 1 } = req.query;
    
    const query: any = { isPublished: true };
    
    // Фильтрация по категории, если указана
    if (category) {
      query.category = category;
    }
    
    // Пагинация
    const skip = (Number(page) - 1) * Number(limit);
    
    const news = await News.find(query)
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await News.countDocuments(query);
    
    res.json({
      news,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
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

// Создание новой новости (только для админов в реальном приложении)
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { title, content, category, isPublished } = req.body;
    const file = req.file as Express.Multer.File & { path: string, filename: string };
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Не указаны обязательные поля' });
    }
    
    const newNews = new News({
      title,
      content,
      category: category || 'announcement',
      isPublished: isPublished === 'true',
      image: file ? {
        url: file.path,
        publicId: file.filename
      } : undefined
    });
    
    const savedNews = await newNews.save();
    
    res.status(201).json({
      message: 'Новость успешно создана',
      news: savedNews
    });
  } catch (error) {
    console.error('Ошибка при создании новости:', error);
    res.status(500).json({ error: 'Ошибка при создании новости' });
  }
});

// Обновление новости (только для админов в реальном приложении)
router.put('/:id', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category, isPublished } = req.body;
    const file = req.file as Express.Multer.File & { path: string, filename: string };
    
    const news = await News.findById(id);
    
    if (!news) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }
    
    // Обновляем поля
    if (title) news.title = title;
    if (content) news.content = content;
    if (category) news.category = category;
    if (isPublished !== undefined) news.isPublished = isPublished === 'true';
    
    // Обновляем изображение, если оно было загружено
    if (file) {
      // Удаляем старое изображение из Cloudinary, если оно есть
      if (news.image && news.image.publicId) {
        await cloudinary.uploader.destroy(news.image.publicId);
      }
      
      news.image = {
        url: file.path,
        publicId: file.filename
      };
    }
    
    news.updatedAt = new Date();
    
    const updatedNews = await news.save();
    
    res.json({
      message: 'Новость успешно обновлена',
      news: updatedNews
    });
  } catch (error) {
    console.error('Ошибка при обновлении новости:', error);
    res.status(500).json({ error: 'Ошибка при обновлении новости' });
  }
});

// Удаление новости (только для админов в реальном приложении)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const news = await News.findById(id);
    
    if (!news) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }
    
    // Удаляем изображение из Cloudinary, если оно есть
    if (news.image && news.image.publicId) {
      await cloudinary.uploader.destroy(news.image.publicId);
    }
    
    await News.findByIdAndDelete(id);
    
    res.json({
      message: 'Новость успешно удалена'
    });
  } catch (error) {
    console.error('Ошибка при удалении новости:', error);
    res.status(500).json({ error: 'Ошибка при удалении новости' });
  }
});

export default router; 