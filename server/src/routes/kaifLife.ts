import express, { Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import mongoose from 'mongoose';
import { ExtendedRequest } from '../types/mongoose';
import User from '../models/user';
import KaifLifeGroup, { KaifLifeGroupDocument } from '../models/kaifLifeGroup';
import KaifLifeIdea, {
  KAIF_LIFE_STAGE_KEYS,
  KaifLifeContentBlock,
  KaifLifeIdeaDocument,
  KaifLifeStage,
  KaifLifeStageKey,
  KaifLifeStages,
} from '../models/kaifLifeIdea';

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'amorely/kaif-life',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov'],
    resource_type: 'auto',
  } as any,
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
});

const requireKaifLifeAccess = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.userId).select('kaifLifeIdeasEnabled');
    if (!user?.kaifLifeIdeasEnabled) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    next();
  } catch (error) {
    console.error('Kaif Life access check error:', error);
    res.status(500).json({ error: 'Ошибка доступа' });
  }
};

router.use(requireKaifLifeAccess);

const getResourceTypeFromFile = (file: Express.Multer.File): 'image' | 'video' => {
  if (file.mimetype?.startsWith('video/')) {
    return 'video';
  }
  if (
    file.originalname &&
    (file.originalname.endsWith('.mp4') ||
      file.originalname.endsWith('.mov') ||
      file.originalname.endsWith('.avi'))
  ) {
    return 'video';
  }
  return 'image';
};

const emptyStage = (): KaifLifeStage => ({
  done: false,
  inProgress: false,
  deadline: null,
  blocks: [],
});

const createEmptyStages = (): KaifLifeStages => ({
  development: emptyStage(),
  script: emptyStage(),
  shooting: emptyStage(),
  editing: emptyStage(),
});

const sanitizeBlock = (raw: unknown): KaifLifeContentBlock | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const block = raw as Record<string, unknown>;
  const id = typeof block.id === 'string' && block.id.trim() ? block.id.trim() : null;
  if (!id) {
    return null;
  }

  if (block.type === 'text') {
    return {
      id,
      type: 'text',
      text: typeof block.text === 'string' ? block.text : '',
    };
  }

  if (block.type === 'media') {
    const mediaType = block.mediaType === 'video' ? 'video' : 'image';
    const url = typeof block.url === 'string' ? block.url : '';
    const publicId = typeof block.publicId === 'string' ? block.publicId : '';
    if (!url) {
      return null;
    }
    const widthPercent = Number(block.widthPercent);
    return {
      id,
      type: 'media',
      mediaType,
      url,
      publicId,
      widthPercent: Number.isFinite(widthPercent)
        ? Math.min(100, Math.max(15, widthPercent))
        : 48,
    };
  }

  return null;
};

const sanitizeStage = (raw: unknown): KaifLifeStage => {
  if (!raw || typeof raw !== 'object') {
    return emptyStage();
  }

  const stage = raw as Record<string, unknown>;
  const blocks = Array.isArray(stage.blocks)
    ? stage.blocks.map(sanitizeBlock).filter((block): block is KaifLifeContentBlock => block !== null)
    : [];

  let deadline: Date | null = null;
  if (typeof stage.deadline === 'string' && stage.deadline.trim()) {
    const parsed = new Date(stage.deadline);
    if (!Number.isNaN(parsed.getTime())) {
      deadline = parsed;
    }
  } else if (stage.deadline instanceof Date && !Number.isNaN(stage.deadline.getTime())) {
    deadline = stage.deadline;
  }

  return {
    done: stage.done === true,
    inProgress: stage.inProgress === true,
    deadline,
    blocks,
  };
};

const sanitizeStages = (raw: unknown): KaifLifeStages => {
  const stages = createEmptyStages();
  if (!raw || typeof raw !== 'object') {
    return stages;
  }

  const input = raw as Record<string, unknown>;
  for (const key of KAIF_LIFE_STAGE_KEYS) {
    if (key in input) {
      stages[key] = sanitizeStage(input[key]);
    }
  }

  return stages;
};

type MoveDirection = 'up' | 'down';

const parseDirection = (raw: unknown): MoveDirection | null => {
  if (raw === 'up' || raw === 'down') {
    return raw;
  }
  return null;
};

const serializeGroup = (group: KaifLifeGroupDocument) => ({
  _id: String(group._id),
  title: group.title,
  sortOrder: group.sortOrder ?? 0,
  createdAt: group.createdAt.toISOString(),
  updatedAt: group.updatedAt.toISOString(),
});

