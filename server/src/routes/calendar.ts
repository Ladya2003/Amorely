import express, { Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Content from '../models/content';
import PlanNote from '../models/planNote';
import User from '../models/user';
import Message from '../models/message';
import mongoose from 'mongoose';
import {
  formatCalendarEventGroup,
  formatCalendarEventMedia,
  sortCalendarEventMedia
} from '../utils/contentFormat';
import { resolvePartnerUserId } from '../utils/resolvePartnerId';
import { hasActivePartner } from '../utils/normalizeId';
import {
  findActiveRelationshipForUser,
  findLatestBrokenUpRelationshipForUser,
  getBreakupContentChoiceForUser,
  getPartnerIdFromRelationship
} from '../utils/relationshipHelpers';
import { getRelationshipLinkedAt } from '../utils/breakupContentHelpers';
import {
  buildSharedVisibilityQuery,
  canAccessSharedContent
} from '../utils/sharedContentVisibility';

const router = express.Router();

const getSharedContentVisibilityContext = async (userId: string) => {
  const partnerId = await resolvePartnerUserId(userId);
  const relationship = hasActivePartner(userId, partnerId)
    ? await findActiveRelationshipForUser(userId)
    : null;
  const relationshipStartDate = relationship?.startDate
    ? new Date(relationship.startDate)
    : null;

  let breakupViewContext = null;

  if (!hasActivePartner(userId, partnerId)) {
    const brokenUpRelationship = await findLatestBrokenUpRelationshipForUser(userId);
    const choice = brokenUpRelationship
      ? getBreakupContentChoiceForUser(brokenUpRelationship, userId)
      : null;
    const exPartnerId = brokenUpRelationship
      ? getPartnerIdFromRelationship(brokenUpRelationship, userId)
      : null;
    const relationshipLinkedAt = brokenUpRelationship
      ? getRelationshipLinkedAt(brokenUpRelationship)
      : null;

    if (choice && exPartnerId && relationshipLinkedAt) {
      breakupViewContext = {
        exPartnerId,
        relationshipLinkedAt,
        keepEvents: choice.keepEvents,
        keepPlans: choice.keepPlans
      };
    }
  }

  return { partnerId, relationshipStartDate, breakupViewContext };
};

const EVENT_DESCRIPTION_MAX_LENGTH = 5000;

const getValidatedEventDescription = (value: unknown): string | { error: string } => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const text = String(value);
  if (text.length > EVENT_DESCRIPTION_MAX_LENGTH) {
    return {
      error: `Описание не может быть длиннее ${EVENT_DESCRIPTION_MAX_LENGTH} символов`,
    };
  }

  return text;
};

// Настройка хранилища Cloudinary для multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'amorely/calendar',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'],
    resource_type: 'auto'
  } as any
});

const upload = multer({ storage });

const isValidEncryptedMediaItem = (item: any): boolean =>
  Boolean(
    item?.url &&
      item?.publicId &&
      (item?.encryptedMediaEnvelope?.ciphertext ||
        item?.mediaEnvelope?.mediaKey)
  );

const formatEncryptedPayload = (value: any) => {
  if (!value?.ciphertext || !value?.iv) return undefined;
  return {
    ciphertext: String(value.ciphertext),
    iv: String(value.iv)
  };
};

const buildStoredMediaFields = (item: any) => {
  const displayType = item.mediaEnvelope?.displayType || item.resourceType || 'image';
  const mimeType = item.mediaEnvelope?.mimeType || 'application/octet-stream';

  if (item.encryptedMediaEnvelope?.ciphertext) {
    return {
      mediaEnvelope: {
        mimeType,
        displayType: displayType === 'video' ? 'video' : 'image'
      },
      encryptedMediaEnvelope: {
        ciphertext: String(item.encryptedMediaEnvelope.ciphertext),
        iv: String(item.encryptedMediaEnvelope.iv)
      },
      ...(item.encryptedMediaEnvelopePartner?.ciphertext
        ? {
            encryptedMediaEnvelopePartner: {
              ciphertext: String(item.encryptedMediaEnvelopePartner.ciphertext),
              iv: String(item.encryptedMediaEnvelopePartner.iv)
            }
          }
        : {})
    };
  }

  return {
    mediaEnvelope: {
      mediaKey: item.mediaEnvelope.mediaKey,
      iv: item.mediaEnvelope.iv,
      mimeType,
      displayType: displayType === 'video' ? 'video' : 'image'
    }
  };
};

const buildStoredTextFields = (payload: {
  encryptedTitle?: any;
  encryptedDescription?: any;
  encryptedTitlePartner?: any;
  encryptedDescriptionPartner?: any;
}) => ({
  encryptedTitle: formatEncryptedPayload(payload.encryptedTitle),
  encryptedDescription: formatEncryptedPayload(payload.encryptedDescription),
  encryptedTitlePartner: formatEncryptedPayload(payload.encryptedTitlePartner),
  encryptedDescriptionPartner: formatEncryptedPayload(payload.encryptedDescriptionPartner)
});

const buildStoredPlanNoteTextFields = (payload: {
  encryptedTitle?: any;
  encryptedTitlePartner?: any;
  encryptedContent?: any;
  encryptedContentPartner?: any;
  encryptedCategory?: any;
  encryptedCategoryPartner?: any;
}) => ({
  encrypted: true,
  encryptedTitle: formatEncryptedPayload(payload.encryptedTitle),
  encryptedTitlePartner: formatEncryptedPayload(payload.encryptedTitlePartner),
  encryptedContent: formatEncryptedPayload(payload.encryptedContent),
  encryptedContentPartner: formatEncryptedPayload(payload.encryptedContentPartner),
  encryptedCategory: formatEncryptedPayload(payload.encryptedCategory),
  encryptedCategoryPartner: formatEncryptedPayload(payload.encryptedCategoryPartner),
  title: undefined,
  content: undefined,
  category: undefined
});

