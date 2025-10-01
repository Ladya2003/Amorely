import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Если контент для партнера
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  resourceType: { type: String, enum: ['image', 'video'], required: true },
  fileSize: { type: Number, default: 0 }, // Размер файла в байтах
  frequency: {
    count: { type: Number, default: 3 },
    hours: { type: Number, default: 24 }
  },
  displayedCount: { type: Number, default: 0 },
  lastDisplayed: { type: Date },
  nextDisplay: { type: Date },
  customDate: { type: Date },
  
  // Новые поля для ротации контента
  rotationOrder: { type: Number, default: 0 }, // Порядок в ротации
  currentBatch: { type: Number, default: 0 }, // Текущий батч показа
  isActive: { type: Boolean, default: false }, // Активен ли контент сейчас
  batchStartTime: { type: Date }, // Время начала текущего батча
  totalBatches: { type: Number, default: 0 }, // Общее количество батчей для полного цикла
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Content', contentSchema); 