const serializeIdea = (idea: {
  _id: unknown;
  groupId?: mongoose.Types.ObjectId | null;
  title: string;
  sortOrder?: number;
  stages: KaifLifeStages;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  _id: String(idea._id),
  groupId: idea.groupId ? String(idea.groupId) : '',
  title: idea.title,
  sortOrder: idea.sortOrder ?? 0,
  stages: KAIF_LIFE_STAGE_KEYS.reduce((acc, key) => {
    const stage = idea.stages[key] ?? emptyStage();
    acc[key] = {
      done: Boolean(stage.done),
      inProgress: Boolean(stage.inProgress),
      deadline: stage.deadline ? new Date(stage.deadline).toISOString() : null,
      blocks: stage.blocks ?? [],
    };
    return acc;
  }, {} as Record<KaifLifeStageKey, { done: boolean; inProgress: boolean; deadline: string | null; blocks: KaifLifeContentBlock[] }>),
  createdAt: idea.createdAt.toISOString(),
  updatedAt: idea.updatedAt.toISOString(),
});

const nextGroupSortOrder = async (userId: string): Promise<number> => {
  const last = await KaifLifeGroup.findOne({ userId }).sort({ sortOrder: -1 }).select('sortOrder');
  return (last?.sortOrder ?? -1) + 1;
};

const nextIdeaSortOrder = async (userId: string, groupId: string): Promise<number> => {
  const last = await KaifLifeIdea.findOne({ userId, groupId }).sort({ sortOrder: -1 }).select('sortOrder');
  return (last?.sortOrder ?? -1) + 1;
};

const migrateOrphanIdeas = async (userId: string) => {
  const orphans = await KaifLifeIdea.find({
    userId,
    $or: [{ groupId: { $exists: false } }, { groupId: null }],
  }).sort({ updatedAt: -1 });

  if (orphans.length === 0) {
    return;
  }

  let group = await KaifLifeGroup.findOne({ userId }).sort({ sortOrder: 1, createdAt: 1 });
  if (!group) {
    group = await KaifLifeGroup.create({
      userId,
      title: 'Идеи',
      sortOrder: await nextGroupSortOrder(userId),
    });
  }

  let sortOrder = await nextIdeaSortOrder(userId, String(group._id));
  for (const idea of orphans) {
    idea.groupId = group._id as mongoose.Types.ObjectId;
    idea.sortOrder = sortOrder;
    sortOrder += 1;
    await idea.save();
  }
};

const loadKaifLifeList = async (userId: string) => {
  await migrateOrphanIdeas(userId);
  const [groups, ideas] = await Promise.all([
    KaifLifeGroup.find({ userId }).sort({ sortOrder: 1, createdAt: 1 }),
    KaifLifeIdea.find({ userId }).sort({ sortOrder: 1, createdAt: 1 }),
  ]);
  return {
    groups: groups.map(serializeGroup),
    ideas: ideas.map(serializeIdea),
  };
};

const reindexDocuments = async (
  docs: Array<{ sortOrder: number; save: () => Promise<unknown> }>
) => {
  await Promise.all(
    docs.map((doc, index) => {
      if (doc.sortOrder === index) {
        return Promise.resolve();
      }
      doc.sortOrder = index;
      return doc.save();
    })
  );
};

const loadSortedGroups = async (userId: string): Promise<KaifLifeGroupDocument[]> =>
  KaifLifeGroup.find({ userId }).sort({ sortOrder: 1, createdAt: 1 });

const loadSortedIdeas = async (userId: string, groupId: string): Promise<KaifLifeIdeaDocument[]> =>
  KaifLifeIdea.find({ userId, groupId }).sort({ sortOrder: 1, createdAt: 1 });

const collectPublicIds = (stages: KaifLifeStages): string[] => {
  const ids: string[] = [];
  for (const key of KAIF_LIFE_STAGE_KEYS) {
    for (const block of stages[key]?.blocks ?? []) {
      if (block.type === 'media' && block.publicId) {
        ids.push(block.publicId);
      }
    }
  }
  return ids;
};

const destroyCloudinaryFiles = async (publicIds: string[]) => {
  await Promise.all(
    publicIds.map(async (publicId) => {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      } catch {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        } catch (error) {
          console.error('Kaif Life cloudinary destroy error:', error);
        }
      }
    })
  );
};