// Создание зашифрованного события (E2EE)
router.post('/events-encrypted', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const {
      eventDate,
      isBirthdayEvent,
      isAnniversaryEvent,
      encryptedTitle,
      encryptedDescription,
      encryptedTitlePartner,
      encryptedDescriptionPartner,
      encryptionRecipientId,
      media
    } = req.body || {};

    if (!eventDate || !encryptedTitle?.ciphertext) {
      return res.status(400).json({ error: 'Требуются дата и зашифрованный заголовок события' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const resolvedPartnerId = await resolvePartnerUserId(userId);
    const targetId = encryptionRecipientId
      ? String(encryptionRecipientId)
      : resolvedPartnerId;
    const textFields = buildStoredTextFields({
      encryptedTitle,
      encryptedDescription,
      encryptedTitlePartner,
      encryptedDescriptionPartner
    });
    const eventId = `event_${Date.now()}_${userId}`;
    const savedContent = [];
    const mediaItems = Array.isArray(media) ? media : [];

    if (mediaItems.length > 0) {
      for (const item of mediaItems) {
        if (!isValidEncryptedMediaItem(item)) {
          return res.status(400).json({ error: 'Некорректные данные зашифрованного медиа' });
        }

        const displayType = item.mediaEnvelope?.displayType || item.resourceType || 'image';
        const content = new Content({
          userId,
          targetId,
          url: item.url,
          publicId: item.publicId,
          resourceType: displayType === 'video' ? 'video' : 'image',
          fileSize: item.fileSize || 0,
          eventId,
          eventDate: new Date(eventDate),
          encrypted: true,
          ...buildStoredMediaFields(item),
          ...textFields,
          metadataSenderId: userId,
          metadataRecipientId: targetId,
          showInFeed: true,
          isBirthdayEvent: isBirthdayEvent === true || isBirthdayEvent === 'true',
          isAnniversaryEvent: isAnniversaryEvent === true || isAnniversaryEvent === 'true',
          customDate: new Date(eventDate),
          createdBy: userId
        });

        savedContent.push(await content.save());
      }
    } else {
      const content = new Content({
        userId,
        targetId,
        url: '',
        publicId: `text_${eventId}`,
        resourceType: 'image',
        fileSize: 0,
        eventId,
        eventDate: new Date(eventDate),
        encrypted: true,
        ...textFields,
        metadataSenderId: userId,
        metadataRecipientId: targetId,
        showInFeed: false,
        isBirthdayEvent: isBirthdayEvent === true || isBirthdayEvent === 'true',
        isAnniversaryEvent: isAnniversaryEvent === true || isAnniversaryEvent === 'true',
        customDate: new Date(eventDate),
        createdBy: userId
      });

      savedContent.push(await content.save());
    }

    res.json({
      message: 'Зашифрованное событие успешно создано',
      content: savedContent,
      eventId
    });
  } catch (error) {
    console.error('Ошибка при создании зашифрованного события:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        error: 'Некорректные данные события',
        details: error.message
      });
    }
    res.status(500).json({ error: 'Ошибка при создании зашифрованного события' });
  }
});

