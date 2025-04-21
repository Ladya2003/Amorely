import express, { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Content from '../models/content';
import Relationship from '../models/relationship';
import User from '../models/user';
import mongoose from 'mongoose';

const router = express.Router();

// Настройка хранилища Cloudinary для multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'amorely/feed',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'],
    resource_type: 'auto'
  } as any
});

const upload = multer({ storage });

// Получение контента для ленты
router.get('/content', async (req: Request, res: Response) => {
  try {
    const { userId, target } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }
    
    let query: any = {};
    
    if (target === 'self') {
      // Контент пользователя для себя
      query = { userId: userId, targetId: null };
    } else if (target === 'partner') {
      // Контент от партнера для пользователя
      // Сначала находим партнера
      const relationship = await Relationship.findOne({ 
        $or: [
          { userId: userId },
          { partnerId: userId }
        ]
      });
      
      if (!relationship) {
        return res.json([]);
      }
      
      const partnerId = relationship.userId.toString() === userId.toString() 
        ? relationship.partnerId 
        : relationship.userId;
      
      query = { userId: partnerId, targetId: userId };
    } else {
      return res.status(400).json({ error: 'Неверный параметр target' });
    }
    
    // Получаем контент с учетом частоты отображения
    const now = new Date();
    const content = await Content.find({
      ...query,
      $or: [
        { nextDisplay: { $lte: now } },
        { nextDisplay: null }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(content);
  } catch (error) {
    console.error('Ошибка при получении контента:', error);
    res.status(500).json({ error: 'Ошибка при получении контента' });
  }
});

// Добавление нового контента
router.post('/content', upload.array('media'), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { userId, target, frequency, applyNow } = req.body;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Файлы не были загружены' });
    }
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }
    
    // Парсим параметры частоты
    const parsedFrequency = frequency ? JSON.parse(frequency) : { count: 3, hours: 24 };
    
    // Определяем targetId (если контент для партнера)
    let targetId = null;
    if (target === 'partner') {
      const relationship = await Relationship.findOne({ userId });
      if (!relationship) {
        return res.status(400).json({ error: 'Партнер не найден' });
      }
      targetId = relationship.partnerId;
    }
    
    const savedContent = [];
    
    for (const file of files) {
      // Извлекаем информацию о загруженном файле из Cloudinary
      const cloudinaryFile = file as any;
      
      // Определяем тип ресурса
      let resourceType = 'image';
      if (cloudinaryFile.mimetype && cloudinaryFile.mimetype.startsWith('video/')) {
        resourceType = 'video';
      } else if (cloudinaryFile.originalname && 
                (cloudinaryFile.originalname.endsWith('.mp4') || 
                 cloudinaryFile.originalname.endsWith('.mov') || 
                 cloudinaryFile.originalname.endsWith('.avi'))) {
        resourceType = 'video';
      }
      
      // Рассчитываем время следующего отображения
      const now = new Date();
      const nextDisplay = applyNow === 'true' 
        ? now 
        : new Date(now.getTime() + parsedFrequency.hours * 60 * 60 * 1000);
      
      // Создаем новую запись в MongoDB
      const newContent = new Content({
        userId: new mongoose.Types.ObjectId(userId),
        targetId: targetId ? new mongoose.Types.ObjectId(targetId) : null,
        url: cloudinaryFile.path,
        publicId: cloudinaryFile.filename,
        resourceType,
        frequency: parsedFrequency,
        displayedCount: 0,
        nextDisplay
      });
      
      // Сохраняем в базу данных
      const savedItem = await newContent.save();
      savedContent.push(savedItem);
    }
    
    res.json({
      message: 'Контент успешно загружен',
      content: savedContent
    });
  } catch (error) {
    console.error('Ошибка при загрузке контента:', error);
    res.status(500).json({ error: 'Ошибка при загрузке контента' });
  }
});

// Получение информации об отношениях
router.get('/relationship', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }
    
    const relationship = await Relationship.findOne({ 
      $or: [
        { userId },
        { partnerId: userId }
      ]
    });
    
    if (!relationship) {
      return res.json(null);
    }
    
    // Рассчитываем количество дней вместе
    const startDate = new Date(relationship.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    res.json({
      startDate: relationship.startDate,
      daysCount: diffDays,
      photo: relationship.photo?.url,
      signature: relationship.signature
    });
  } catch (error) {
    console.error('Ошибка при получении информации об отношениях:', error);
    res.status(500).json({ error: 'Ошибка при получении информации об отношениях' });
  }
});

// Обновление фото отношений
router.post('/relationship/photo', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const file = req.file as Express.Multer.File & { path: string, filename: string };
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }
    
    if (!file) {
      return res.status(400).json({ error: 'Файл не был загружен' });
    }
    
    const relationship = await Relationship.findOne({ 
      $or: [
        { userId },
        { partnerId: userId }
      ]
    });
    
    if (!relationship) {
      return res.status(404).json({ error: 'Отношения не найдены' });
    }
    
    // Если уже есть фото, удаляем его из Cloudinary
    if (relationship.photo && relationship.photo.publicId) {
      await cloudinary.uploader.destroy(relationship.photo.publicId);
    }
    
    // Обновляем фото
    relationship.photo = {
      url: file.path,
      publicId: file.filename
    };
    
    await relationship.save();
    
    res.json({
      message: 'Фото успешно обновлено',
      photo: relationship.photo.url
    });
  } catch (error) {
    console.error('Ошибка при обновлении фото:', error);
    res.status(500).json({ error: 'Ошибка при обновлении фото' });
  }
});

// Обновление подписи отношений
router.post('/relationship/signature', async (req: Request, res: Response) => {
  try {
    const { userId, signature } = req.body;
    
    if (!userId || !signature) {
      return res.status(400).json({ error: 'Не указаны необходимые параметры' });
    }
    
    const relationship = await Relationship.findOne({ 
      $or: [
        { userId },
        { partnerId: userId }
      ]
    });
    
    if (!relationship) {
      return res.status(404).json({ error: 'Отношения не найдены' });
    }
    
    // Обновляем подпись
    relationship.signature = signature;
    await relationship.save();
    
    res.json({
      message: 'Подпись успешно обновлена',
      signature: relationship.signature
    });
  } catch (error) {
    console.error('Ошибка при обновлении подписи:', error);
    res.status(500).json({ error: 'Ошибка при обновлении подписи' });
  }
});

export default router; 