import express, { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Content from '../models/content';
import Relationship from '../models/relationship';
import User from '../models/user';
import mongoose from 'mongoose';
import { getActiveContent, initializeContentRotation, updateFrequencyAndRotation, recalculateRotationOrder } from '../utils/contentRotation';

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

// Получение контента для ленты из календаря
router.get('/content', async (req: any, res: Response) => {
  try {
    const { target } = req.query;
    const userId = req.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }

    const formattedUserId = new mongoose.Types.ObjectId(userId);
    
    if (target === 'partner') {
      // Получаем информацию о пользователе и партнере
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      const partnerId = user.partnerId;
      
      // Строим запрос для получения контента
      let query: any = {
        userId: formattedUserId, // Всегда включаем контент пользователя
        showInFeed: true, // Только события, которые должны показываться в ленте
        url: { $ne: '' } // Исключаем текстовые события без медиа
      };

      // Если есть партнер, добавляем его контент
      if (partnerId) {
        query = {
          $or: [
            { userId: formattedUserId },
            { userId: partnerId }
          ],
          showInFeed: true,
          url: { $ne: '' }
        };
      }

      const allMedia = await Content.find(query)
        .populate('userId', 'username avatar')
        .populate('createdBy', 'username avatar')
        .sort({ eventDate: -1, createdAt: -1 });

      // Группируем медиафайлы по eventId и создаем контент для ленты
      const eventsMap = new Map();
      
      allMedia.forEach(media => {
        const key = media.eventId || media._id.toString();
        
        if (!eventsMap.has(key)) {
          // Первое медиафайл события - создаем запись события
          eventsMap.set(key, {
            _id: key,
            eventId: key,
            title: media.title,
            description: media.description,
            eventDate: media.eventDate,
            createdAt: media.createdAt,
            userId: media.userId,
            createdBy: media.createdBy,
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

      // Преобразуем события в формат для ленты
      const feedContent: any[] = [];
      const events = Array.from(eventsMap.values());
      
      events.forEach((event: any) => {
        // Для каждого события добавляем все его медиафайлы в ленту
        event.media.forEach((media: any) => {
          feedContent.push({
            id: media._id,
            _id: media._id,
            url: media.url,
            resourceType: media.resourceType,
            type: media.resourceType === 'video' ? 'video' : 'image',
            title: event.title,
            description: event.description,
            eventDate: event.eventDate,
            createdAt: event.createdAt,
            userId: event.userId,
            createdBy: event.createdBy,
            eventId: event.eventId
          });
        });
      });

      // Сортируем по дате события (новые сверху)
      feedContent.sort((a: any, b: any) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
      
      res.json(feedContent);
    } else {
      return res.status(400).json({ error: 'Неверный параметр target' });
    }
  } catch (error) {
    console.error('Ошибка при получении контента:', error);
    res.status(500).json({ error: 'Ошибка при получении контента' });
  }
});

// Получение всего контента пользователя и партнера для управления
router.get('/user-content', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }

    const formattedUserId = new mongoose.Types.ObjectId(userId);
    
    // Находим партнера
    const relationship = await Relationship.findOne({ 
      $or: [
        { userId: formattedUserId },
        { partnerId: formattedUserId }
      ]
    });
    
    let query: any = { userId: formattedUserId };
    
    if (relationship) {
      const partnerId = relationship.userId.toString() === userId.toString() 
        ? relationship.partnerId 
        : relationship.userId;
      
      // Получаем контент и пользователя, и партнера
      query = {
        $or: [
          { userId: formattedUserId },
          { userId: partnerId }
        ]
      };
    }
    
    // Получаем весь контент без фильтрации по времени
    const content = await Content.find(query)
      .populate('userId', 'name email')
      .sort({ sortOrder: 1, createdAt: -1 }); // Сначала по sortOrder, потом по дате
    
    // Форматируем данные для фронтенда
    const formattedContent = content.map(item => ({
      id: item._id.toString(),
      url: item.url,
      type: item.resourceType === 'video' ? 'video' : 'image',
      name: `${item.resourceType === 'video' ? 'Видео' : 'Фото'}_${item.createdAt.toISOString().split('T')[0]}`,
      size: item.fileSize || 0, // Используем сохраненный размер файла
      uploadedAt: item.createdAt,
      uploadedBy: item.userId,
      publicId: item.publicId,
      frequency: item.frequency // Добавляем информацию о частоте
    }));
    
    res.json(formattedContent);
  } catch (error) {
    console.error('Ошибка при получении контента пользователя:', error);
    res.status(500).json({ error: 'Ошибка при получении контента пользователя' });
  }
});

// Добавление нового контента
router.post('/content', upload.array('media'), async (req: any, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { target, frequency, applyNow } = req.body;
    const userId = req.userId as string;
    
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
      const relationship = await Relationship.findOne({ 
        $or: [
          { userId: new mongoose.Types.ObjectId(userId) },
          { partnerId: new mongoose.Types.ObjectId(userId) }
        ]
      });
      
      if (relationship) {
        // Если партнер найден, устанавливаем targetId
        targetId = relationship.userId.toString() === userId.toString() 
          ? relationship.partnerId 
          : relationship.userId;
      }
      // Если партнер не найден, targetId остается null, но загрузка продолжается
    }
    
    const savedContent = [];
    
    // Получаем максимальный sortOrder для установки новым элементам
    const maxSortOrder = await Content.findOne({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ sortOrder: -1 })
      .select('sortOrder');
    
    let currentSortOrder = (maxSortOrder?.sortOrder || 0) + 1;
    
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
      
      // Создаем новую запись в MongoDB
      const newContent = new Content({
        userId: new mongoose.Types.ObjectId(userId),
        targetId: targetId ? new mongoose.Types.ObjectId(targetId) : null,
        url: cloudinaryFile.path,
        publicId: cloudinaryFile.filename,
        resourceType,
        fileSize: cloudinaryFile.size || 0, // Размер файла из multer
        sortOrder: currentSortOrder++, // Увеличиваем порядок для каждого файла
        frequency: parsedFrequency,
        displayedCount: 0,
        // Инициализация ротации будет выполнена после сохранения всех файлов
        rotationOrder: 0,
        currentBatch: 0,
        isActive: false,
        totalBatches: 0
      });
      
      // Сохраняем в базу данных
      const savedItem = await newContent.save();
      savedContent.push(savedItem);
    }
    
    // После сохранения всех файлов инициализируем ротацию (только если есть партнер)
    if (targetId) {
      await initializeContentRotation(userId, targetId.toString());
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
router.get('/relationship', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }

    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      return res.status(400).json({ error: 'Неверный формат ID пользователя' });
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
      signature: relationship.signature, // Для обратной совместимости
      signatures: relationship.signatures || { user: '', partner: '' },
      ownerId: relationship.userId.toString() // ID владельца отношений для определения текущей роли
    });
  } catch (error) {
    console.error('Ошибка при получении информации об отношениях:', error);
    res.status(500).json({ error: 'Ошибка при получении информации об отношениях' });
  }
});

