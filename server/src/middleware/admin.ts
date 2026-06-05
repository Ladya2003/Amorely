import { Response, NextFunction } from 'express';
import User from '../models/user';
import { ExtendedRequest } from '../types/mongoose';

export const adminMiddleware = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const user = await User.findById(req.userId).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    next();
  } catch (error) {
    console.error('Ошибка проверки прав администратора:', error);
    res.status(500).json({ error: 'Ошибка проверки прав администратора' });
  }
};