// Создание нового события в календаре
router.post('/events', upload.array('media'), async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const files = req.files as Express.Multer.File[];
    const { eventDate, title, description, isBirthdayEvent, isAnniversaryEvent } = req.body;

    if (!eventDate || !title) {
      return res.status(400).json({ error: 'Требуются дата и заголовок события' });
    }

    const validatedDescription = getValidatedEventDescription(description);
    if (typeof validatedDescription !== 'string') {
      return res.status(400).json({ error: validatedDescription.error });
    }

    // Получаем информацию о пользователе и партнере
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const partnerId = user.partnerId || userId; // Если нет партнера, используем свой ID

    const savedContent = [];
    
    // Генерируем уникальный eventId для группировки медиафайлов
    const eventId = `event_${Date.now()}_${userId}`;

    // Если есть файлы, сохраняем их
    if (files && files.length > 0) {
      for (const file of files) {
        const cloudinaryFile = file as any;
        
        let resourceType = 'image';
        if (cloudinaryFile.mimetype && cloudinaryFile.mimetype.startsWith('video/')) {
          resourceType = 'video';
        }

        const content = new Content({
          userId: userId,
          targetId: partnerId,
          url: cloudinaryFile.path,
          publicId: cloudinaryFile.filename,
          resourceType: resourceType,
          fileSize: cloudinaryFile.size || 0,
          eventId: eventId, // Связываем все медиафайлы одного события
          eventDate: new Date(eventDate),
          title: title,
          description: validatedDescription,
          showInFeed: true,
          isBirthdayEvent: isBirthdayEvent === 'true' || isBirthdayEvent === true,
          isAnniversaryEvent: isAnniversaryEvent === 'true' || isAnniversaryEvent === true,
          customDate: new Date(eventDate),
          createdBy: userId // Кто создал событие
        });

        await content.save();
        savedContent.push(content);
      }
    } else {
      // Создаем событие без медиафайлов (только текстовое)
      const content = new Content({
        userId: userId,
        targetId: partnerId,
        url: '', // Пустой URL для текстовых событий
        publicId: `text_${eventId}`,
        resourceType: 'image', // Устанавливаем тип по умолчанию
        fileSize: 0,
        eventId: eventId,
        eventDate: new Date(eventDate),
        title: title,
        description: validatedDescription,
        showInFeed: false, // Текстовые события не показываем в ленте по умолчанию
        isBirthdayEvent: isBirthdayEvent === 'true' || isBirthdayEvent === true,
        isAnniversaryEvent: isAnniversaryEvent === 'true' || isAnniversaryEvent === true,
        customDate: new Date(eventDate),
        createdBy: userId // Кто создал событие
      });

      await content.save();
      savedContent.push(content);
    }

    res.json({
      message: 'Событие успешно создано',
      content: savedContent
    });
  } catch (error) {
    console.error('Ошибка при создании события:', error);
    res.status(500).json({ 
      error: 'Ошибка при создании события', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Получение событий календаря (с партнёром — все события обоих, без — свои и из прошлых отношений)
router.get('/events', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { startDate, endDate, month, year } = req.query;

    const { partnerId, relationshipStartDate, breakupViewContext } =
      await getSharedContentVisibilityContext(userId);

    const andConditions: Record<string, unknown>[] = [
      { eventId: { $exists: true, $nin: [null, ''] } },
      buildSharedVisibilityQuery(userId, partnerId, 'targetId', relationshipStartDate, breakupViewContext)
    ];

    // Фильтрация по датам
    if (startDate && endDate) {
      andConditions.push({
        eventDate: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      });
    } else if (month && year) {
      const startOfMonth = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endOfMonth = new Date(parseInt(year as string), parseInt(month as string), 0);
      andConditions.push({
        eventDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });
    }

    const query = { $and: andConditions };

    const allMedia = await Content.find(query)
      .populate('userId', 'username avatar')
      .populate('createdBy', 'username avatar')
      .populate('lastEditedBy', 'username avatar')
      .sort({ eventDate: -1, createdAt: -1 });

    // Группируем медиафайлы по eventId
    const eventsMap = new Map();
    
    allMedia.forEach(media => {
      const key = media.eventId || media._id.toString();
      
      if (!eventsMap.has(key)) {
        eventsMap.set(key, formatCalendarEventGroup(media));
      }

      eventsMap.get(key).media.push(formatCalendarEventMedia(media));
    });

    // Преобразуем Map в массив и сортируем медиа по порядку добавления
    const events = Array.from(eventsMap.values()).map((event) => ({
      ...event,
      media: sortCalendarEventMedia(event.media)
    }));

    res.json(events);
  } catch (error) {
    console.error('Ошибка при получении событий:', error);
    res.status(500).json({ error: 'Ошибка при получении событий' });
  }
});

// Удаление всех событий календаря пары
router.delete('/events/all', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { partnerId, relationshipStartDate, breakupViewContext } =
      await getSharedContentVisibilityContext(userId);

    const query = {
      eventId: { $exists: true, $nin: [null, ''] },
      ...buildSharedVisibilityQuery(userId, partnerId, 'targetId', relationshipStartDate, breakupViewContext)
    };

    const allMedia = await Content.find(query);

    if (allMedia.length === 0) {
      return res.json({ message: 'События не найдены', deletedCount: 0 });
    }

    await deleteEventMediaFromCloudinary(allMedia);
    const result = await Content.deleteMany(query);

    res.json({
      message: 'Все события успешно удалены',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Ошибка при удалении всех событий:', error);
    res.status(500).json({ error: 'Ошибка при удалении всех событий' });
  }
});

// Получение конкретного события со всеми медиафайлами
router.get('/events/:id', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params;

    // Ищем все медиафайлы с таким eventId
    const mediaFiles = await Content.find({ eventId: id })
      .populate('userId', 'username avatar')
      .populate('targetId', 'username avatar')
      .populate('createdBy', 'username avatar')
      .populate('lastEditedBy', 'username avatar')
      .sort({ createdAt: 1 }); // Сортируем по порядку добавления

    if (!mediaFiles || mediaFiles.length === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    const firstMedia = mediaFiles[0];
    const { partnerId, relationshipStartDate, breakupViewContext } =
      await getSharedContentVisibilityContext(userId);

    if (
      canAccessSharedContent(
        firstMedia,
        userId,
        partnerId,
        'targetId',
        relationshipStartDate,
        breakupViewContext
      )
    ) {
      const event = {
        ...formatCalendarEventGroup(firstMedia),
        targetId: firstMedia.targetId,
        media: sortCalendarEventMedia(mediaFiles.map((m) => formatCalendarEventMedia(m))),
        readOnly: false
      };

      return res.json(event);
    }

    const shareMessage = await Message.findOne({
      receiverId: new mongoose.Types.ObjectId(userId),
      'sharedEvent.eventId': id
    })
      .sort({ createdAt: -1 })
      .select('sharedEvent senderId');

    if (!shareMessage?.sharedEvent) {
      return res.status(403).json({ error: 'Нет доступа к этому событию' });
    }

    const shared = shareMessage.sharedEvent;
    const createdBySource =
      typeof firstMedia.createdBy === 'object' && firstMedia.createdBy !== null && 'username' in firstMedia.createdBy
        ? (firstMedia.createdBy as { _id?: { toString(): string }; username?: string; avatar?: string })
        : typeof firstMedia.userId === 'object' && firstMedia.userId !== null && 'username' in firstMedia.userId
          ? (firstMedia.userId as { _id?: { toString(): string }; username?: string; avatar?: string })
          : null;

    const lastEditedBySource =
      typeof firstMedia.lastEditedBy === 'object' &&
      firstMedia.lastEditedBy !== null &&
      'username' in firstMedia.lastEditedBy
        ? (firstMedia.lastEditedBy as { _id?: { toString(): string }; username?: string; avatar?: string })
        : null;

    const sharedMediaItems =
      Array.isArray(shared.media) && shared.media.length > 0
        ? shared.media
        : shared.previewUrl
          ? [
              {
                id: `${id}-shared-preview`,
                url: shared.previewUrl,
                resourceType: shared.previewResourceType || 'image',
                encrypted: Boolean(shared.previewEncrypted),
                previewMediaEnvelope: shared.previewMediaEnvelope || undefined,
                encryptedMediaEnvelope: shared.previewEncryptedMediaEnvelope || undefined
              }
            ]
          : [];

    const event = {
      _id: id,
      eventId: id,
      title: shared.title || 'Без названия',
      eventDate: shared.eventDate || firstMedia.eventDate,
      createdAt: firstMedia.createdAt,
      createdBy: createdBySource
        ? {
            _id: createdBySource._id?.toString(),
            username: createdBySource.username,
            avatar: createdBySource.avatar
          }
        : undefined,
      lastEditedAt: firstMedia.lastEditedAt || undefined,
      lastEditedBy: lastEditedBySource
        ? {
            _id: lastEditedBySource._id?.toString(),
            username: lastEditedBySource.username,
            avatar: lastEditedBySource.avatar
          }
        : undefined,
      isBirthdayEvent: firstMedia.isBirthdayEvent,
      isAnniversaryEvent: firstMedia.isAnniversaryEvent,
      readOnly: true,
      media: sharedMediaItems.map((item: any, index: number) => ({
        _id: item.id || `${id}-shared-media-${index}`,
        url: item.url,
        publicId: item.id || `${id}-shared-media-${index}`,
        resourceType: item.resourceType || 'image',
        encrypted: Boolean(item.encrypted),
        mediaEnvelope: item.previewMediaEnvelope || undefined,
        encryptedMediaEnvelope: item.encryptedMediaEnvelope || undefined,
        metadataSenderId: shared.previewMetadataSenderId,
        metadataRecipientId: shared.previewMetadataRecipientId
      }))
    };

    res.json(event);
  } catch (error) {
    console.error('Ошибка при получении события:', error);
    res.status(500).json({ error: 'Ошибка при получении события' });
  }
});

