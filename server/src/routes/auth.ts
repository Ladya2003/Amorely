import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Регистрация нового пользователя
router.post(
  '/register',
  [
    // Валидация входных данных
    body('email').isEmail().withMessage('Введите корректный email'),
    body('username').isLength({ min: 3 }).withMessage('Логин должен содержать минимум 3 символа'),
    body('password').isLength({ min: 8 }).withMessage('Пароль должен содержать минимум 8 символов')
  ],
  async (req: Request, res: Response) => {
    try {
      // Проверяем результаты валидации
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, username, password } = req.body;

      // Проверяем, существует ли пользователь с таким email или username
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        } else {
          return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
        }
      }

      // Создаем нового пользователя
      const newUser = new User({
        email,
        username,
        password
      });

      await newUser.save();

      // Генерируем JWT токен
      const token = jwt.sign(
        { userId: newUser._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Отправляем ответ с токеном и данными пользователя (без пароля)
      const { password: _, ...userWithoutPassword } = newUser.toObject();

      res.status(201).json({
        message: 'Пользователь успешно зарегистрирован',
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Ошибка при регистрации пользователя:', error);
      res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
    }
  }
);

// Вход пользователя
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Находим пользователя по email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверяем пароль
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Генерируем JWT токен
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Отправляем ответ с токеном и данными пользователя (без пароля)
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Ошибка при входе пользователя:', error);
    res.status(500).json({ error: 'Ошибка при входе пользователя' });
  }
});

// Получение данных текущего пользователя
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Получаем токен из заголовка
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Не авторизован' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    
    // Находим пользователя по ID
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Недействительный токен' });
    }
    
    res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
  }
});

// Изменение пароля
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    
    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Не указаны обязательные поля' });
    }
    
    // Находим пользователя по ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверяем старый пароль
    const isPasswordValid = await user.comparePassword(oldPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }
    
    // Обновляем пароль
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Ошибка при изменении пароля:', error);
    res.status(500).json({ error: 'Ошибка при изменении пароля' });
  }
});

export default router; 