import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});