const deleteEventMediaFromCloudinary = async (mediaItems: any[]) => {
  for (const media of mediaItems) {
    if (!media.publicId || media.publicId.startsWith('text_')) continue;
    try {
      await cloudinary.uploader.destroy(media.publicId, {
        resource_type: media.encrypted ? 'raw' : (media.resourceType as any)
      });
    } catch (cloudinaryError) {
      console.error('Ошибка при удалении из Cloudinary:', cloudinaryError);
    }
  }
};

const createTextOnlyEventContent = async (
  eventId: string,
  baseMedia: any,
  fields: {
    eventDate?: Date;
    encryptedTitle?: any;
    encryptedDescription?: any;
    encryptedTitlePartner?: any;
    encryptedDescriptionPartner?: any;
    title?: string;
    description?: string;
    metadataSenderId?: string;
    metadataRecipientId?: string;
    showInFeed?: boolean;
    isBirthdayEvent?: boolean;
    isAnniversaryEvent?: boolean;
  }
) => {
  const content = new Content({
    userId: baseMedia.userId,
    targetId: baseMedia.targetId,
    url: '',
    publicId: `text_${eventId}`,
    resourceType: 'image',
    fileSize: 0,
    eventId,
    eventDate: fields.eventDate || baseMedia.eventDate,
    encrypted: Boolean(fields.encryptedTitle?.ciphertext || baseMedia.encrypted),
    encryptedTitle: fields.encryptedTitle || baseMedia.encryptedTitle,
    encryptedDescription: fields.encryptedDescription ?? baseMedia.encryptedDescription,
    encryptedTitlePartner: fields.encryptedTitlePartner || baseMedia.encryptedTitlePartner,
    encryptedDescriptionPartner:
      fields.encryptedDescriptionPartner ?? baseMedia.encryptedDescriptionPartner,
    title: fields.title ?? baseMedia.title,
    description: fields.description ?? baseMedia.description,
    metadataSenderId: fields.metadataSenderId || baseMedia.metadataSenderId,
    metadataRecipientId: fields.metadataRecipientId || baseMedia.metadataRecipientId,
    showInFeed: fields.showInFeed ?? false,
    isBirthdayEvent: fields.isBirthdayEvent ?? baseMedia.isBirthdayEvent,
    isAnniversaryEvent: fields.isAnniversaryEvent ?? baseMedia.isAnniversaryEvent,
    customDate: fields.eventDate || baseMedia.eventDate,
    createdBy: baseMedia.createdBy,
    lastEditedBy: fields.metadataSenderId,
    lastEditedAt: new Date()
  });

  await content.save();
};

