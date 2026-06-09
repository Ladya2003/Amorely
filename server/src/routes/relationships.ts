import { Router, Response } from 'express';
import User from '../models/user';
import Relationship from '../models/relationship';
import { authMiddleware } from '../middleware/auth';
import { normalizeIdStr } from '../utils/normalizeId';
import {
  findActiveRelationshipForUser,
  findBrokenUpRelationshipPendingCleanup,
  getPartnerIdFromRelationship,
  linkUsersAsPartners,
  recordBreakupContentChoice,
  unlinkUsersPartners
} from '../utils/relationshipHelpers';
import {
  cleanupUserContentOnBreakup,
  getRelationshipLinkedAt
} from '../utils/breakupContentHelpers';
import { notifySocketUser } from '../socket';

const router = Router();

// Получение информации об отношениях пользователя
router.get('/', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const relationship = await findActiveRelationshipForUser(userId);

    if (!relationship) {
      return res.status(404).json({ error: 'Отношения не найдены' });
    }

    const partnerId = getPartnerIdFromRelationship(relationship, userId);
    if (!partnerId) {
      return res.status(404).json({ error: 'Партнер не найден' });
    }

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
    const userId = req.userId as string;
    const { partnerEmail, relationshipStartDate } = req.body;

    if (!userId || !partnerEmail || !relationshipStartDate) {
      return res.status(400).json({ error: 'Не указаны обязательные поля' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const partner = await User.findOne({ email: partnerEmail }).select('-password');
    if (!partner) {
      return res.status(404).json({ error: 'Партнер с указанным email не найден' });
    }

    const partnerId = normalizeIdStr(partner._id);
    const normalizedUserId = normalizeIdStr(userId);
    if (!partnerId || !normalizedUserId) {
      return res.status(400).json({ error: 'Некорректные данные пользователя' });
    }

    if (partnerId === normalizedUserId) {
      return res.status(400).json({ error: 'Нельзя добавить себя в качестве партнера' });
    }

    const userRelationship = await findActiveRelationshipForUser(normalizedUserId);
    const partnerRelationship = await findActiveRelationshipForUser(partnerId);

    if (userRelationship || partnerRelationship) {
      const blockingRelationship = userRelationship || partnerRelationship;
      const isCurrentUserInRelationship =
        blockingRelationship &&
        (normalizeIdStr(blockingRelationship.userId) === normalizedUserId ||
          normalizeIdStr(blockingRelationship.partnerId) === normalizedUserId);

      return res.status(400).json({
        error: isCurrentUserInRelationship
          ? 'У вас уже есть партнер'
          : 'У партнера уже есть отношения'
      });
    }

    const newRelationship = new Relationship({
      userId: normalizedUserId,
      partnerId,
      startDate: new Date(relationshipStartDate)
    });

    await newRelationship.save();
    await linkUsersAsPartners(normalizedUserId, partnerId);

    const partnerData = await User.findById(partnerId).select('-password');
    const initiatorData = await User.findById(normalizedUserId).select('-password');

    notifySocketUser(partnerId, 'partner_linked', {
      partnerId: normalizedUserId,
      partner: initiatorData
        ? {
            _id: initiatorData._id.toString(),
            username: initiatorData.username,
            email: initiatorData.email,
            firstName: initiatorData.firstName,
            lastName: initiatorData.lastName,
            avatar: initiatorData.avatar
          }
        : undefined,
      relationshipStartDate: newRelationship.startDate
    });

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
    const userId = req.userId as string;
    const keepEvents = Boolean(req.body?.keepEvents);
    const keepPlans = Boolean(req.body?.keepPlans);
    const relationship = await findActiveRelationshipForUser(userId);

    if (!relationship) {
      return res.status(404).json({ error: 'Отношения не найдены' });
    }

    const user1Id = normalizeIdStr(relationship.userId);
    const user2Id = normalizeIdStr(relationship.partnerId);
    if (!user1Id || !user2Id) {
      return res.status(500).json({ error: 'Некорректные данные отношений' });
    }

    const relationshipLinkedAt = getRelationshipLinkedAt(relationship);

    if (relationshipLinkedAt) {
      await cleanupUserContentOnBreakup(userId, relationshipLinkedAt, {
        keepEvents,
        keepPlans
      });
    }

    await unlinkUsersPartners(user1Id, user2Id);

    relationship.status = 'broken_up';
    recordBreakupContentChoice(relationship, userId, { keepEvents, keepPlans });
    await relationship.save();

    notifySocketUser(user1Id === userId ? user2Id : user1Id, 'partner_unlinked', {});

    res.json({ message: 'Отношения успешно удалены' });
  } catch (error) {
    console.error('Ошибка при удалении отношений:', error);
    res.status(500).json({ error: 'Ошибка при удалении отношений' });
  }
});

// Проверка, нужно ли партнёру выбрать судьбу контента после расставания
router.get('/pending-breakup-cleanup', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const relationship = await findBrokenUpRelationshipPendingCleanup(userId);

    if (!relationship) {
      res.set('Cache-Control', 'no-store');
      return res.json({ pending: false });
    }

    res.set('Cache-Control', 'no-store');
    res.json({
      pending: true,
      relationshipStartDate: relationship.startDate
    });
  } catch (error) {
    console.error('Ошибка при проверке расставания:', error);
    res.status(500).json({ error: 'Ошибка при проверке расставания' });
  }
});

// Обработка выбора контента партнёром после расставания
router.post('/breakup-content', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const keepEvents = Boolean(req.body?.keepEvents);
    const keepPlans = Boolean(req.body?.keepPlans);
    const relationship = await findBrokenUpRelationshipPendingCleanup(userId);

    if (!relationship) {
      return res.status(404).json({ error: 'Нет ожидающего расставания' });
    }

    const relationshipLinkedAt = getRelationshipLinkedAt(relationship);

    if (relationshipLinkedAt) {
      await cleanupUserContentOnBreakup(userId, relationshipLinkedAt, {
        keepEvents,
        keepPlans
      });
    }

    recordBreakupContentChoice(relationship, userId, { keepEvents, keepPlans });
    await relationship.save();

    res.json({ message: 'Контент после расставания обработан' });
  } catch (error) {
    console.error('Ошибка при обработке контента после расставания:', error);
    res.status(500).json({ error: 'Ошибка при обработке контента после расставания' });
  }
});

export default router;
