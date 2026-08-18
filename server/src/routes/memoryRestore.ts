import express, { Response } from 'express';
import mongoose from 'mongoose';
import MemoryRestoreRequest from '../models/memoryRestoreRequest';
import Content from '../models/content';
import PlanNote from '../models/planNote';
import User from '../models/user';
import { resolvePartnerContext } from '../utils/resolvePartnerId';
import { idsEqual, normalizeIdStr } from '../utils/normalizeId';
import { notifySocketUser } from '../socket';
import { notifyMemoryRestoreRequest } from '../services/pushService';
import { sendSystemChatText } from '../services/systemChatService';
import {
  buildMemoryRestoreAcceptedText,
  buildMemoryRestoreDeclinedText
} from '../utils/memoryRestoreNotifyText';

const router = express.Router();

const OPEN_STATUSES = ['pending', 'in_progress'] as const;
const DISPLAY_LIMIT = 30;

type EncryptedPayload = { ciphertext?: string; iv?: string };

const formatEncryptedPayload = (value: EncryptedPayload | undefined) => {
  if (!value?.ciphertext || !value?.iv) return undefined;
  return {
    ciphertext: String(value.ciphertext),
    iv: String(value.iv)
  };
};

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

const formatProgress = (progress?: {
  events?: number;
  plans?: number;
  feed?: number;
  failed?: number;
  total?: number;
} | null) => ({
  events: Number(progress?.events || 0),
  plans: Number(progress?.plans || 0),
  feed: Number(progress?.feed || 0),
  failed: Number(progress?.failed || 0),
  total: Number(progress?.total || 0)
});

const formatRequest = (
  request: {
    _id: { toString(): string };
    fromUserId: unknown;
    toUserId: unknown;
    status: string;
    requesterDeviceId?: string | null;
    progress?: {
      events?: number;
      plans?: number;
      feed?: number;
      failed?: number;
      total?: number;
    } | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    completedAt?: Date | null;
  },
  peerUser: Parameters<typeof formatUserPreview>[0] | null,
  direction: 'incoming' | 'outgoing'
) => ({
  _id: request._id.toString(),
  status: request.status,
  requesterDeviceId: request.requesterDeviceId || '',
  progress: formatProgress(request.progress),
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
  completedAt: request.completedAt,
  fromUserId: normalizeIdStr(request.fromUserId),
  toUserId: normalizeIdStr(request.toUserId),
  peerUser: peerUser ? formatUserPreview(peerUser) : undefined,
  direction
});

const findOpenRequestBetween = (fromUserId: string, toUserId: string) =>
  MemoryRestoreRequest.findOne({
    fromUserId: new mongoose.Types.ObjectId(fromUserId),
    toUserId: new mongoose.Types.ObjectId(toUserId),
    status: { $in: [...OPEN_STATUSES] }
  }).sort({ createdAt: -1 });

const loadRequestForUser = async (requestId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return null;
  }

  const request = await MemoryRestoreRequest.findById(requestId);
  if (!request) {
    return null;
  }

  const fromId = normalizeIdStr(request.fromUserId);
  const toId = normalizeIdStr(request.toUserId);
  if (!idsEqual(fromId, userId) && !idsEqual(toId, userId)) {
    return null;
  }

  return request;
};

const assertHelperCanWriteCopies = async (requestId: string, userId: string) => {
  const request = await loadRequestForUser(requestId, userId);
  if (!request) {
    return { ok: false as const, error: { status: 404, message: 'Заявка не найдена' } };
  }

  if (!idsEqual(request.toUserId, userId)) {
    return { ok: false as const, error: { status: 403, message: 'Только партнёр может восстановить копии' } };
  }

  if (request.status !== 'in_progress') {
    return { ok: false as const, error: { status: 409, message: 'Заявка ещё не принята' } };
  }

  const { partnerId, hasPartner } = await resolvePartnerContext(userId);
  const requesterId = normalizeIdStr(request.fromUserId);
  if (!hasPartner || !requesterId || !idsEqual(partnerId, requesterId)) {
    return { ok: false as const, error: { status: 403, message: 'Нет активного партнёра для этой заявки' } };
  }

  return { ok: true as const, request, helperId: userId, requesterId };
};