// Обновление события (обновляет все медиафайлы с данным eventId)
router.put('/events/:id', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params; // это eventId
    const {
      eventDate,
      title,
      description,
      encryptedTitle,
      encryptedDescription,
      encryptedTitlePartner,
      encryptedDescriptionPartner,
      encryptionRecipientId,
      showInFeed,
      isBirthdayEvent,
      isAnniversaryEvent,
      newMedia,
      removeMediaIds
    } = req.body;

    // Находим все медиафайлы события
    const mediaFiles = await Content.find({ eventId: id });

    if (!mediaFiles || mediaFiles.length === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    const baseMedia = mediaFiles[0];
    const { partnerId, relationshipStartDate, breakupViewContext } =
      await getSharedContentVisibilityContext(userId);

    if (
      !canAccessSharedContent(
        baseMedia,
        userId,
        partnerId,
        'targetId',
        relationshipStartDate,
        breakupViewContext
      )
    ) {
      return res.status(403).json({ error: 'Нет прав на редактирование этого события' });
    }

    // Обновляем все медиафайлы события
    const updateData: any = {};
    if (eventDate) updateData.eventDate = new Date(eventDate);
    const recipientId = encryptionRecipientId
      ? String(encryptionRecipientId)
      : await resolvePartnerUserId(userId);

    if (encryptedTitle?.ciphertext) {
      updateData.encrypted = true;
      updateData.encryptedTitle = encryptedTitle;
      updateData.title = undefined;
      updateData.metadataSenderId = userId;
      updateData.metadataRecipientId = recipientId;
    } else if (title !== undefined) {
      updateData.title = title;
    }
    if (encryptedTitlePartner?.ciphertext) {
      updateData.encryptedTitlePartner = encryptedTitlePartner;
    }
    if (encryptedDescription?.ciphertext) {
      updateData.encryptedDescription = encryptedDescription;
      updateData.description = undefined;
      updateData.metadataSenderId = userId;
      updateData.metadataRecipientId = recipientId;
    } else if (description !== undefined) {
      const validatedDescription = getValidatedEventDescription(description);
      if (typeof validatedDescription !== 'string') {
        return res.status(400).json({ error: validatedDescription.error });
      }
      updateData.description = validatedDescription;
    }
    if (encryptedDescriptionPartner?.ciphertext) {
      updateData.encryptedDescriptionPartner = encryptedDescriptionPartner;
    }
    if (showInFeed !== undefined) updateData.showInFeed = showInFeed;
    if (isBirthdayEvent !== undefined) updateData.isBirthdayEvent = isBirthdayEvent;
    if (isAnniversaryEvent !== undefined) updateData.isAnniversaryEvent = isAnniversaryEvent;
    updateData.lastEditedBy = userId;
    updateData.lastEditedAt = new Date();

    if (Array.isArray(removeMediaIds) && removeMediaIds.length > 0) {
      const idsToRemove = new Set(removeMediaIds.map(String));
      const mediaToDelete = mediaFiles.filter((item) => idsToRemove.has(item._id.toString()));

      await deleteEventMediaFromCloudinary(mediaToDelete);
      await Content.deleteMany({
        eventId: id,
        _id: { $in: mediaToDelete.map((item) => item._id) }
      });
    }

    if (Array.isArray(newMedia) && newMedia.length > 0) {
      await Content.deleteMany({ eventId: id, publicId: `text_${id}` });

      for (const item of newMedia) {
        if (!isValidEncryptedMediaItem(item)) {
          return res.status(400).json({ error: 'Некорректные данные зашифрованного медиа' });
        }

        const displayType = item.mediaEnvelope?.displayType || item.resourceType || 'image';
        const content = new Content({
          userId: baseMedia.userId,
          targetId: baseMedia.targetId,
          url: item.url,
          publicId: item.publicId,
          resourceType: displayType === 'video' ? 'video' : 'image',
          fileSize: item.fileSize || 0,
          eventId: id,
          eventDate: updateData.eventDate || baseMedia.eventDate,
          encrypted: true,
          ...buildStoredMediaFields(item),
          encryptedTitle: updateData.encryptedTitle || baseMedia.encryptedTitle,
          encryptedDescription: updateData.encryptedDescription ?? baseMedia.encryptedDescription,
          encryptedTitlePartner: updateData.encryptedTitlePartner || baseMedia.encryptedTitlePartner,
          encryptedDescriptionPartner:
            updateData.encryptedDescriptionPartner ?? baseMedia.encryptedDescriptionPartner,
          title: updateData.title ?? baseMedia.title,
          description: updateData.description ?? baseMedia.description,
          metadataSenderId: updateData.metadataSenderId || userId,
          metadataRecipientId: recipientId,
          showInFeed: updateData.showInFeed ?? baseMedia.showInFeed ?? true,
          isBirthdayEvent: updateData.isBirthdayEvent ?? baseMedia.isBirthdayEvent,
          isAnniversaryEvent: updateData.isAnniversaryEvent ?? baseMedia.isAnniversaryEvent,
          customDate: updateData.eventDate || baseMedia.eventDate,
          createdBy: baseMedia.createdBy,
          lastEditedBy: userId,
          lastEditedAt: updateData.lastEditedAt
        });

        await content.save();
      }
    }

    const remainingCount = await Content.countDocuments({ eventId: id });
    if (remainingCount > 0) {
      await Content.updateMany({ eventId: id }, { $set: updateData });
    } else {
      await createTextOnlyEventContent(id, baseMedia, {
        eventDate: updateData.eventDate,
        encryptedTitle: updateData.encryptedTitle,
        encryptedDescription: updateData.encryptedDescription,
        encryptedTitlePartner: updateData.encryptedTitlePartner,
        encryptedDescriptionPartner: updateData.encryptedDescriptionPartner,
        title: updateData.title,
        description: updateData.description,
        metadataSenderId: updateData.metadataSenderId,
        metadataRecipientId: recipientId,
        showInFeed: updateData.showInFeed,
        isBirthdayEvent: updateData.isBirthdayEvent,
        isAnniversaryEvent: updateData.isAnniversaryEvent
      });
    }

    res.json({
      message: 'Событие успешно обновлено',
      eventId: id
    });
  } catch (error) {
    console.error('Ошибка при обновлении события:', error);
    res.status(500).json({ error: 'Ошибка при обновлении события' });
  }
});

// Добавление partner-копий шифрования к существующим solo-событиям автора
router.patch('/events/:id/partner-copies', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params;
    const {
      encryptedTitle,
      encryptedDescription,
      encryptedTitlePartner,
      encryptedDescriptionPartner,
      mediaPartnerCopies
    } = req.body || {};

    const mediaFiles = await Content.find({ eventId: id });
    if (!mediaFiles || mediaFiles.length === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    const baseMedia = mediaFiles[0];
    if (baseMedia.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Можно мигрировать только собственные события' });
    }

    const updateData: Record<string, unknown> = {};
    const selfTitle = formatEncryptedPayload(encryptedTitle);
    const selfDescription = formatEncryptedPayload(encryptedDescription);
    const partnerTitle = formatEncryptedPayload(encryptedTitlePartner);
    const partnerDescription = formatEncryptedPayload(encryptedDescriptionPartner);

    const partnerId = await resolvePartnerUserId(userId);
    if (hasActivePartner(userId, partnerId)) {
      updateData.targetId = partnerId;
      updateData.metadataRecipientId = partnerId;
      updateData.partnerSharedAt = new Date();
    }

    if (selfTitle) updateData.encryptedTitle = selfTitle;
    if (selfDescription) updateData.encryptedDescription = selfDescription;
    if (partnerTitle) updateData.encryptedTitlePartner = partnerTitle;
    if (partnerDescription) updateData.encryptedDescriptionPartner = partnerDescription;

    if (Object.keys(updateData).length > 0) {
      await Content.updateMany({ eventId: id, userId }, { $set: updateData });
    }

    if (Array.isArray(mediaPartnerCopies)) {
      for (const item of mediaPartnerCopies) {
        const partnerEnvelope = formatEncryptedPayload(item?.encryptedMediaEnvelopePartner);
        const selfEnvelope = formatEncryptedPayload(item?.encryptedMediaEnvelope);
        if (!item?.mediaId || !partnerEnvelope) continue;

        const mediaUpdate: Record<string, unknown> = {
          encryptedMediaEnvelopePartner: partnerEnvelope
        };
        if (selfEnvelope) {
          mediaUpdate.encryptedMediaEnvelope = selfEnvelope;
        }

        await Content.updateOne(
          { _id: item.mediaId, eventId: id, userId },
          { $set: mediaUpdate }
        );
      }
    }

    res.json({ message: 'Partner-копии шифрования сохранены', eventId: id });
  } catch (error) {
    console.error('Ошибка при сохранении partner-копий события:', error);
    res.status(500).json({ error: 'Ошибка при сохранении partner-копий события' });
  }
});

