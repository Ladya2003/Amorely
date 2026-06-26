import { Router, Response } from 'express';
import User from '../models/user';
import Relationship from '../models/relationship';
import PartnerRequest from '../models/partnerRequest';
import { authMiddleware } from '../middleware/auth';
import { normalizeIdStr } from '../utils/normalizeId';
import { awardPartnerLinked } from '../utils/currencyRewards';
import { bootstrapDaysAchievementsForRelationship } from '../services/daysAchievementService';
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
import {
  findIncomingRequestsForDisplay,
  findOutgoingRequestsForDisplay,
  findPendingRequestBetweenUsers,
  findPendingRequestByIdForUser,
  getOtherUserIdFromRequest,
  isRequestRecipient,
  isRequestSender,
  supersedePendingRequestsForUsers
} from '../utils/partnerRequestHelpers';
import { notifySocketUser } from '../socket';

const router = Router();

const formatUserPreview = (user: {
  _id: { toString(): string };
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}) => ({
  _id: user._id.toString(),
  username: user.username,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  avatar: user.avatar
});

const breakUpRelationshipForUser = async (
  userId: string,
  options: { keepEvents: boolean; keepPlans: boolean }
) => {
  const relationship = await findActiveRelationshipForUser(userId);
  if (!relationship) {
    return null;
  }

  const user1Id = normalizeIdStr(relationship.userId);
  const user2Id = normalizeIdStr(relationship.partnerId);
  if (!user1Id || !user2Id) {
    throw new Error('Invalid relationship data');
  }

  const relationshipLinkedAt = getRelationshipLinkedAt(relationship);

  if (relationshipLinkedAt) {
    await cleanupUserContentOnBreakup(userId, relationshipLinkedAt, {
      keepEvents: options.keepEvents,
      keepPlans: options.keepPlans
    });
  }

  await unlinkUsersPartners(user1Id, user2Id);

  relationship.status = 'broken_up';
  recordBreakupContentChoice(relationship, userId, options);
  await relationship.save();

  const otherUserId = user1Id === userId ? user2Id : user1Id;
  notifySocketUser(otherUserId, 'partner_unlinked', {});

  return { user1Id, user2Id, otherUserId };
};

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

// Входящие заявки стать партнёром
router.get('/requests/incoming', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const requests = await findIncomingRequestsForDisplay(userId);

    res.set('Cache-Control', 'no-store');
    res.json(
      requests.map((request) => {
        const fromUser = request.fromUserId as unknown as {
          _id: { toString(): string };
          username?: string;
          email?: string;
          firstName?: string;
          lastName?: string;
          avatar?: string;
        };

        return {
          _id: request._id,
          status: request.status,
          relationshipStartDate: request.relationshipStartDate,
          createdAt: request.createdAt,
          fromUser: formatUserPreview(fromUser)
        };
      })
    );
  } catch (error) {
    console.error('Ошибка при получении заявок:', error);
    res.status(500).json({ error: 'Ошибка при получении заявок' });
  }
});

// Исходящие заявки стать партнёром
router.get('/requests/outgoing', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const requests = await findOutgoingRequestsForDisplay(userId);

    res.set('Cache-Control', 'no-store');
    res.json(
      requests.map((request) => {
        const toUser = request.toUserId as unknown as {
          _id: { toString(): string };
          username?: string;
          email?: string;
          firstName?: string;
          lastName?: string;
          avatar?: string;
        };

        return {
          _id: request._id,
          status: request.status,
          relationshipStartDate: request.relationshipStartDate,
          createdAt: request.createdAt,
          toUser: formatUserPreview(toUser)
        };
      })
    );
  } catch (error) {
    console.error('Ошибка при получении исходящих заявок:', error);
    res.status(500).json({ error: 'Ошибка при получении исходящих заявок' });
  }
});

// Отправка заявки стать партнёром
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
    if (userRelationship) {
      return res.status(400).json({ error: 'У вас уже есть партнер' });
    }

    const existingRequest = await findPendingRequestBetweenUsers(normalizedUserId, partnerId);
    if (existingRequest) {
      if (isRequestRecipient(existingRequest, normalizedUserId)) {
        return res.status(400).json({
          error: 'Этот пользователь уже отправил вам заявку. Примите или отклоните её в списке ниже.'
        });
      }

      return res.status(400).json({ error: 'Заявка этому пользователю уже отправлена' });
    }

    const partnerRelationship = await findActiveRelationshipForUser(partnerId);

    const newRequest = new PartnerRequest({
      fromUserId: normalizedUserId,
      toUserId: partnerId,
      relationshipStartDate: new Date(relationshipStartDate)
    });

    await newRequest.save();

    const initiatorData = await User.findById(normalizedUserId).select('-password');

    notifySocketUser(partnerId, 'partner_request_received', {
      requestId: newRequest._id.toString(),
      fromUser: initiatorData ? formatUserPreview(initiatorData) : undefined,
      relationshipStartDate: newRequest.relationshipStartDate
    });

    return res.status(201).json({
      message: 'Заявка отправлена',
      request: newRequest,
      partnerHasRelationship: Boolean(partnerRelationship)
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Заявка этому пользователю уже отправлена' });
    }

    console.error('Ошибка при отправке заявки:', error);
    res.status(500).json({ error: 'Ошибка при отправке заявки' });
  }
});