const ownerIdOf = (value: unknown): string | null => normalizeIdStr(value);

const notifyRequesterViaSystemChat = async (
  requesterId: string | null | undefined,
  kind: 'accepted' | 'declined'
) => {
  if (!requesterId) {
    return;
  }

  try {
    const requester = await User.findById(requesterId).select('locale');
    const text =
      kind === 'accepted'
        ? buildMemoryRestoreAcceptedText(requester?.locale)
        : buildMemoryRestoreDeclinedText(requester?.locale);
    await sendSystemChatText(requesterId, text);
  } catch (error) {
    console.error('Ошибка при системном уведомлении о восстановлении воспоминаний:', error);
  }
};

router.post('/', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const requesterDeviceId = String(req.body?.requesterDeviceId || '').trim().slice(0, 200);
    const { partnerId, hasPartner } = await resolvePartnerContext(userId);

    if (!hasPartner) {
      return res.status(400).json({ error: 'Нужен активный партнёр, чтобы отправить заявку' });
    }

    const existing = await findOpenRequestBetween(userId, partnerId);
    if (existing) {
      return res.status(200).json({
        message: 'Заявка уже отправлена',
        request: formatRequest(existing, null, 'outgoing'),
        alreadyExists: true
      });
    }

    const created = await MemoryRestoreRequest.create({
      fromUserId: new mongoose.Types.ObjectId(userId),
      toUserId: new mongoose.Types.ObjectId(partnerId),
      requesterDeviceId,
      status: 'pending'
    });

    const fromUser = await User.findById(userId).select('username email firstName lastName avatar');
    notifySocketUser(partnerId, 'memory_restore_request_received', {
      requestId: created._id.toString(),
      fromUser: fromUser ? formatUserPreview(fromUser) : undefined
    });
    void notifyMemoryRestoreRequest({
      receiverId: partnerId,
      senderId: userId,
      senderName: fromUser
        ? [fromUser.firstName, fromUser.lastName].filter(Boolean).join(' ').trim() || fromUser.username
        : undefined
    });

    return res.status(201).json({
      message: 'Заявка отправлена партнёру',
      request: formatRequest(created, null, 'outgoing')
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Заявка этому партнёру уже отправлена' });
    }
    console.error('Ошибка при создании заявки на восстановление воспоминаний:', error);
    return res.status(500).json({ error: 'Не удалось отправить заявку' });
  }
});

router.get('/incoming', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const requests = await MemoryRestoreRequest.find({
      toUserId: new mongoose.Types.ObjectId(userId)
    })
      .sort({ createdAt: -1 })
      .limit(DISPLAY_LIMIT)
      .populate('fromUserId', 'username email firstName lastName avatar');

    res.set('Cache-Control', 'no-store');
    return res.json(
      requests.map((request) =>
        formatRequest(request, request.fromUserId as unknown as Parameters<typeof formatUserPreview>[0], 'incoming')
      )
    );
  } catch (error) {
    console.error('Ошибка при загрузке входящих заявок на восстановление:', error);
    return res.status(500).json({ error: 'Не удалось загрузить заявки' });
  }
});

router.get('/outgoing', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const requests = await MemoryRestoreRequest.find({
      fromUserId: new mongoose.Types.ObjectId(userId)
    })
      .sort({ createdAt: -1 })
      .limit(DISPLAY_LIMIT)
      .populate('toUserId', 'username email firstName lastName avatar');

    res.set('Cache-Control', 'no-store');
    return res.json(
      requests.map((request) =>
        formatRequest(request, request.toUserId as unknown as Parameters<typeof formatUserPreview>[0], 'outgoing')
      )
    );
  } catch (error) {
    console.error('Ошибка при загрузке исходящих заявок на восстановление:', error);
    return res.status(500).json({ error: 'Не удалось загрузить заявки' });
  }
});

router.get('/pending-count', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const count = await MemoryRestoreRequest.countDocuments({
      toUserId: new mongoose.Types.ObjectId(userId),
      status: 'pending'
    });
    res.set('Cache-Control', 'no-store');
    return res.json({ count });
  } catch (error) {
    console.error('Ошибка при подсчёте заявок на восстановление:', error);
    return res.status(500).json({ error: 'Не удалось загрузить заявки' });
  }
});