// Удаление события (удаляет все медиафайлы с данным eventId)
router.delete('/events/:id', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params; // это eventId

    // Находим все медиафайлы события
    const mediaFiles = await Content.find({ eventId: id });

    if (!mediaFiles || mediaFiles.length === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    const { partnerId, relationshipStartDate, breakupViewContext } =
      await getSharedContentVisibilityContext(userId);

    if (
      !canAccessSharedContent(
        mediaFiles[0],
        userId,
        partnerId,
        'targetId',
        relationshipStartDate,
        breakupViewContext
      )
    ) {
      return res.status(403).json({ error: 'Нет прав на удаление этого события' });
    }

    await deleteEventMediaFromCloudinary(mediaFiles);

    // Удаляем все медиафайлы события из базы данных
    await Content.deleteMany({ eventId: id });

    res.json({ message: 'Событие успешно удалено' });
  } catch (error) {
    console.error('Ошибка при удалении события:', error);
    res.status(500).json({ error: 'Ошибка при удалении события' });
  }
});

const buildCoupleQuery = (
  userId: string,
  partnerId?: string | null,
  relationshipStartDate?: Date | null,
  breakupViewContext?: Awaited<ReturnType<typeof getSharedContentVisibilityContext>>['breakupViewContext']
) =>
  buildSharedVisibilityQuery(
    userId,
    partnerId,
    'partnerId',
    relationshipStartDate,
    breakupViewContext,
    'plans'
  );

const canAccessPlanNote = (
  note: any,
  userId: string,
  partnerId?: string | null,
  relationshipStartDate?: Date | null,
  breakupViewContext?: Awaited<ReturnType<typeof getSharedContentVisibilityContext>>['breakupViewContext']
) =>
  canAccessSharedContent(
    note,
    userId,
    partnerId,
    'partnerId',
    relationshipStartDate,
    breakupViewContext,
    'plans'
  );

const formatPlanNoteMedia = (media: any) => ({
  _id: media._id?.toString(),
  url: media.url,
  publicId: media.publicId,
  resourceType: media.resourceType,
  fileSize: media.fileSize,
  encrypted: media.encrypted,
  mediaEnvelope: media.mediaEnvelope,
  encryptedMediaEnvelope: formatEncryptedPayload(media.encryptedMediaEnvelope),
  encryptedMediaEnvelopePartner: formatEncryptedPayload(media.encryptedMediaEnvelopePartner),
  metadataSenderId: media.metadataSenderId?.toString(),
  metadataRecipientId: media.metadataRecipientId?.toString()
});

const buildPlanNoteMediaItem = (item: any, userId: string, partnerId: string) => {
  const displayType = item.mediaEnvelope?.displayType || item.resourceType || 'image';

  return {
    url: item.url,
    publicId: item.publicId,
    resourceType: displayType === 'video' ? 'video' : 'image',
    fileSize: item.fileSize || 0,
    encrypted: true,
    ...buildStoredMediaFields(item),
    metadataSenderId: userId,
    metadataRecipientId: partnerId
  };
};

const deletePlanNoteMediaFromCloudinary = async (mediaItems: any[]) => {
  for (const media of mediaItems) {
    if (!media.publicId) continue;
    try {
      await cloudinary.uploader.destroy(media.publicId, { resource_type: 'raw' });
    } catch (cloudinaryError) {
      console.error('Ошибка при удалении медиа заметки из Cloudinary:', cloudinaryError);
    }
  }
};

const formatPlanNote = (note: any) => ({
  _id: note._id.toString(),
  userId: note.userId?.toString(),
  encrypted: Boolean(note.encrypted || note.encryptedTitle?.ciphertext),
  title: note.title,
  content: note.content,
  category: note.category,
  encryptedTitle: formatEncryptedPayload(note.encryptedTitle),
  encryptedTitlePartner: formatEncryptedPayload(note.encryptedTitlePartner),
  encryptedContent: formatEncryptedPayload(note.encryptedContent),
  encryptedContentPartner: formatEncryptedPayload(note.encryptedContentPartner),
  encryptedCategory: formatEncryptedPayload(note.encryptedCategory),
  encryptedCategoryPartner: formatEncryptedPayload(note.encryptedCategoryPartner),
  metadataSenderId: note.metadataSenderId?.toString(),
  metadataRecipientId: note.metadataRecipientId?.toString(),
  media: Array.isArray(note.media) ? note.media.map(formatPlanNoteMedia) : [],
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
  createdBy: note.createdBy
    ? {
        _id: note.createdBy._id?.toString(),
        username: note.createdBy.username,
        avatar: note.createdBy.avatar,
        firstName: note.createdBy.firstName,
        lastName: note.createdBy.lastName
      }
    : undefined,
  lastEditedBy: note.lastEditedBy
    ? {
        _id: note.lastEditedBy._id?.toString(),
        username: note.lastEditedBy.username,
        avatar: note.lastEditedBy.avatar,
        firstName: note.lastEditedBy.firstName,
        lastName: note.lastEditedBy.lastName
      }
    : undefined
});

// Получение заметок пользователя (с партнёром — все заметки обоих, без — свои и из прошлых отношений)
router.get('/plans', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { partnerId, relationshipStartDate, breakupViewContext } =
      await getSharedContentVisibilityContext(userId);

    const notes = await PlanNote.find(buildCoupleQuery(userId, partnerId, relationshipStartDate, breakupViewContext))
      .populate('createdBy', 'username avatar firstName lastName')
      .populate('lastEditedBy', 'username avatar firstName lastName')
      .sort({ updatedAt: -1 });

    res.json({
      notes: notes.map(formatPlanNote)
    });
  } catch (error) {
    console.error('Ошибка при получении заметок:', error);
    res.status(500).json({ error: 'Ошибка при получении заметок' });
  }
});

// Удаление всех заметок пары
router.delete('/plans/all', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { partnerId, relationshipStartDate, breakupViewContext } =
      await getSharedContentVisibilityContext(userId);
    const query = buildCoupleQuery(userId, partnerId, relationshipStartDate, breakupViewContext);

    const notes = await PlanNote.find(query);

    if (notes.length === 0) {
      return res.json({ message: 'Заметки не найдены', deletedCount: 0 });
    }

    for (const note of notes) {
      await deletePlanNoteMediaFromCloudinary(note.media);
    }

    const result = await PlanNote.deleteMany(query);

    res.json({
      message: 'Все заметки успешно удалены',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Ошибка при удалении всех заметок:', error);
    res.status(500).json({ error: 'Ошибка при удалении всех заметок' });
  }
});

