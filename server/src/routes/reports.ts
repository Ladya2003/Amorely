import express, { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import mongoose from 'mongoose';
import ChatReport from '../models/chatReport';
import User from '../models/user';
import { authMiddleware } from '../middleware/auth';
import { notifyNewReport } from '../services/pushService';

interface AuthRequest extends Request {
  userId?: string;
}

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'amorely/reports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'],
    resource_type: 'auto',
  } as any,
});

const upload = multer({ storage });

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

router.post('/', authMiddleware, upload.array('media'), async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.userId as string;
    const reportedUserId = String(req.body.reportedUserId ?? '').trim();
    const text = String(req.body.text ?? '').trim();

    if (!reportedUserId || !mongoose.Types.ObjectId.isValid(reportedUserId)) {
      return res.status(400).json({ error: 'Некорректный пользователь' });
    }

    if (reportedUserId === reporterId) {
      return res.status(400).json({ error: 'Нельзя отправить жалобу на самого себя' });
    }

    if (!text) {
      return res.status(400).json({ error: 'Укажите текст жалобы' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Текст жалобы слишком длинный' });
    }

    const reportedUser = await User.findById(reportedUserId).select('_id');
    if (!reportedUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const uploadedFiles = (req.files as Express.Multer.File[] | undefined) ?? [];
    const media = uploadedFiles.map((file) => ({
      url: file.path,
      publicId: file.filename,
      resourceType: getResourceTypeFromFile(file),
    }));

    const report = await ChatReport.create({
      reporterId,
      reportedUserId,
      text,
      media,
    });

    void notifyNewReport({
      reportId: report._id.toString(),
      reporterId,
      reportedUserId,
      text,
    });

    return res.status(201).json({
      id: report._id.toString(),
      message: 'Жалоба отправлена',
    });
  } catch (error) {
    console.error('Ошибка при создании жалобы:', error);
    return res.status(500).json({ error: 'Ошибка при отправке жалобы' });
  }
});

export default router;
