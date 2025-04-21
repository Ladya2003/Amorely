import mongoose from 'mongoose';

declare module 'mongoose' {
  interface UserDocument extends mongoose.Document {
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
}