router.get('/ideas', async (req: ExtendedRequest, res: Response) => {
  try {
    const list = await loadKaifLifeList(String(req.userId));
    res.json(list);
  } catch (error) {
    console.error('Kaif Life list error:', error);
    res.status(500).json({ error: 'Не удалось загрузить идеи' });
  }
});

router.post('/groups', async (req: ExtendedRequest, res: Response) => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 200) : '';
    if (!title) {
      return res.status(400).json({ error: 'Введите название группы' });
    }

    const group = await KaifLifeGroup.create({
      userId: req.userId,
      title,
      sortOrder: await nextGroupSortOrder(String(req.userId)),
    });
    res.status(201).json({ group: serializeGroup(group) });
  } catch (error) {
    console.error('Kaif Life create group error:', error);
    res.status(500).json({ error: 'Не удалось создать группу' });
  }
});

router.patch('/groups/:id', async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 200) : '';
    if (!mongoose.Types.ObjectId.isValid(id) || !title) {
      return res.status(400).json({ error: 'Введите название группы' });
    }

    const group = await KaifLifeGroup.findOne({ _id: id, userId: req.userId });
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }

    group.title = title;
    await group.save();
    res.json({ group: serializeGroup(group) });
  } catch (error) {
    console.error('Kaif Life rename group error:', error);
    res.status(500).json({ error: 'Не удалось переименовать группу' });
  }
});

router.patch('/groups/:id/move', async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const direction = parseDirection(req.body?.direction);
    if (!mongoose.Types.ObjectId.isValid(id) || !direction) {
      return res.status(400).json({ error: 'Некорректный запрос' });
    }

    const groups = await loadSortedGroups(String(req.userId));
    const index = groups.findIndex((group) => String(group._id) === id);
    if (index < 0) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }

    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= groups.length) {
      return res.json(await loadKaifLifeList(String(req.userId)));
    }

    const current = groups[index];
    const neighbor = groups[swapWith];
    groups[index] = neighbor;
    groups[swapWith] = current;
    await reindexDocuments(groups);

    res.json(await loadKaifLifeList(String(req.userId)));
  } catch (error) {
    console.error('Kaif Life move group error:', error);
    res.status(500).json({ error: 'Не удалось переместить группу' });
  }
});

router.delete('/groups/:id', async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }

    const group = await KaifLifeGroup.findOneAndDelete({ _id: id, userId: req.userId });
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }

    const ideas = await KaifLifeIdea.find({ userId: req.userId, groupId: id });
    const publicIds = ideas.flatMap((idea) => collectPublicIds(idea.stages));
    await KaifLifeIdea.deleteMany({ userId: req.userId, groupId: id });
    void destroyCloudinaryFiles(publicIds);

    const remaining = await loadSortedGroups(String(req.userId));
    await reindexDocuments(remaining);

    res.json({ ok: true });
  } catch (error) {
    console.error('Kaif Life delete group error:', error);
    res.status(500).json({ error: 'Не удалось удалить группу' });
  }
});

router.post('/ideas', async (req: ExtendedRequest, res: Response) => {
  try {
    const groupId = typeof req.body?.groupId === 'string' ? req.body.groupId : '';
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: 'Группа не найдена' });
    }

    const group = await KaifLifeGroup.findOne({ _id: groupId, userId: req.userId });
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }

    const title = typeof req.body?.title === 'string' ? req.body.title.slice(0, 500) : '';
    const idea = await KaifLifeIdea.create({
      userId: req.userId,
      groupId: group._id,
      title,
      sortOrder: await nextIdeaSortOrder(String(req.userId), String(group._id)),
      stages: sanitizeStages(req.body?.stages),
    });
    res.status(201).json({ idea: serializeIdea(idea) });
  } catch (error) {
    console.error('Kaif Life create error:', error);
    res.status(500).json({ error: 'Не удалось создать идею' });
  }
});