// Получение одной заметки
router.get('/plans/:id', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params;
    const { partnerId, relationshipStartDate, breakupViewContext } =
      await getSharedContentVisibilityContext(userId);

    const note = await PlanNote.findById(id)
      .populate('createdBy', 'username avatar firstName lastName')
      .populate('lastEditedBy', 'username avatar firstName lastName');

    if (!note) {
      return res.status(404).json({ error: 'Заметка не найдена' });
    }

    if (canAccessPlanNote(note, userId, partnerId, relationshipStartDate, breakupViewContext)) {
      return res.json(formatPlanNote(note));
    }

    const shareMessage = await Message.findOne({
      receiverId: new mongoose.Types.ObjectId(userId),
      'sharedNote.noteId': id
    })
      .sort({ createdAt: -1 })
      .select('sharedNote senderId');

    if (!shareMessage?.sharedNote) {
      return res.status(403).json({ error: 'Нет доступа к этой заметке' });
    }

    const shared = shareMessage.sharedNote;
    const createdBySource =
      typeof note.createdBy === 'object' && note.createdBy !== null && 'username' in note.createdBy
        ? (note.createdBy as { _id?: { toString(): string }; username?: string; avatar?: string; firstName?: string; lastName?: string })
        : null;

    const lastEditedBySource =
      typeof note.lastEditedBy === 'object' &&
      note.lastEditedBy !== null &&
      'username' in note.lastEditedBy
        ? (note.lastEditedBy as { _id?: { toString(): string }; username?: string; avatar?: string; firstName?: string; lastName?: string })
        : null;

    const sharedMediaItems =
      Array.isArray(shared.media) && shared.media.length > 0
        ? shared.media
        : shared.previewUrl
          ? [
              {
                id: `${id}-shared-preview`,
                url: shared.previewUrl,
                resourceType: shared.previewResourceType || 'image',
                encrypted: Boolean(shared.previewEncrypted),
                previewMediaEnvelope: shared.previewMediaEnvelope || undefined,
                encryptedMediaEnvelope: shared.previewEncryptedMediaEnvelope || undefined
              }
            ]
          : [];

    res.json({
      _id: id,
      title: shared.title || 'Без названия',
      content: shared.contentPreview || '',
      category: shared.category || '',
      encrypted: false,
      metadataSenderId: shared.previewMetadataSenderId,
      metadataRecipientId: shared.previewMetadataRecipientId,
      media: sharedMediaItems.map((item: any, index: number) => ({
        _id: item.id || `${id}-shared-media-${index}`,
        url: item.url,
        publicId: item.id || `${id}-shared-media-${index}`,
        resourceType: item.resourceType || 'image',
        encrypted: Boolean(item.encrypted),
        mediaEnvelope: item.previewMediaEnvelope || undefined,
        encryptedMediaEnvelope: item.encryptedMediaEnvelope || undefined,
        metadataSenderId: shared.previewMetadataSenderId,
        metadataRecipientId: shared.previewMetadataRecipientId
      })),
      createdAt: note.createdAt,
      updatedAt: shared.updatedAt || note.updatedAt,
      createdBy: createdBySource
        ? {
            _id: createdBySource._id?.toString(),
            username: createdBySource.username,
            avatar: createdBySource.avatar,
            firstName: createdBySource.firstName,
            lastName: createdBySource.lastName
          }
        : undefined,
      lastEditedBy: lastEditedBySource
        ? {
            _id: lastEditedBySource._id?.toString(),
            username: lastEditedBySource.username,
            avatar: lastEditedBySource.avatar,
            firstName: lastEditedBySource.firstName,
            lastName: lastEditedBySource.lastName
          }
        : undefined,
      readOnly: true
    });
  } catch (error) {
    console.error('Ошибка при получении заметки:', error);
    res.status(500).json({ error: 'Ошибка при получении заметки' });
  }
});

// Создание заметки
router.post('/plans', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const {
      encryptedTitle,
      encryptedTitlePartner,
      encryptedContent,
      encryptedContentPartner,
      encryptedCategory,
      encryptedCategoryPartner,
      media,
      encryptionRecipientId
    } = req.body || {};

    if (!encryptedTitle?.ciphertext) {
      return res.status(400).json({ error: 'Требуется зашифрованный заголовок заметки' });
    }

    if (!encryptedCategory?.ciphertext) {
      return res.status(400).json({ error: 'Требуется зашифрованная категория заметки' });
    }

    const partnerId = encryptionRecipientId
      ? String(encryptionRecipientId)
      : await resolvePartnerUserId(userId);

    const mediaItems = Array.isArray(media) ? media : [];
    for (const item of mediaItems) {
      if (!isValidEncryptedMediaItem(item)) {
        return res.status(400).json({ error: 'Некорректные данные зашифрованного медиа' });
      }
    }

    const note = new PlanNote({
      userId,
      partnerId: hasActivePartner(userId, partnerId) ? partnerId : undefined,
      ...buildStoredPlanNoteTextFields({
        encryptedTitle,
        encryptedTitlePartner,
        encryptedContent,
        encryptedContentPartner,
        encryptedCategory,
        encryptedCategoryPartner
      }),
      metadataSenderId: userId,
      metadataRecipientId: partnerId,
      media: mediaItems.map((item: any) => buildPlanNoteMediaItem(item, userId, partnerId)),
      createdBy: userId,
      lastEditedBy: userId
    });

    await note.save();

    const populated = await PlanNote.findById(note._id)
      .populate('createdBy', 'username avatar firstName lastName')
      .populate('lastEditedBy', 'username avatar firstName lastName');

    res.status(201).json(formatPlanNote(populated));
  } catch (error) {
    console.error('Ошибка при создании заметки:', error);
    res.status(500).json({ error: 'Ошибка при создании заметки' });
  }
});

