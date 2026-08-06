import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export type AuthProvider = 'local' | 'google';

// Определяем интерфейс для документа пользователя
export interface UserDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  password?: string;
  authProvider: AuthProvider;
  googleId?: string;
  emailVerified: boolean;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpires?: Date | null;
  emailVerificationSentAt?: Date | null;
  emailVerificationSendCount?: number;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  birthday?: Date;
  partnerId?: mongoose.Types.ObjectId;
  theme: 'light' | 'dark' | 'system';
  locale?: string;
  primaryColor: 'pink' | 'purple' | 'blue' | 'orange' | 'dark-red' | 'dark-green';
  displayBadgeGameId?: string | null;
  showDisplayBadge?: boolean;
  localeBannerDismissedAt?: Date | null;
  installBannerDismissed?: boolean;
  chatRulesConsent?: {
    version: number;
    acceptedAt: Date;
  } | null;
  notificationSettings?: {
    email: {
      newContent: boolean;
      messages: boolean;
      events: boolean;
      news: boolean;
    };
    push: {
      newContent: boolean;
      messages: boolean;
      events: boolean;
      news: boolean;
      reports?: boolean;
    };
  };
  lastSeen?: Date;
  role: 'user' | 'admin' | 'system';
  isBlocked?: boolean;
  blockedAt?: Date;
  blockedReasons?: Partial<Record<'ru' | 'en' | 'es' | 'de' | 'fr' | 'pt' | 'uk', string>>;
  blockedBy?: mongoose.Types.ObjectId;
  isNewForAdmin?: boolean | null;
  adminAlertsClearedAt?: Date;
  adminUsersTabClearedAt?: Date;
  adminModerationTabClearedAt?: Date;
  sharedLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Определяем интерфейс для модели пользователя
interface UserModel extends mongoose.Model<UserDocument> {
  // Здесь можно добавить статические методы модели, если они есть
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  googleId: { type: String, unique: true, sparse: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationTokenHash: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  emailVerificationSentAt: { type: Date, default: null },
  emailVerificationSendCount: { type: Number, default: 0 },
  firstName: { type: String },
  lastName: { type: String },
  avatar: { type: String },
  bio: { type: String },
  birthday: { type: Date },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  locale: { type: String, default: 'ru' },
  primaryColor: { type: String, enum: ['pink', 'purple', 'blue', 'orange', 'dark-red', 'dark-green'], default: 'pink' },
  displayBadgeGameId: { type: String, default: null },
  showDisplayBadge: { type: Boolean, default: true },
  localeBannerDismissedAt: { type: Date, default: null },
  installBannerDismissed: { type: Boolean, default: false },
  chatRulesConsent: {
    version: { type: Number },
    acceptedAt: { type: Date },
  },
  notificationSettings: {
    email: {
      newContent: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      news: { type: Boolean, default: false }
    },
    push: {
      newContent: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      events: { type: Boolean, default: false },
      news: { type: Boolean, default: false },
      reports: { type: Boolean, default: true }
    }
  },
  lastSeen: { type: Date },
  role: { type: String, enum: ['user', 'admin', 'system'], default: 'user' },
  isBlocked: { type: Boolean, default: false },
  blockedAt: { type: Date },
  blockedReasons: {
    ru: { type: String },
    en: { type: String },
    es: { type: String },
    de: { type: String },
    fr: { type: String },
    pt: { type: String },
    uk: { type: String },
  },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isNewForAdmin: { type: Boolean, default: null },
  adminAlertsClearedAt: { type: Date },
  adminUsersTabClearedAt: { type: Date },
  adminModerationTabClearedAt: { type: Date },
  sharedLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date },
  },
  createdAt: { type: Date, default: Date.now }
});

// Метод для сравнения паролей
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Хеширование пароля перед сохранением
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model<UserDocument, UserModel>('User', userSchema);