// Принятие заявки
router.post('/requests/:requestId/accept', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { requestId } = req.params;
    const keepEvents = Boolean(req.body?.keepEvents);
    const keepPlans = Boolean(req.body?.keepPlans);

    const request = await findPendingRequestByIdForUser(requestId, userId);
    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена или уже обработана' });
    }

    if (!isRequestRecipient(request, userId)) {
      return res.status(403).json({ error: 'Только получатель может принять заявку' });
    }

    const initiatorId = normalizeIdStr(request.fromUserId);
    const normalizedUserId = normalizeIdStr(userId);
    if (!initiatorId || !normalizedUserId) {
      return res.status(400).json({ error: 'Некорректные данные заявки' });
    }

    const initiatorRelationship = await findActiveRelationshipForUser(initiatorId);
    if (initiatorRelationship) {
      request.status = 'superseded';
      await request.save();
      return res.status(400).json({ error: 'Отправитель заявки уже состоит в отношениях с другим пользователем' });
    }

    const currentRelationship = await findActiveRelationshipForUser(normalizedUserId);
    if (currentRelationship) {
      await breakUpRelationshipForUser(normalizedUserId, { keepEvents, keepPlans });
    }

    const newRelationship = new Relationship({
      userId: initiatorId,
      partnerId: normalizedUserId,
      startDate: new Date(request.relationshipStartDate)
    });

    await newRelationship.save();
    await bootstrapDaysAchievementsForRelationship(newRelationship);
    await linkUsersAsPartners(initiatorId, normalizedUserId);

    request.status = 'accepted';
    await request.save();
    await supersedePendingRequestsForUsers(initiatorId, normalizedUserId);

    const partnerData = await User.findById(normalizedUserId).select('-password');
    const initiatorData = await User.findById(initiatorId).select('-password');

    notifySocketUser(initiatorId, 'partner_linked', {
      partnerId: normalizedUserId,
      partner: partnerData ? formatUserPreview(partnerData) : undefined,
      relationshipStartDate: newRelationship.startDate
    });

    notifySocketUser(initiatorId, 'partner_request_accepted', {
      requestId: request._id.toString()
    });

    void awardPartnerLinked(initiatorId);
    void awardPartnerLinked(normalizedUserId);

    return res.status(200).json({
      message: 'Заявка принята',
      relationship: newRelationship,
      partner: initiatorData ? formatUserPreview(initiatorData) : undefined
    });
  } catch (error) {
    console.error('Ошибка при принятии заявки:', error);
    res.status(500).json({ error: 'Ошибка при принятии заявки' });
  }
});

// Отклонение заявки
router.post('/requests/:requestId/decline', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { requestId } = req.params;

    const request = await findPendingRequestByIdForUser(requestId, userId);
    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена или уже обработана' });
    }

    if (!isRequestRecipient(request, userId)) {
      return res.status(403).json({ error: 'Только получатель может отклонить заявку' });
    }

    request.status = 'declined';
    await request.save();

    const initiatorId = normalizeIdStr(request.fromUserId);
    if (initiatorId) {
      notifySocketUser(initiatorId, 'partner_request_declined', {
        requestId: request._id.toString()
      });
    }

    res.json({ message: 'Заявка отклонена' });
  } catch (error) {
    console.error('Ошибка при отклонении заявки:', error);
    res.status(500).json({ error: 'Ошибка при отклонении заявки' });
  }
});

// Отмена исходящей заявки
router.delete('/requests/:requestId', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { requestId } = req.params;

    const request = await findPendingRequestByIdForUser(requestId, userId);
    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена или уже обработана' });
    }

    if (!isRequestSender(request, userId)) {
      return res.status(403).json({ error: 'Только отправитель может отменить заявку' });
    }

    request.status = 'cancelled';
    await request.save();

    const recipientId = getOtherUserIdFromRequest(request, userId);
    if (recipientId) {
      notifySocketUser(recipientId, 'partner_request_cancelled', {
        requestId: request._id.toString()
      });
    }

    res.json({ message: 'Заявка отменена' });
  } catch (error) {
    console.error('Ошибка при отмене заявки:', error);
    res.status(500).json({ error: 'Ошибка при отмене заявки' });
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
