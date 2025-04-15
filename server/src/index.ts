import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amorely')
  .then(() => console.log('MongoDB подключена'))
  .catch((err: any) => console.error('Ошибка подключения к MongoDB:', err));

// Определение схемы и модели для контента
const contentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  resourceType: { type: String, enum: ['image', 'video'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const Content = mongoose.model('Content', contentSchema);

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
        resourceType: resourceType // Используем определенный тип ресурса
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
    const allContent = await Content.find().sort({ createdAt: -1 });
    res.json(allContent);
  } catch (error) {
    console.error('Ошибка при получении контента:', error);
    res.status(500).json({ error: 'Ошибка при получении контента' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});