router.patch('/ideas/:id/move', async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const direction = parseDirection(req.body?.direction);
    if (!mongoose.Types.ObjectId.isValid(id) || !direction) {
      return res.status(400).json({ error: 'Некорректный запрос' });
    }

    const idea = await KaifLifeIdea.findOne({ _id: id, userId: req.userId });
    if (!idea?.groupId) {
      return res.status(404).json({ error: 'Идея не найдена' });
    }

    const groups = await loadSortedGroups(String(req.userId));
    const groupIndex = groups.findIndex((group) => String(group._id) === String(idea.groupId));
    if (groupIndex < 0) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }

    const currentGroup = groups[groupIndex];
    const currentIdeas = await loadSortedIdeas(String(req.userId), String(currentGroup._id));
    const ideaIndex = currentIdeas.findIndex((item) => String(item._id) === id);
    if (ideaIndex < 0) {
      return res.status(404).json({ error: 'Идея не найдена' });
    }

    switch (direction) {
      case 'up': {
        if (ideaIndex > 0) {
          const neighbor = currentIdeas[ideaIndex - 1];
          currentIdeas[ideaIndex - 1] = currentIdeas[ideaIndex];
          currentIdeas[ideaIndex] = neighbor;
          await reindexDocuments(currentIdeas);
          break;
        }
        if (groupIndex > 0) {
          const previousGroup = groups[groupIndex - 1];
          idea.groupId = previousGroup._id as mongoose.Types.ObjectId;
          idea.sortOrder = await nextIdeaSortOrder(String(req.userId), String(previousGroup._id));
          await idea.save();
          const remaining = currentIdeas.filter((item) => String(item._id) !== id);
          await reindexDocuments(remaining);
        }
        break;
      }
      case 'down': {
        if (ideaIndex < currentIdeas.length - 1) {
          const neighbor = currentIdeas[ideaIndex + 1];
          currentIdeas[ideaIndex + 1] = currentIdeas[ideaIndex];
          currentIdeas[ideaIndex] = neighbor;
          await reindexDocuments(currentIdeas);
          break;
        }
        if (groupIndex < groups.length - 1) {
          const nextGroup = groups[groupIndex + 1];
          const nextIdeas = await loadSortedIdeas(String(req.userId), String(nextGroup._id));
          idea.groupId = nextGroup._id as mongoose.Types.ObjectId;
          idea.sortOrder = -1;
          await idea.save();
          await reindexDocuments([idea, ...nextIdeas]);
        }
        break;
      }
      default: {
        const _exhaustive: never = direction;
        return _exhaustive;
      }
    }

    res.json(await loadKaifLifeList(String(req.userId)));
  } catch (error) {
    console.error('Kaif Life move idea error:', error);
    res.status(500).json({ error: 'Не удалось переместить идею' });
  }
});

router.get('/ideas/:id', async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Идея не найдена' });
    }

    const idea = await KaifLifeIdea.findOne({ _id: id, userId: req.userId });
    if (!idea) {
      return res.status(404).json({ error: 'Идея не найдена' });
    }

    res.json({ idea: serializeIdea(idea) });
  } catch (error) {
    console.error('Kaif Life get error:', error);
    res.status(500).json({ error: 'Не удалось загрузить идею' });
  }
});

router.put('/ideas/:id', async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Идея не найдена' });
    }

    const idea = await KaifLifeIdea.findOne({ _id: id, userId: req.userId });
    if (!idea) {
      return res.status(404).json({ error: 'Идея не найдена' });
    }

    if (typeof req.body?.title === 'string') {
      idea.title = req.body.title.slice(0, 500);
    }
    if (req.body?.stages !== undefined) {
      idea.stages = sanitizeStages(req.body.stages);
      idea.markModified('stages');
    }

    await idea.save();
    res.json({ idea: serializeIdea(idea) });
  } catch (error) {
    console.error('Kaif Life update error:', error);
    res.status(500).json({ error: 'Не удалось сохранить идею' });
  }
});

router.delete('/ideas/:id', async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Идея не найдена' });
    }

    const idea = await KaifLifeIdea.findOneAndDelete({ _id: id, userId: req.userId });
    if (!idea) {
      return res.status(404).json({ error: 'Идея не найдена' });
    }

    void destroyCloudinaryFiles(collectPublicIds(idea.stages));
    res.json({ ok: true });
  } catch (error) {
    console.error('Kaif Life delete error:', error);
    res.status(500).json({ error: 'Не удалось удалить идею' });
  }
});

router.post('/upload', upload.array('media', 12), async (req: ExtendedRequest, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'Файлы не были загружены' });
    }

    const items = files.map((file) => {
      const cloudinaryFile = file as Express.Multer.File & { path: string; filename: string };
      return {
        url: cloudinaryFile.path,
        publicId: cloudinaryFile.filename,
        mediaType: getResourceTypeFromFile(file),
      };
    });

    res.json({ items });
  } catch (error) {
    console.error('Kaif Life upload error:', error);
    res.status(500).json({ error: 'Не удалось загрузить файлы' });
  }
});

export default router;
