import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Если контент для партнера
  url: { type: String }, // Необязательно для текстовых событий
  publicId: { type: String, required: true },
  resourceType: { type: String, enum: ['image', 'video'], required: true },
  fileSize: { type: Number, default: 0 }, // Размер файла в байтах
  sortOrder: { type: Number, default: 0 }, // Порядок сортировки для drag & drop
  frequency: {
    count: { type: Number, default: 3 },
    hours: { type: Number, default: 24 }
  },
  displayedCount: { type: Number, default: 0 },
  lastDisplayed: { type: Date },
  nextDisplay: { type: Date },
  customDate: { type: Date },
  
  // Поля для событий календаря
  eventId: { type: String }, // ID события для группировки медиафайлов
  title: { type: String }, // Заголовок события
  description: { type: String }, // Описание события
  eventDate: { type: Date }, // Дата события (может отличаться от createdAt)
  showInFeed: { type: Boolean, default: true }, // Показывать ли в ленте
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Кто создал событие
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Кто последним редактировал
  lastEditedAt: { type: Date }, // Когда последний раз редактировалось
  
  // Новые поля для ротации контента
  rotationOrder: { type: Number, default: 0 }, // Порядок в ротации
  currentBatch: { type: Number, default: 0 }, // Текущий батч показа
  isActive: { type: Boolean, default: false }, // Активен ли контент сейчас
  batchStartTime: { type: Date }, // Время начала текущего батча
  totalBatches: { type: Number, default: 0 }, // Общее количество батчей для полного цикла
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Content', contentSchema); 