router.post('/:id/accept', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const request = await loadRequestForUser(req.params.id, userId);
    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    if (!idsEqual(request.toUserId, userId)) {
      return res.status(403).json({ error: 'Только партнёр может принять заявку' });
    }
    if (request.status !== 'pending' && request.status !== 'in_progress' && request.status !== 'failed') {
      return res.status(409).json({ error: 'Заявку нельзя принять повторно' });
    }

    const { partnerId, hasPartner } = await resolvePartnerContext(userId);
    if (!hasPartner || !idsEqual(partnerId, request.fromUserId)) {
      return res.status(403).json({ error: 'Нет активного партнёра для этой заявки' });
    }

    request.status = 'in_progress';
    await request.save();

    notifySocketUser(normalizeIdStr(request.fromUserId) || '', 'memory_restore_request_updated', {
      requestId: request._id.toString(),
      status: request.status
    });

    return res.json({
      message: 'Заявка принята',
      request: formatRequest(request, null, 'incoming')
    });
  } catch (error) {
    console.error('Ошибка при принятии заявки на восстановление:', error);
    return res.status(500).json({ error: 'Не удалось принять заявку' });
  }
});

router.post('/:id/decline', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const request = await loadRequestForUser(req.params.id, userId);
    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    if (!idsEqual(request.toUserId, userId)) {
      return res.status(403).json({ error: 'Только партнёр может отклонить заявку' });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({ error: 'Отклонить можно только новую заявку' });
    }

    request.status = 'declined';
    await request.save();

    const requesterId = normalizeIdStr(request.fromUserId);
    notifySocketUser(requesterId || '', 'memory_restore_request_updated', {
      requestId: request._id.toString(),
      status: request.status
    });
    void notifyRequesterViaSystemChat(requesterId, 'declined');

    return res.json({
      message: 'Заявка отклонена',
      request: formatRequest(request, null, 'incoming')
    });
  } catch (error) {
    console.error('Ошибка при отклонении заявки на восстановление:', error);
    return res.status(500).json({ error: 'Не удалось отклонить заявку' });
  }
});

router.post('/:id/cancel', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const request = await loadRequestForUser(req.params.id, userId);
    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    if (!idsEqual(request.fromUserId, userId)) {
      return res.status(403).json({ error: 'Отменить может только отправитель' });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({ error: 'Отменить можно только заявку в ожидании' });
    }

    request.status = 'cancelled';
    await request.save();

    notifySocketUser(normalizeIdStr(request.toUserId) || '', 'memory_restore_request_updated', {
      requestId: request._id.toString(),
      status: request.status
    });

    return res.json({
      message: 'Заявка отменена',
      request: formatRequest(request, null, 'outgoing')
    });
  } catch (error) {
    console.error('Ошибка при отмене заявки на восстановление:', error);
    return res.status(500).json({ error: 'Не удалось отменить заявку' });
  }
});

router.post('/:id/complete', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const access = await assertHelperCanWriteCopies(req.params.id, userId);
    if (!access.ok) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const request = access.request;
    const progress = formatProgress(req.body?.progress);
    request.progress = progress;
    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();

    notifySocketUser(access.requesterId, 'memory_restore_request_updated', {
      requestId: request._id.toString(),
      status: request.status,
      progress
    });
    void notifyRequesterViaSystemChat(access.requesterId, 'accepted');

    return res.json({
      message: 'Воспоминания восстановлены',
      request: formatRequest(request, null, 'incoming')
    });
  } catch (error) {
    console.error('Ошибка при завершении восстановления воспоминаний:', error);
    return res.status(500).json({ error: 'Не удалось завершить восстановление' });
  }
});

router.post('/:id/fail', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const access = await assertHelperCanWriteCopies(req.params.id, userId);
    if (!access.ok) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const request = access.request;
    request.status = 'failed';
    request.progress = formatProgress(req.body?.progress);
    await request.save();

    notifySocketUser(access.requesterId, 'memory_restore_request_updated', {
      requestId: request._id.toString(),
      status: request.status
    });

    return res.json({
      message: 'Восстановление не завершено',
      request: formatRequest(request, null, 'incoming')
    });
  } catch (error) {
    console.error('Ошибка при отметке сбоя восстановления:', error);
    return res.status(500).json({ error: 'Не удалось обновить заявку' });
  }
});

