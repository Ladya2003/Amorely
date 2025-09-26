import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import mongoose from 'mongoose';
import http from 'http';
import setupSocketIO from './socket';
import Message from './models/message';
import User from './models/user';
import Content from './models/content';
import feedRoutes from './routes/feed';
import newsRoutes from './routes/news';
import settingsRoutes from './routes/settings';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import { authMiddleware } from './middleware/auth';
import relationshipsRoutes from './routes/relationships';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = setupSocketIO(server);
const PORT = process.env.PORT || 5000;

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amorely')
  .then(() => console.log('MongoDB подключена'))
  .catch((err: any) => console.error('Ошибка подключения к MongoDB:', err));

// Настройка Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Настройка хранилища Cloudinary для multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'amorely',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'],
    resource_type: 'auto' // автоматически определяет тип ресурса (изображение или видео)
  } as any
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API работает!',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

// Тестовый маршрут для проверки API
app.get('/api/test', (req: Request, res: Response) => {
  res.json({
    message: 'Тестовый маршрут API',
    data: {
      name: 'Amorely',
      description: 'Приложение для влюбленных пар',
      features: [
        'Обмен фотографиями',
        'Чат',
        'Календарь важных дат',
        'Планировщик свиданий'
      ]
    }
  });
});

// Маршрут для загрузки медиа в Cloudinary и сохранения в MongoDB
app.post('/api/upload', upload.array('media'), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Файлы не были загружены' });
    }

    // Получаем пользовательскую дату, если она была передана
    const customDate = req.body.date ? new Date(req.body.date) : null;

    const savedContent = [];

    for (const file of files) {
      // Извлекаем информацию о загруженном файле из Cloudinary
      const cloudinaryFile = file as any;
      
      // Определяем тип ресурса на основе mimetype или расширения файла
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
        url: cloudinaryFile.path,
        publicId: cloudinaryFile.filename,
        resourceType: resourceType,
        customDate: customDate // Добавляем пользовательскую дату
      });
      
      // Сохраняем в базу данных
      const savedItem = await newContent.save();
      savedContent.push(savedItem);
    }

    res.json({
      message: 'Файлы успешно загружены и сохранены в базе данных',
      uploads: savedContent
    });
  } catch (error) {
    console.error('Ошибка при загрузке файлов:', error);
    res.status(500).json({ error: 'Ошибка при загрузке файлов' });
  }
});

// Маршрут для получения всего контента из MongoDB
app.get('/api/content', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    
    // Если указаны даты, добавляем их в запрос
    if (startDate && endDate) {
      query = {
        $or: [
          { 
            createdAt: { 
              $gte: new Date(startDate as string), 
              $lte: new Date(endDate as string) 
            } 
          },
          { 
            customDate: { 
              $gte: new Date(startDate as string), 
              $lte: new Date(endDate as string) 
            } 
          }
        ]
      };
    }
    
    const allContent = await Content.find(query).sort({ 
      customDate: -1, 
      createdAt: -1 
    });
    
    res.json(allContent);
  } catch (error) {
    console.error('Ошибка при получении контента:', error);
    res.status(500).json({ error: 'Ошибка при получении контента' });
  }
});

// API для чата
app.get('/api/contacts', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }

    // Получаем всех пользователей, кроме текущего
    const users = await User.find({ _id: { $ne: userId } });
    
    // Для каждого пользователя находим последнее сообщение
    const contacts = await Promise.all(users.map(async (user) => {
      const lastMessage = await Message.findOne({
        $or: [
          { senderId: userId, receiverId: user._id },
          { senderId: user._id, receiverId: userId }
        ]
      }).sort({ createdAt: -1 });

      return {
        id: user._id,
        name: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}`,
        lastMessage: lastMessage ? {
          text: lastMessage.text || 'Медиа-вложение',
          timestamp: lastMessage.createdAt,
          isRead: lastMessage.isRead || lastMessage.senderId.toString() === userId
        } : {
          text: 'Нет сообщений',
          timestamp: new Date(),
          isRead: true
        }
      };
    }));

    res.json(contacts);
  } catch (error) {
    console.error('Ошибка при получении контактов:', error);
    res.status(500).json({ error: 'Ошибка при получении контактов' });
  }
});

app.get('/api/messages', async (req: any, res: Response) => {
  try {
    const { contactId } = req.query;
    const userId = req.userId as string;
    
    if (!userId || !contactId) {
      return res.status(400).json({ error: 'Не указаны необходимые параметры' });
    }

    // Получаем сообщения между пользователями
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });

    // Отмечаем сообщения как прочитанные
    await Message.updateMany(
      { senderId: contactId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json(messages);
  } catch (error) {
    console.error('Ошибка при получении сообщений:', error);
    res.status(500).json({ error: 'Ошибка при получении сообщений' });
  }
});

// Маршруты для ленты
app.use('/api/feed', authMiddleware, feedRoutes);

// Маршруты для новостей
app.use('/api/news', authMiddleware, newsRoutes);

// Маршруты для настроек
app.use('/api/settings', authMiddleware, settingsRoutes);

// Маршруты для аутентификации
app.use('/api/auth', authRoutes);

// Маршруты для чата
app.use('/api', authMiddleware, chatRoutes);

// Маршруты для отношений
app.use('/api/relationships', authMiddleware, relationshipsRoutes);

// Запуск сервера
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});