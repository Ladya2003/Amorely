import express, { Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import mongoose from 'mongoose';
import { ExtendedRequest } from '../types/mongoose';
import User from '../models/user';
import KaifLifeIdea, {
  KAIF_LIFE_STAGE_KEYS,
  KaifLifeContentBlock,
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

const serializeIdea = (idea: {
  _id: unknown;
  title: string;
  stages: KaifLifeStages;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  _id: String(idea._id),
  title: idea.title,
  stages: KAIF_LIFE_STAGE_KEYS.reduce((acc, key) => {
    const stage = idea.stages[key] ?? emptyStage();
    acc[key] = {
      done: Boolean(stage.done),
      deadline: stage.deadline ? new Date(stage.deadline).toISOString() : null,
      blocks: stage.blocks ?? [],
    };
    return acc;
  }, {} as Record<KaifLifeStageKey, { done: boolean; deadline: string | null; blocks: KaifLifeContentBlock[] }>),
  createdAt: idea.createdAt.toISOString(),
  updatedAt: idea.updatedAt.toISOString(),
});

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
    const ideas = await KaifLifeIdea.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json({ ideas: ideas.map(serializeIdea) });
  } catch (error) {
    console.error('Kaif Life list error:', error);
    res.status(500).json({ error: 'Не удалось загрузить идеи' });
  }
});

router.post('/ideas', async (req: ExtendedRequest, res: Response) => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.slice(0, 500) : '';
    const idea = await KaifLifeIdea.create({
      userId: req.userId,
      title,
      stages: sanitizeStages(req.body?.stages),
    });
    res.status(201).json({ idea: serializeIdea(idea) });
  } catch (error) {
    console.error('Kaif Life create error:', error);
    res.status(500).json({ error: 'Не удалось создать идею' });
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
