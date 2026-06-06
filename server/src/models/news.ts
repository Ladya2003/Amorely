import mongoose from 'mongoose';
import { SUPPORTED_LOCALES } from '../i18n/locales';

const localeContentSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    content: { type: String, default: '' },
  },
  { _id: false }
);

const translationsSchema = new mongoose.Schema(
  Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, { type: localeContentSchema, default: () => ({}) }])
  ),
  { _id: false }
);

const newsSchema = new mongoose.Schema({
  /** Legacy fields synced from translations.ru for backward compatibility */
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  translations: { type: translationsSchema, default: () => ({}) },
  image: {
    url: { type: String },
    publicId: { type: String },
  },
  images: [
    {
      url: { type: String, required: true },
      publicId: { type: String },
      resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
      caption: { type: String },
    },
  ],
  category: { type: String, enum: ['update', 'event', 'announcement'], default: 'announcement' },
  isPublished: { type: Boolean, default: true },
  publishDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('News', newsSchema);
