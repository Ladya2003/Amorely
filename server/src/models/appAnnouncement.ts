import mongoose from 'mongoose';
import { AppLocale } from '../i18n/locales';

export interface AnnouncementLocaleContent {
  title: string;
  preview: string;
  content: string;
}

export type AnnouncementTranslations = Partial<Record<AppLocale, AnnouncementLocaleContent>>;

/** Mongoose lean() may return null for unset nested locale entries. */
export type AnnouncementTranslationsSource = Partial<
  Record<AppLocale, AnnouncementLocaleContent | null | undefined>
>;

const localeContentSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    preview: { type: String, default: '' },
    content: { type: String, default: '' },
  },
  { _id: false }
);

const translationsSchema = new mongoose.Schema(
  {
    ru: { type: localeContentSchema, default: undefined },
    en: { type: localeContentSchema, default: undefined },
    es: { type: localeContentSchema, default: undefined },
    de: { type: localeContentSchema, default: undefined },
    fr: { type: localeContentSchema, default: undefined },
    pt: { type: localeContentSchema, default: undefined },
    uk: { type: localeContentSchema, default: undefined },
  },
  { _id: false }
);

const appAnnouncementSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  translations: { type: translationsSchema, default: () => ({}) },
  pushTitle: { type: String, default: 'Amorely' },
  pushBody: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
  pushSentAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

appAnnouncementSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('AppAnnouncement', appAnnouncementSchema);
