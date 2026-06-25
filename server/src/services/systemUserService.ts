import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import User from '../models/user';

export const SYSTEM_USER_USERNAME = '__system_messages__';
export const SYSTEM_USER_EMAIL = 'system-messages@amorely.internal';

const SYSTEM_AVATAR_VERSION = 'v2';
const SYSTEM_AVATAR_ASSET_PATH = path.join(__dirname, '../../assets/system-messages-avatar.png');
let cachedSystemUserId: string | null = null;

export const isSystemUserId = (userId: string): boolean =>
  Boolean(cachedSystemUserId && cachedSystemUserId === userId);

export const getSystemUserId = (): string | null => cachedSystemUserId;

const buildStaticSystemAvatarUrl = (): string => {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
  const basePath = (process.env.APP_BASE_PATH || '').replace(/\/$/, '');
  return `${clientUrl}${basePath}/avatars/system-messages.png?v=${SYSTEM_AVATAR_VERSION}`;
};

const uploadSystemAvatarToCloudinary = async (): Promise<string | null> => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return null;
  }

  if (!fs.existsSync(SYSTEM_AVATAR_ASSET_PATH)) {
    console.warn('Файл аватара системного пользователя не найден:', SYSTEM_AVATAR_ASSET_PATH);
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(SYSTEM_AVATAR_ASSET_PATH, {
      folder: 'amorely/system',
      public_id: `system-messages-avatar-${SYSTEM_AVATAR_VERSION}`,
      overwrite: true,
      resource_type: 'image'
    });
    return result.secure_url;
  } catch (error) {
    console.error('Не удалось загрузить аватар системного пользователя в Cloudinary:', error);
    return null;
  }
};

const resolveSystemAvatarUrl = async (): Promise<string> => {
  const cloudinaryUrl = await uploadSystemAvatarToCloudinary();
  return cloudinaryUrl || buildStaticSystemAvatarUrl();
};

export const ensureSystemUser = async (): Promise<string> => {
  if (cachedSystemUserId) {
    return cachedSystemUserId;
  }

  let user = await User.findOne({ username: SYSTEM_USER_USERNAME });

  if (!user) {
    const avatar = await resolveSystemAvatarUrl();
    user = new User({
      email: SYSTEM_USER_EMAIL,
      username: SYSTEM_USER_USERNAME,
      password: `system-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      firstName: 'System',
      lastName: 'Messages',
      role: 'system',
      avatar
    });
    await user.save();
    console.log('Создан системный пользователь для уведомлений о дедлайнах заметок');
  } else {
    let shouldSave = false;

    if (user.role !== 'system') {
      user.role = 'system';
      shouldSave = true;
    }

    const hasCustomAvatar =
      user.avatar?.includes(`system-messages-avatar-${SYSTEM_AVATAR_VERSION}`) ||
      user.avatar?.includes(`/avatars/system-messages.png?v=${SYSTEM_AVATAR_VERSION}`);

    if (!hasCustomAvatar) {
      user.avatar = await resolveSystemAvatarUrl();
      shouldSave = true;
    }

    if (shouldSave) {
      await user.save();
    }
  }

  cachedSystemUserId = user._id.toString();
  return cachedSystemUserId;
};

/** Обновляет аватар системного пользователя (например после деплоя новой картинки). */
export const refreshSystemUserAvatar = async (): Promise<string | null> => {
  const user = await User.findOne({ username: SYSTEM_USER_USERNAME });
  if (!user) {
    return null;
  }

  user.avatar = await resolveSystemAvatarUrl();
  await user.save();
  return user.avatar;
};
