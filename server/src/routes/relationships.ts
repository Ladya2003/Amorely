import { Router, Request, Response } from 'express';
import User, { UserDocument } from '../models/user';
import Relationship from '../models/relationship';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Получение информации об отношениях пользователя
router.get('/', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId;

    const relationship = await Relationship.findOne({
      $or: [
        { userId: userId },
        { partnerId: userId }
      ]
    });

    if (!relationship) {
      return res.status(404).json({ error: 'Отношения не найдены' });
    }

    // Определяем ID партнера
    const partnerId = relationship.userId.toString() === userId 
      ? relationship.partnerId 
      : relationship.userId;

    // Получаем данные партнера
    const partner = await User.findById(partnerId).select('-password');

    if (!partner) {
      return res.status(404).json({ error: 'Партнер не найден' });
    }

    res.json({
      relationship,
      partner
    });

  } catch (error) {
    console.error('Ошибка при получении информации об отношениях:', error);
    res.status(500).json({ error: 'Ошибка при получении информации об отношениях' });
  }
});

// Добавление партнера
router.post('/', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { partnerEmail, relationshipStartDate } = req.body;
    
    if (!userId || !partnerEmail || !relationshipStartDate) {
      return res.status(400).json({ error: 'Не указаны обязательные поля' });
    }
    
    // Проверяем, существует ли пользователь
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверяем, существует ли партнер
    const partner = await User.findOne({ email: partnerEmail }) as UserDocument;
    if (!partner) {
      return res.status(404).json({ error: 'Партнер с указанным email не найден' });
    }
    
    // Проверяем, не является ли партнер самим пользователем
    if (partner._id.toString() === userId) {
      return res.status(400).json({ error: 'Нельзя добавить себя в качестве партнера' });
    }
    
    // Проверяем, есть ли уже отношения у пользователя или партнера
    const existingRelationship = await Relationship.findOne({
      $or: [
        { userId: userId },
        { partnerId: userId },
        { userId: partner._id },
        { partnerId: partner._id }
      ]
    });
    
    if (existingRelationship) {
      return res.status(400).json({ 
        error: existingRelationship.userId.toString() === userId || existingRelationship.partnerId.toString() === userId
          ? 'У вас уже есть партнер'
          : 'У партнера уже есть отношения'
      });
    }
    
    // Создаем новые отношения
    const newRelationship = new Relationship({
      userId: userId,
      partnerId: partner._id,
      startDate: new Date(relationshipStartDate)
    });
    
    await newRelationship.save();
    
    // Обновляем данные пользователей
    user.partnerId = partner._id;
    partner.partnerId = user._id;
    
    await Promise.all([user.save(), partner.save()]);
    
    // Получаем данные партнера без пароля
    const partnerData = await User.findById(partner._id).select('-password');
    
    return res.status(201).json({
      message: 'Партнер успешно добавлен',
      relationship: newRelationship,
      partner: partnerData
    });
  } catch (error) {
    console.error('Ошибка при добавлении партнера:', error);
    res.status(500).json({ error: 'Ошибка при добавлении партнера' });
  }
});

// Удаление отношений
router.delete('/', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    
    // Находим отношения
    const relationship = await Relationship.findOne({
      $or: [
        { userId: userId },
        { partnerId: userId }
      ]
    });
    
    if (!relationship) {
      return res.status(404).json({ error: 'Отношения не найдены' });
    }
    
    // Получаем ID обоих пользователей
    const user1Id = relationship.userId;
    const user2Id = relationship.partnerId;
    
    // Обновляем данные обоих пользователей
    await User.updateMany(
      { _id: { $in: [user1Id, user2Id] } },
      { $unset: { partnerId: 1 } }
    );
    
    // Удаляем отношения
    await relationship.deleteOne();
    
    res.json({ message: 'Отношения успешно удалены' });
  } catch (error) {
    console.error('Ошибка при удалении отношений:', error);
    res.status(500).json({ error: 'Ошибка при удалении отношений' });
  }
});

export default router; 