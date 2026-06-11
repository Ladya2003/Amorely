import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { ACCOUNT_BLOCKED_ERROR, buildBlockReasons, getLocalizedBlockReason } from '../utils/userBlock';

interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'amorely') as { userId: string };

    const user = await User.findById(decoded.userId).select('isBlocked blockedReasons locale role');
    if (!user) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: ACCOUNT_BLOCKED_ERROR,
        blockReason: getLocalizedBlockReason(user),
        blockedReasons: buildBlockReasons(user.blockedReasons),
      });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Ошибка аутентификации:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Недействительный токен' });
    }

    res.status(500).json({ error: 'Ошибка аутентификации' });
  }
};