router.patch('/:id/event-copies', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const access = await assertHelperCanWriteCopies(req.params.id, userId);
    if (!access.ok) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const eventId = String(req.body?.eventId || '').trim();
    if (!eventId) {
      return res.status(400).json({ error: 'Не указан eventId' });
    }

    const mediaFiles = await Content.find({ eventId });
    if (!mediaFiles.length) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    const ownerId = ownerIdOf(mediaFiles[0].userId);
    if (!ownerId || (!idsEqual(ownerId, access.helperId) && !idsEqual(ownerId, access.requesterId))) {
      return res.status(403).json({ error: 'Событие не относится к этой паре' });
    }

    const isRequesterOwned = idsEqual(ownerId, access.requesterId);
    const updateData: Record<string, unknown> = {};

    if (isRequesterOwned) {
      const selfTitle = formatEncryptedPayload(req.body?.encryptedTitle);
      const selfDescription = formatEncryptedPayload(req.body?.encryptedDescription);
      if (selfTitle) updateData.encryptedTitle = selfTitle;
      if (selfDescription) updateData.encryptedDescription = selfDescription;
      if (selfTitle || selfDescription) {
        updateData.metadataRecipientId = new mongoose.Types.ObjectId(access.helperId);
      }
    } else {
      const partnerTitle = formatEncryptedPayload(req.body?.encryptedTitlePartner);
      const partnerDescription = formatEncryptedPayload(req.body?.encryptedDescriptionPartner);
      if (partnerTitle) updateData.encryptedTitlePartner = partnerTitle;
      if (partnerDescription) updateData.encryptedDescriptionPartner = partnerDescription;
    }

    if (Object.keys(updateData).length > 0) {
      await Content.updateMany({ eventId, userId: new mongoose.Types.ObjectId(ownerId) }, { $set: updateData });
    }

    if (Array.isArray(req.body?.mediaCopies)) {
      for (const item of req.body.mediaCopies) {
        const mediaId = String(item?.mediaId || '');
        if (!mediaId || !mongoose.Types.ObjectId.isValid(mediaId)) continue;

        const mediaUpdate: Record<string, unknown> = {};
        if (isRequesterOwned) {
          const selfEnvelope = formatEncryptedPayload(item?.encryptedMediaEnvelope);
          if (selfEnvelope) mediaUpdate.encryptedMediaEnvelope = selfEnvelope;
        } else {
          const partnerEnvelope = formatEncryptedPayload(item?.encryptedMediaEnvelopePartner);
          if (partnerEnvelope) mediaUpdate.encryptedMediaEnvelopePartner = partnerEnvelope;
        }

        if (Object.keys(mediaUpdate).length === 0) continue;
        await Content.updateOne(
          { _id: mediaId, eventId, userId: new mongoose.Types.ObjectId(ownerId) },
          { $set: mediaUpdate }
        );
      }
    }

    return res.json({ message: 'Копии события обновлены', eventId });
  } catch (error) {
    console.error('Ошибка при сохранении восстановленных копий события:', error);
    return res.status(500).json({ error: 'Не удалось сохранить копии события' });
  }
});

