import mongoose from 'mongoose';

const planNoteMediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ['image', 'video'], required: true },
    fileSize: { type: Number, default: 0 },
    encrypted: { type: Boolean, default: true },
    mediaEnvelope: {
      mimeType: { type: String },
      displayType: { type: String, enum: ['image', 'video'] }
    },
    encryptedMediaEnvelope: {
      ciphertext: { type: String },
      iv: { type: String }
    },
    metadataSenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadataRecipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: true }
);

const planNoteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, default: '', trim: true, maxlength: 10000 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    media: { type: [planNoteMediaSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

planNoteSchema.index({ userId: 1, partnerId: 1, updatedAt: -1 });
planNoteSchema.index({ category: 1 });

export default mongoose.model('PlanNote', planNoteSchema);