// Обновление фото отношений
router.post('/relationship/photo', upload.single('photo'), async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
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
router.post('/relationship/signature', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { signature } = req.body;
    
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
    
    // Определяем, какую подпись обновляем (user или partner)
    if (!relationship.signatures) {
      relationship.signatures = { user: '', partner: '' };
    }
    
    const isUser = relationship.userId.toString() === userId;
    if (isUser) {
      relationship.signatures.user = signature;
    } else {
      relationship.signatures.partner = signature;
    }
    
    await relationship.save();
    
    res.json({
      message: 'Подпись успешно обновлена',
      signatures: relationship.signatures
    });
  } catch (error) {
    console.error('Ошибка при обновлении подписи:', error);
    res.status(500).json({ error: 'Ошибка при обновлении подписи' });
  }
});

// Обновление настроек частоты отображения контента
router.put('/content/frequency', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { frequency, applyNow, resetRotation } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }
    
    if (!frequency || !frequency.count || !frequency.hours) {
      return res.status(400).json({ error: 'Не указаны параметры частоты' });
    }
    
    const formattedUserId = new mongoose.Types.ObjectId(userId);
    
    // Находим партнера
    const relationship = await Relationship.findOne({ 
      $or: [
        { userId: formattedUserId },
        { partnerId: formattedUserId }
      ]
    });
    
    if (!relationship) {
      return res.status(400).json({ error: 'Партнер не найден' });
    }
    
    const partnerId = relationship.userId.toString() === userId.toString() 
      ? relationship.partnerId 
      : relationship.userId;
    
    // Используем новую функцию для обновления частоты и ротации
    await updateFrequencyAndRotation(
      userId, 
      partnerId.toString(), 
      frequency, 
      resetRotation === true || resetRotation === 'true'
    );
    
    res.json({
      message: 'Настройки частоты успешно обновлены',
      resetRotation: resetRotation === true || resetRotation === 'true'
    });
  } catch (error) {
    console.error('Ошибка при обновлении настроек частоты:', error);
    res.status(500).json({ error: 'Ошибка при обновлении настроек частоты' });
  }
});

