import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Определяем интерфейс для документа пользователя
export interface UserDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  partnerId?: mongoose.Types.ObjectId;
  relationshipStartDate?: Date;
  theme: 'light' | 'dark' | 'system';
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
    };
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
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  avatar: { type: String },
  bio: { type: String },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relationshipStartDate: { type: Date },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
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
      news: { type: Boolean, default: false }
    }
  },
  createdAt: { type: Date, default: Date.now }
});

// Метод для сравнения паролей
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Хеширование пароля перед сохранением
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export default mongoose.model<UserDocument, UserModel>('User', userSchema); 