import express, { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import User, { UserDocument } from '../models/user';
import Relationship from '../models/relationship';
import mongoose from 'mongoose';
import { ExtendedRequest } from '../types/mongoose';

const router = express.Router();

// Настройка хранилища Cloudinary для multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'amorely/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    resource_type: 'image'
  } as any
});

const upload = multer({ storage });

// Получение данных пользователя
router.get('/user/:id', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const clientUserId = req.params.id;
    if (userId !== clientUserId) {
      return res.status(403).json({ error: 'У вас нет доступа к этим данным' });
    }
    
    const user = await User.findById(clientUserId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
  }
});

// Обновление данных пользователя
router.put('/user/:id', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, firstName, lastName, bio, theme } = req.body;
    const file = req.file as Express.Multer.File & { path: string, filename: string };
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Обновляем поля
    if (username && username !== user.username) {
      // Проверяем, не занят ли логин
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Этот логин уже занят' });
      }
      user.username = username;
    }
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio) user.bio = bio;
    if (theme) user.theme = theme;
    
    // Обновляем аватар, если он был загружен
    if (file) {
      // Удаляем старый аватар из Cloudinary, если он есть
      if (user.avatar && user.avatar.includes('cloudinary')) {
        const publicId = user.avatar.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
      
      user.avatar = file.path;
    }
    
    const updatedUser = await user.save();
    
    res.json({
      message: 'Данные пользователя успешно обновлены',
      user: updatedUser
    });
  } catch (error) {
    console.error('Ошибка при обновлении данных пользователя:', error);
    res.status(500).json({ error: 'Ошибка при обновлении данных пользователя' });
  }
});

// Добавление партнера
router.post('/partner', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
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
    
    // Проверяем, есть ли уже отношения у пользователя
    const existingRelationship = await Relationship.findOne({
      $or: [
        { userId: userId },
        { partnerId: userId }
      ]
    });
    
    if (existingRelationship) {
      return res.status(400).json({ error: 'У вас уже есть партнер' });
    }
    
    // Проверяем, есть ли уже отношения у партнера
    const partnerExistingRelationship = await Relationship.findOne({
      $or: [
        { userId: partner._id },
        { partnerId: partner._id }
      ]
    });
    
    if (partnerExistingRelationship) {
      return res.status(400).json({ error: 'У партнера уже есть отношения' });
    }
    
    // Создаем новые отношения
    const newRelationship = new Relationship({
      userId: userId,
      partnerId: partner._id,
      startDate: new Date(relationshipStartDate)
    });
    
    await newRelationship.save();
    
    // Обновляем данные пользователя
    user.partnerId = partner._id;
    await user.save();
    
    // Обновляем данные партнера
    partner.partnerId = user._id;
    await partner.save();
    
    return res.status(201).json({
      message: 'Партнер успешно добавлен',
      relationship: newRelationship,
      partner: {
        _id: partner._id,
        username: partner.username,
        email: partner.email,
        firstName: partner.firstName,
        lastName: partner.lastName,
        avatar: partner.avatar
      },
      relationshipStartDate: relationshipStartDate
    });
  } catch (error) {
    console.error('Ошибка при добавлении партнера:', error);
    res.status(500).json({ error: 'Ошибка при добавлении партнера' });
  }
});

// Удаление партнера
router.delete('/partner/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Проверяем, существует ли пользователь
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверяем, есть ли отношения у пользователя
    const relationship = await Relationship.findOne({
      $or: [
        { userId: userId },
        { partnerId: userId }
      ]
    });
    
    if (!relationship) {
      return res.status(404).json({ error: 'Отношения не найдены' });
    }
    
    // Получаем ID партнера
    const partnerId = relationship.userId.toString() === userId 
      ? relationship.partnerId 
      : relationship.userId;
    
    // Находим партнера
    const partner = await User.findById(partnerId);
    
    // Удаляем отношения
    await Relationship.findByIdAndDelete(relationship._id);
    
    // Обновляем данные пользователя
    user.partnerId = undefined;
    await user.save();
    
    // Обновляем данные партнера, если он существует
    if (partner) {
      partner.partnerId = undefined;
      await partner.save();
    }
    
    res.json({
      message: 'Партнер успешно удален'
    });
  } catch (error) {
    console.error('Ошибка при удалении партнера:', error);
    res.status(500).json({ error: 'Ошибка при удалении партнера' });
  }
});

// Поиск пользователей по email или username
router.get('/search', async (req: ExtendedRequest, res: Response) => {
  try {
    const { query } = req.query;
    const userId = req.userId;
    
    if (!query) {
      return res.status(400).json({ error: 'Не указан поисковый запрос' });
    }
    
    const users = await User.find({
      $and: [
        { _id: { $ne: userId } }, // Исключаем текущего пользователя
        {
          $or: [
            { email: { $regex: query, $options: 'i' } },
            { username: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('_id username email firstName lastName avatar');
    
    res.json(users);
  } catch (error) {
    console.error('Ошибка при поиске пользователей:', error);
    res.status(500).json({ error: 'Ошибка при поиске пользователей' });
  }
});

// Предполагаю, что проблема в этом маршруте или подобном
router.post('/link-partner', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { partnerEmail } = req.body;
    
    // Находим текущего пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Находим партнера по email
    const partner = await User.findOne({ email: partnerEmail }) as UserDocument;
    if (!partner) {
      return res.status(404).json({ error: 'Партнер не найден' });
    }
    
    // Проблема здесь - partner._id имеет тип unknown
    // Исправление: явное приведение типа
    const partnerId = partner._id as mongoose.Types.ObjectId;
    
    // Обновляем пользователя
    user.partnerId = partner._id;
    user.relationshipStartDate = new Date();
    await user.save();
    
    // Обновляем партнера
    partner.partnerId = user._id as mongoose.Types.ObjectId;
    partner.relationshipStartDate = new Date();
    await partner.save();
    
    res.json({ message: 'Партнер успешно привязан', partner: { 
      id: partner._id,
      username: partner.username,
      email: partner.email
    }});
  } catch (error) {
    console.error('Ошибка при привязке партнера:', error);
    res.status(500).json({ error: 'Ошибка при привязке партнера' });
  }
});

export default router; 