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
import calendarRoutes from './routes/calendar';
import { authMiddleware } from './middleware/auth';
import relationshipsRoutes from './routes/relationships';
import { startFeedScheduler } from './utils/feedScheduler';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = setupSocketIO(server);
const PORT = process.env.PORT || 5000;

// Подключение к MongoDB
const isLocalDev = process.env.NODE_ENV === 'development';
const mongoUri = isLocalDev ? 'mongodb://localhost:27017/amorely' : process.env.MONGODB_URI || 'mongodb://localhost:27017/amorely';

mongoose.connect(mongoUri)
  .then(() => {
    console.log(`MongoDB подключена: ${isLocalDev ? 'локальная' : 'облачная'}`);
    console.log(`URI: ${mongoUri.replace(/\/\/.*@/, '//***@')}`); // Скрываем пароль в логах
  })
  .catch((err: any) => {
    console.error('Ошибка подключения к MongoDB:', err);
    if (isLocalDev) {
      console.log('💡 Подсказка: Убедитесь, что локальная MongoDB запущена командой: npm run db:start');
    }
  });

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

// Маршрут для загрузки медиа в Cloudinary (для чата - только загрузка без сохранения в Content)
app.post('/api/upload', authMiddleware, upload.array('media'), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Файлы не были загружены' });
    }

    const uploads = [];

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
      
      // Возвращаем только информацию о загруженных файлах
      // Не сохраняем в Content, т.к. это для чата
      uploads.push({
        url: cloudinaryFile.path,
        publicId: cloudinaryFile.filename,
        resourceType: resourceType
      });
    }

    res.json({
      message: 'Файлы успешно загружены',
      uploads: uploads
    });
  } catch (error) {
    console.error('Ошибка при загрузке файлов:', error);
    res.status(500).json({ error: 'Ошибка при загрузке файлов', details: error instanceof Error ? error.message : 'Unknown error' });
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

// Маршруты для календаря
app.use('/api/calendar', authMiddleware, calendarRoutes);

// Запуск сервера
server.listen(PORT, () => {
  startFeedScheduler();
  console.log(`Сервер запущен на порту ${PORT}`);
});