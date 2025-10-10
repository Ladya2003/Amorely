import express, { Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Content from '../models/content';
import User from '../models/user';

const router = express.Router();

// Настройка хранилища Cloudinary для multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'amorely/calendar',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'],
    resource_type: 'auto'
  } as any
});

const upload = multer({ storage });

// Создание нового события в календаре
router.post('/events', upload.array('media'), async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const files = req.files as Express.Multer.File[];
    const { eventDate, title, description } = req.body;

    if (!eventDate || !title) {
      return res.status(400).json({ error: 'Требуются дата и заголовок события' });
    }

    // Получаем информацию о пользователе и партнере
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const partnerId = user.partnerId || userId; // Если нет партнера, используем свой ID

    const savedContent = [];
    
    // Генерируем уникальный eventId для группировки медиафайлов
    const eventId = `event_${Date.now()}_${userId}`;

    // Если есть файлы, сохраняем их
    if (files && files.length > 0) {
      for (const file of files) {
        const cloudinaryFile = file as any;
        
        let resourceType = 'image';
        if (cloudinaryFile.mimetype && cloudinaryFile.mimetype.startsWith('video/')) {
          resourceType = 'video';
        }

        const content = new Content({
          userId: userId,
          targetId: partnerId,
          url: cloudinaryFile.path,
          publicId: cloudinaryFile.filename,
          resourceType: resourceType,
          fileSize: cloudinaryFile.size || 0,
          eventId: eventId, // Связываем все медиафайлы одного события
          eventDate: new Date(eventDate),
          title: title,
          description: description || '',
          showInFeed: true,
          customDate: new Date(eventDate)
        });

        await content.save();
        savedContent.push(content);
      }
    } else {
      // Создаем событие без медиафайлов (только текстовое)
      const content = new Content({
        userId: userId,
        targetId: partnerId,
        url: '', // Пустой URL для текстовых событий
        publicId: `text_${eventId}`,
        resourceType: 'image', // Устанавливаем тип по умолчанию
        fileSize: 0,
        eventId: eventId,
        eventDate: new Date(eventDate),
        title: title,
        description: description || '',
        showInFeed: false, // Текстовые события не показываем в ленте по умолчанию
        customDate: new Date(eventDate)
      });

      await content.save();
      savedContent.push(content);
    }

    res.json({
      message: 'Событие успешно создано',
      content: savedContent
    });
  } catch (error) {
    console.error('Ошибка при создании события:', error);
    res.status(500).json({ 
      error: 'Ошибка при создании события', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Получение всех событий календаря
router.get('/events', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { startDate, endDate, month, year } = req.query;

    // Получаем информацию о пользователе
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const partnerId = user.partnerId;

    let query: any = {
      $or: [
        { userId: userId },
        { targetId: userId }
      ]
    };

    // Фильтрация по датам
    if (startDate && endDate) {
      query.eventDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else if (month && year) {
      const startOfMonth = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endOfMonth = new Date(parseInt(year as string), parseInt(month as string), 0);
      query.eventDate = {
        $gte: startOfMonth,
        $lte: endOfMonth
      };
    }

    const allMedia = await Content.find(query)
      .populate('userId', 'username avatar')
      .sort({ eventDate: -1, createdAt: -1 });

    // Группируем медиафайлы по eventId
    const eventsMap = new Map();
    
    allMedia.forEach(media => {
      const key = media.eventId || media._id.toString();
      
      if (!eventsMap.has(key)) {
        // Первый медиафайл события - создаем запись события
        eventsMap.set(key, {
          _id: key,
          eventId: key,
          title: media.title,
          description: media.description,
          eventDate: media.eventDate,
          createdAt: media.createdAt,
          userId: media.userId,
          media: []
        });
      }
      
      // Добавляем медиафайл в массив
      eventsMap.get(key).media.push({
        _id: media._id,
        url: media.url,
        publicId: media.publicId,
        resourceType: media.resourceType,
        fileSize: media.fileSize
      });
    });

    // Преобразуем Map в массив
    const events = Array.from(eventsMap.values());
    
    res.json(events);
  } catch (error) {
    console.error('Ошибка при получении событий:', error);
    res.status(500).json({ error: 'Ошибка при получении событий' });
  }
});

// Получение конкретного события со всеми медиафайлами
router.get('/events/:id', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params;

    // Ищем все медиафайлы с таким eventId
    const mediaFiles = await Content.find({ eventId: id })
      .populate('userId', 'username avatar')
      .populate('targetId', 'username avatar')
      .sort({ createdAt: 1 }); // Сортируем по порядку добавления

    if (!mediaFiles || mediaFiles.length === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    const firstMedia = mediaFiles[0];

    // Проверяем, что пользователь имеет доступ к этому событию
    if (firstMedia.userId.toString() !== userId && firstMedia.targetId.toString() !== userId) {
      return res.status(403).json({ error: 'Нет доступа к этому событию' });
    }

    // Формируем ответ с группированными медиафайлами
    const event = {
      _id: id,
      eventId: id,
      title: firstMedia.title,
      description: firstMedia.description,
      eventDate: firstMedia.eventDate,
      createdAt: firstMedia.createdAt,
      userId: firstMedia.userId,
      targetId: firstMedia.targetId,
      media: mediaFiles.map(m => ({
        _id: m._id,
        url: m.url,
        publicId: m.publicId,
        resourceType: m.resourceType,
        fileSize: m.fileSize
      }))
    };

    res.json(event);
  } catch (error) {
    console.error('Ошибка при получении события:', error);
    res.status(500).json({ error: 'Ошибка при получении события' });
  }
});

// Обновление события (обновляет все медиафайлы с данным eventId)
router.put('/events/:id', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params; // это eventId
    const { eventDate, title, description, showInFeed } = req.body;

    // Находим все медиафайлы события
    const mediaFiles = await Content.find({ eventId: id });

    if (!mediaFiles || mediaFiles.length === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    // Проверяем, что пользователь - создатель события
    if (mediaFiles[0].userId.toString() !== userId) {
      return res.status(403).json({ error: 'Только создатель может редактировать событие' });
    }

    // Обновляем все медиафайлы события
    const updateData: any = {};
    if (eventDate) updateData.eventDate = new Date(eventDate);
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (showInFeed !== undefined) updateData.showInFeed = showInFeed;

    await Content.updateMany({ eventId: id }, { $set: updateData });

    res.json({
      message: 'Событие успешно обновлено',
      eventId: id
    });
  } catch (error) {
    console.error('Ошибка при обновлении события:', error);
    res.status(500).json({ error: 'Ошибка при обновлении события' });
  }
});

// Удаление события (удаляет все медиафайлы с данным eventId)
router.delete('/events/:id', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params; // это eventId

    // Находим все медиафайлы события
    const mediaFiles = await Content.find({ eventId: id });

    if (!mediaFiles || mediaFiles.length === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    // Проверяем, что пользователь - создатель события
    if (mediaFiles[0].userId.toString() !== userId) {
      return res.status(403).json({ error: 'Только создатель может удалить событие' });
    }

    // Удаляем все файлы из Cloudinary
    for (const media of mediaFiles) {
      try {
        await cloudinary.uploader.destroy(media.publicId, {
          resource_type: media.resourceType as any
        });
      } catch (cloudinaryError) {
        console.error('Ошибка при удалении из Cloudinary:', cloudinaryError);
      }
    }

    // Удаляем все медиафайлы события из базы данных
    await Content.deleteMany({ eventId: id });

    res.json({ message: 'Событие успешно удалено' });
  } catch (error) {
    console.error('Ошибка при удалении события:', error);
    res.status(500).json({ error: 'Ошибка при удалении события' });
  }
});

export default router;

