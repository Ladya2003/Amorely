import express, { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import User, { UserDocument } from '../models/user';
import Relationship from '../models/relationship';
import mongoose from 'mongoose';
import { ExtendedRequest } from '../types/mongoose';
import { isSupportedLocale, resolveLocale } from '../i18n/locales';

import { awardProfileField, awardSettingsField } from '../utils/currencyRewards';
import { bootstrapDaysAchievementsForRelationship } from '../services/daysAchievementService';

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

const router = express.Router();

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
    const { username, firstName, lastName, bio, birthday, theme, displayBadgeGameId } = req.body;
    const file = req.file as Express.Multer.File & { path: string, filename: string };
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const prevAvatar = user.avatar;
    const prevFirstName = user.firstName;
    const prevLastName = user.lastName;
    const prevBio = user.bio;
    const prevBirthday = user.birthday;
    
    // Обновляем поля
    if (username && username !== user.username) {
      // Проверяем, не занят ли логин
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Этот логин уже занят' });
      }
      user.username = username;
    }
    
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (birthday !== undefined) {
      user.birthday = birthday ? new Date(birthday) : undefined;
    }
    if (theme) user.theme = theme;

    if (displayBadgeGameId !== undefined) {
      const normalized =
        displayBadgeGameId === '' || displayBadgeGameId === 'auto' || displayBadgeGameId === null
          ? null
          : String(displayBadgeGameId);

      if (normalized) {
        const relationship = await Relationship.findOne({
          $or: [{ userId: user._id }, { partnerId: user._id }],
          status: 'active',
        });

        const hasBadge = relationship?.badges?.some((badge) => badge.gameId === normalized);
        if (!hasBadge) {
          return res.status(400).json({ error: 'У вас нет медали для выбранной игры' });
        }
      }

      user.displayBadgeGameId = normalized;
    }
    
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

    let totalAwarded = 0;
    let lastBalance = 0;
    if (file && !prevAvatar) {
      const a = await awardProfileField(id, 'avatar');
      if (a.awarded) { totalAwarded += a.amount; lastBalance = a.balance; }
    }
    if (firstName && !prevFirstName) {
      const a = await awardProfileField(id, 'firstName');
      if (a.awarded) { totalAwarded += a.amount; lastBalance = a.balance; }
    }
    if (lastName && !prevLastName) {
      const a = await awardProfileField(id, 'lastName');
      if (a.awarded) { totalAwarded += a.amount; lastBalance = a.balance; }
    }
    if (bio && !prevBio) {
      const a = await awardProfileField(id, 'bio');
      if (a.awarded) { totalAwarded += a.amount; lastBalance = a.balance; }
    }
    if (birthday && !prevBirthday) {
      const a = await awardProfileField(id, 'birthday');
      if (a.awarded) { totalAwarded += a.amount; lastBalance = a.balance; }
    }
    
    res.json({
      message: 'Данные пользователя успешно обновлены',
      user: updatedUser,
      awardedAmount: totalAwarded,
      balance: lastBalance || undefined,
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
      ],
      status: 'active'
    });
    
    if (existingRelationship) {
      return res.status(400).json({ error: 'У вас уже есть партнер' });
    }
    
    // Проверяем, есть ли уже отношения у партнера
    const partnerExistingRelationship = await Relationship.findOne({
      $or: [
        { userId: partner._id },
        { partnerId: partner._id }
      ],
      status: 'active'
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
    await bootstrapDaysAchievementsForRelationship(newRelationship);
    
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
      ],
      status: 'active'
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
    
    // Не удаляем отношения: помечаем как завершенные
    relationship.status = 'broken_up';
    await relationship.save();
    
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
    await user.save();
    
    // Обновляем партнера
    partner.partnerId = user._id as mongoose.Types.ObjectId;
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

// Обновление настроек уведомлений
router.put('/notifications', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { settings } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    if (!settings?.email || !settings?.push) {
      return res.status(400).json({ error: 'Некорректные настройки уведомлений' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    user.notificationSettings = settings;
    await user.save();

    const notifAward = await awardSettingsField(userId, 'notifications');

    res.json({
      message: 'Настройки уведомлений обновлены',
      notificationSettings: user.notificationSettings,
      awardedAmount: notifAward.awarded ? notifAward.amount : 0,
    });
  } catch (error) {
    console.error('Ошибка при обновлении настроек уведомлений:', error);
    res.status(500).json({ error: 'Ошибка при обновлении настроек уведомлений' });
  }
});

// Обновление темы оформления
router.put('/theme', async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { theme, primaryColor, locale } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const hadTheme = user.theme;
    const hadColor = user.primaryColor;

    if (theme !== undefined) {
      if (!['light', 'dark', 'system'].includes(theme)) {
        return res.status(400).json({ error: 'Некорректная тема оформления' });
      }
      user.theme = theme;
    }

    if (primaryColor !== undefined) {
      if (!['pink', 'purple', 'blue', 'orange', 'dark-red', 'dark-green'].includes(primaryColor)) {
        return res.status(400).json({ error: 'Некорректный основной цвет' });
      }
      user.primaryColor = primaryColor;
    }

    if (locale !== undefined) {
      const normalizedLocale = resolveLocale(String(locale));
      if (!isSupportedLocale(normalizedLocale)) {
        return res.status(400).json({ error: 'Некорректный язык' });
      }
      user.locale = normalizedLocale;
    }

    await user.save();

    let totalAwarded = 0;
    if (theme !== undefined && theme !== hadTheme) {
      const a = await awardSettingsField(userId, 'theme');
      if (a.awarded) totalAwarded += a.amount;
    }
    if (primaryColor !== undefined && primaryColor !== hadColor) {
      const a = await awardSettingsField(userId, 'primaryColor');
      if (a.awarded) totalAwarded += a.amount;
    }

    res.json({
      message: 'Настройки темы обновлены',
      theme: user.theme,
      primaryColor: user.primaryColor,
      locale: user.locale,
      awardedAmount: totalAwarded,
    });
  } catch (error) {
    console.error('Ошибка при обновлении темы:', error);
    res.status(500).json({ error: 'Ошибка при обновлении темы оформления' });
  }
});

export default router; 