// Удаление контента
router.delete('/content/:id', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const contentId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }
    
    if (!contentId) {
      return res.status(400).json({ error: 'Не указан ID контента' });
    }
    
    // Проверяем валидность ObjectId
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({ error: 'Неверный формат ID контента' });
    }
    
    const formattedUserId = new mongoose.Types.ObjectId(userId);
    
    // Находим контент
    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Контент не найден' });
    }
    
    // Проверяем, может ли пользователь удалить этот контент
    // Пользователь может удалить контент, если он его создатель или если это контент от партнера
    const relationship = await Relationship.findOne({ 
      $or: [
        { userId: formattedUserId },
        { partnerId: formattedUserId }
      ]
    });
    
    let canDelete = false;
    
    if (content.userId.toString() === userId.toString()) {
      // Пользователь является создателем контента
      canDelete = true;
    } else if (relationship) {
      // Проверяем, является ли создатель контента партнером
      const partnerId = relationship.userId.toString() === userId.toString() 
        ? relationship.partnerId 
        : relationship.userId;
      
      if (content.userId.toString() === partnerId.toString()) {
        canDelete = true;
      }
    }
    
    if (!canDelete) {
      return res.status(403).json({ error: 'Нет прав на удаление этого контента' });
    }
    
    // Удаляем файл из Cloudinary
    if (content.publicId) {
      try {
        await cloudinary.uploader.destroy(content.publicId, {
          resource_type: content.resourceType === 'video' ? 'video' : 'image'
        });
      } catch (cloudinaryError) {
        console.error('Ошибка при удалении из Cloudinary:', cloudinaryError);
        // Продолжаем удаление из базы данных даже если не удалось удалить из Cloudinary
      }
    }
    
    // Удаляем запись из базы данных
    await Content.findByIdAndDelete(contentId);
    
    res.json({
      message: 'Контент успешно удален'
    });
  } catch (error) {
    console.error('Ошибка при удалении контента:', error);
    res.status(500).json({ error: 'Ошибка при удалении контента' });
  }
});

// Изменение порядка контента
router.put('/content/reorder', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { sourceId, targetId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }
    
    if (!sourceId || !targetId) {
      return res.status(400).json({ error: 'Не указаны ID контента для перестановки' });
    }
    
    if (sourceId === targetId) {
      return res.json({ message: 'Элементы одинаковые, перестановка не нужна' });
    }
    
    // Проверяем валидность ObjectId
    if (!mongoose.Types.ObjectId.isValid(sourceId) || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: 'Неверный формат ID контента' });
    }
    
    const formattedUserId = new mongoose.Types.ObjectId(userId);
    
    // Находим оба элемента контента
    const sourceContent = await Content.findById(sourceId);
    const targetContent = await Content.findById(targetId);
    
    if (!sourceContent || !targetContent) {
      return res.status(404).json({ error: 'Контент не найден' });
    }
    
    // Проверяем права доступа - пользователь может менять порядок только своего контента или контента партнера
    const relationship = await Relationship.findOne({ 
      $or: [
        { userId: formattedUserId },
        { partnerId: formattedUserId }
      ]
    });
    
    let canReorder = false;
    const allowedUserIds = [formattedUserId.toString()];
    
    if (relationship) {
      const partnerId = relationship.userId.toString() === userId.toString() 
        ? relationship.partnerId 
        : relationship.userId;
      allowedUserIds.push(partnerId.toString());
    }
    
    if (allowedUserIds.includes(sourceContent.userId.toString()) && 
        allowedUserIds.includes(targetContent.userId.toString())) {
      canReorder = true;
    }
    
    if (!canReorder) {
      return res.status(403).json({ error: 'Нет прав на изменение порядка этого контента' });
    }
    
    // Получаем текущие sortOrder
    const sourceSortOrder = sourceContent.sortOrder;
    const targetSortOrder = targetContent.sortOrder;
    
    // Меняем местами sortOrder
    sourceContent.sortOrder = targetSortOrder;
    targetContent.sortOrder = sourceSortOrder;
    
    // Сохраняем изменения
    await sourceContent.save();
    await targetContent.save();
    
    // Пересчитываем rotationOrder для всего контента
    if (relationship) {
      const partnerId = relationship.userId.toString() === userId.toString() 
        ? relationship.partnerId 
        : relationship.userId;
      
      await recalculateRotationOrder(userId, partnerId.toString());
    }
    
    res.json({
      message: 'Порядок контента успешно изменен',
      reorder: {
        source: { id: sourceId, newSortOrder: targetSortOrder },
        target: { id: targetId, newSortOrder: sourceSortOrder }
      }
    });
  } catch (error) {
    console.error('Ошибка при изменении порядка контента:', error);
    res.status(500).json({ error: 'Ошибка при изменении порядка контента' });
  }
});

export default router; 