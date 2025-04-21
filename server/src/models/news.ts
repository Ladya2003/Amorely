import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: {
    url: { type: String },
    publicId: { type: String }
  },
  category: { type: String, enum: ['update', 'event', 'announcement'], default: 'announcement' },
  isPublished: { type: Boolean, default: true },
  publishDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('News', newsSchema); 