router.patch('/:id/plan-copies', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const access = await assertHelperCanWriteCopies(req.params.id, userId);
    if (!access.ok) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const planId = String(req.body?.planId || '').trim();
    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ error: 'Не указан planId' });
    }

    const note = await PlanNote.findById(planId);
    if (!note) {
      return res.status(404).json({ error: 'Заметка не найдена' });
    }

    const ownerId = ownerIdOf(note.userId) || ownerIdOf(note.createdBy);
    if (!ownerId || (!idsEqual(ownerId, access.helperId) && !idsEqual(ownerId, access.requesterId))) {
      return res.status(403).json({ error: 'Заметка не относится к этой паре' });
    }

    const isRequesterOwned = idsEqual(ownerId, access.requesterId);

    if (isRequesterOwned) {
      const selfTitle = formatEncryptedPayload(req.body?.encryptedTitle);
      const selfContent = formatEncryptedPayload(req.body?.encryptedContent);
      const selfCategory = formatEncryptedPayload(req.body?.encryptedCategory);
      if (selfTitle) note.encryptedTitle = selfTitle;
      if (selfContent) note.encryptedContent = selfContent;
      if (selfCategory) note.encryptedCategory = selfCategory;
      if (selfTitle || selfContent || selfCategory) {
        note.metadataRecipientId = new mongoose.Types.ObjectId(access.helperId);
      }
    } else {
      const partnerTitle = formatEncryptedPayload(req.body?.encryptedTitlePartner);
      const partnerContent = formatEncryptedPayload(req.body?.encryptedContentPartner);
      const partnerCategory = formatEncryptedPayload(req.body?.encryptedCategoryPartner);
      if (partnerTitle) note.encryptedTitlePartner = partnerTitle;
      if (partnerContent) note.encryptedContentPartner = partnerContent;
      if (partnerCategory) note.encryptedCategoryPartner = partnerCategory;
    }

    if (Array.isArray(req.body?.mediaCopies)) {
      for (const item of req.body.mediaCopies) {
        const mediaId = String(item?.mediaId || '');
        if (!mediaId) continue;
        const media = note.media.id(mediaId);
        if (!media) continue;

        if (isRequesterOwned) {
          const selfEnvelope = formatEncryptedPayload(item?.encryptedMediaEnvelope);
          if (selfEnvelope) media.encryptedMediaEnvelope = selfEnvelope;
        } else {
          const partnerEnvelope = formatEncryptedPayload(item?.encryptedMediaEnvelopePartner);
          if (partnerEnvelope) media.encryptedMediaEnvelopePartner = partnerEnvelope;
        }
      }
    }

    await note.save();
    return res.json({ message: 'Копии плана обновлены', planId });
  } catch (error) {
    console.error('Ошибка при сохранении восстановленных копий плана:', error);
    return res.status(500).json({ error: 'Не удалось сохранить копии плана' });
  }
});

router.patch('/:id/feed-copies', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const access = await assertHelperCanWriteCopies(req.params.id, userId);
    if (!access.ok) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const contentId = String(req.body?.contentId || '').trim();
    if (!contentId || !mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({ error: 'Не указан contentId' });
    }

    const item = await Content.findById(contentId);
    if (!item) {
      return res.status(404).json({ error: 'Контент не найден' });
    }

    const ownerId = ownerIdOf(item.userId);
    if (!ownerId || (!idsEqual(ownerId, access.helperId) && !idsEqual(ownerId, access.requesterId))) {
      return res.status(403).json({ error: 'Контент не относится к этой паре' });
    }

    const isRequesterOwned = idsEqual(ownerId, access.requesterId);
    const updateData: Record<string, unknown> = {};

    if (isRequesterOwned) {
      const selfTitle = formatEncryptedPayload(req.body?.encryptedTitle);
      const selfDescription = formatEncryptedPayload(req.body?.encryptedDescription);
      const selfEnvelope = formatEncryptedPayload(req.body?.encryptedMediaEnvelope);
      if (selfTitle) updateData.encryptedTitle = selfTitle;
      if (selfDescription) updateData.encryptedDescription = selfDescription;
      if (selfEnvelope) updateData.encryptedMediaEnvelope = selfEnvelope;
      if (selfTitle || selfDescription || selfEnvelope) {
        updateData.metadataRecipientId = new mongoose.Types.ObjectId(access.helperId);
      }
    } else {
      const partnerTitle = formatEncryptedPayload(req.body?.encryptedTitlePartner);
      const partnerDescription = formatEncryptedPayload(req.body?.encryptedDescriptionPartner);
      const partnerEnvelope = formatEncryptedPayload(req.body?.encryptedMediaEnvelopePartner);
      if (partnerTitle) updateData.encryptedTitlePartner = partnerTitle;
      if (partnerDescription) updateData.encryptedDescriptionPartner = partnerDescription;
      if (partnerEnvelope) updateData.encryptedMediaEnvelopePartner = partnerEnvelope;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    await Content.updateOne({ _id: item._id }, { $set: updateData });
    return res.json({ message: 'Копии ленты обновлены', contentId });
  } catch (error) {
    console.error('Ошибка при сохранении восстановленных копий ленты:', error);
    return res.status(500).json({ error: 'Не удалось сохранить копии ленты' });
  }
});

export default router;