// Обновление заметки
router.put('/plans/:id', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params;
    const {
      encryptedTitle,
      encryptedTitlePartner,
      encryptedContent,
      encryptedContentPartner,
      encryptedCategory,
      encryptedCategoryPartner,
      newMedia,
      removeMediaIds,
      encryptionRecipientId
    } = req.body || {};
    const encryptionPartnerId = encryptionRecipientId
      ? String(encryptionRecipientId)
      : await resolvePartnerUserId(userId);
    const { partnerId, relationshipStartDate, breakupViewContext } =
      await getSharedContentVisibilityContext(userId);

    const note = await PlanNote.findById(id);

    if (!note) {
      return res.status(404).json({ error: 'Заметка не найдена' });
    }

    if (!canAccessPlanNote(note, userId, partnerId, relationshipStartDate, breakupViewContext)) {
      return res.status(403).json({ error: 'Нет прав на редактирование этой заметки' });
    }

    if (encryptedTitle?.ciphertext) {
      Object.assign(
        note,
        buildStoredPlanNoteTextFields({
          encryptedTitle,
          encryptedTitlePartner,
          encryptedContent,
          encryptedContentPartner,
          encryptedCategory,
          encryptedCategoryPartner
        })
      );
      note.metadataSenderId = new mongoose.Types.ObjectId(userId);
      note.metadataRecipientId = new mongoose.Types.ObjectId(encryptionPartnerId);
    } else {
      return res.status(400).json({ error: 'Требуется зашифрованный заголовок заметки' });
    }

    if (Array.isArray(removeMediaIds) && removeMediaIds.length > 0) {
      const idsToRemove = new Set(removeMediaIds.map(String));
      const mediaToDelete = note.media.filter((item) => idsToRemove.has(item._id.toString()));

      await deletePlanNoteMediaFromCloudinary(mediaToDelete);
      for (const id of idsToRemove) {
        note.media.pull(id);
      }
    }

    if (Array.isArray(newMedia) && newMedia.length > 0) {
      for (const item of newMedia) {
        if (!isValidEncryptedMediaItem(item)) {
          return res.status(400).json({ error: 'Некорректные данные зашифрованного медиа' });
        }
        note.media.push(buildPlanNoteMediaItem(item, userId, encryptionPartnerId));
      }
    }

    note.lastEditedBy = new mongoose.Types.ObjectId(userId);
    await note.save();

    const populated = await PlanNote.findById(note._id)
      .populate('createdBy', 'username avatar firstName lastName')
      .populate('lastEditedBy', 'username avatar firstName lastName');

    res.json(formatPlanNote(populated));
  } catch (error) {
    console.error('Ошибка при обновлении заметки:', error);
    res.status(500).json({ error: 'Ошибка при обновлении заметки' });
  }
});

// Добавление partner-копий шифрования к существующим solo-заметкам автора
router.patch('/plans/:id/partner-copies', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params;
    const {
      encryptedTitle,
      encryptedTitlePartner,
      encryptedContent,
      encryptedContentPartner,
      encryptedCategory,
      encryptedCategoryPartner,
      mediaPartnerCopies
    } = req.body || {};

    const note = await PlanNote.findById(id);
    if (!note) {
      return res.status(404).json({ error: 'Заметка не найдена' });
    }

    if (note.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Можно мигрировать только собственные заметки' });
    }

    const partnerId = await resolvePartnerUserId(userId);
    const selfTitle = formatEncryptedPayload(encryptedTitle);
    const partnerTitle = formatEncryptedPayload(encryptedTitlePartner);
    const selfContent = formatEncryptedPayload(encryptedContent);
    const partnerContent = formatEncryptedPayload(encryptedContentPartner);
    const selfCategory = formatEncryptedPayload(encryptedCategory);
    const partnerCategory = formatEncryptedPayload(encryptedCategoryPartner);

    if (selfTitle) note.encryptedTitle = selfTitle;
    if (partnerTitle) note.encryptedTitlePartner = partnerTitle;
    if (selfContent) note.encryptedContent = selfContent;
    if (partnerContent) note.encryptedContentPartner = partnerContent;
    if (selfCategory) note.encryptedCategory = selfCategory;
    if (partnerCategory) note.encryptedCategoryPartner = partnerCategory;

    note.metadataSenderId = new mongoose.Types.ObjectId(userId);

    if (hasActivePartner(userId, partnerId)) {
      note.partnerId = new mongoose.Types.ObjectId(partnerId);
      note.metadataRecipientId = new mongoose.Types.ObjectId(partnerId);
    }

    if (Array.isArray(mediaPartnerCopies)) {
      for (const item of mediaPartnerCopies) {
        const partnerEnvelope = formatEncryptedPayload(item?.encryptedMediaEnvelopePartner);
        const selfEnvelope = formatEncryptedPayload(item?.encryptedMediaEnvelope);
        if (!item?.mediaId || !partnerEnvelope) continue;

        const media = note.media.id(item.mediaId);
        if (!media) continue;

        media.encryptedMediaEnvelopePartner = partnerEnvelope;
        if (selfEnvelope) {
          media.encryptedMediaEnvelope = selfEnvelope;
        }
      }
    }

    await note.save();

    res.json({ message: 'Partner-копии шифрования сохранены', planId: id });
  } catch (error) {
    console.error('Ошибка при сохранении partner-копий заметки:', error);
    res.status(500).json({ error: 'Ошибка при сохранении partner-копий заметки' });
  }
});

// Удаление заметки
router.delete('/plans/:id', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params;
    const { partnerId, relationshipStartDate, breakupViewContext } =
      await getSharedContentVisibilityContext(userId);

    const note = await PlanNote.findById(id);

    if (!note) {
      return res.status(404).json({ error: 'Заметка не найдена' });
    }

    if (!canAccessPlanNote(note, userId, partnerId, relationshipStartDate, breakupViewContext)) {
      return res.status(403).json({ error: 'Нет прав на удаление этой заметки' });
    }

    await deletePlanNoteMediaFromCloudinary(note.media);
    await PlanNote.findByIdAndDelete(id);

    res.json({ message: 'Заметка удалена' });
  } catch (error) {
    console.error('Ошибка при удалении заметки:', error);
    res.status(500).json({ error: 'Ошибка при удалении заметки' });
  }
});

export default router;

