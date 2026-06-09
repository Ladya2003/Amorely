import mongoose from 'mongoose';

const encryptedTextSchema = {
  ciphertext: { type: String },
  iv: { type: String }
};

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
    encryptedMediaEnvelope: encryptedTextSchema,
    encryptedMediaEnvelopePartner: encryptedTextSchema,
    metadataSenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadataRecipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: true }
);

const planNoteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    encrypted: { type: Boolean, default: false },
    title: { type: String, trim: true, maxlength: 200 },
    content: { type: String, default: '', trim: true, maxlength: 10000 },
    category: { type: String, trim: true, maxlength: 100 },
    encryptedTitle: encryptedTextSchema,
    encryptedTitlePartner: encryptedTextSchema,
    encryptedContent: encryptedTextSchema,
    encryptedContentPartner: encryptedTextSchema,
    encryptedCategory: encryptedTextSchema,
    encryptedCategoryPartner: encryptedTextSchema,
    metadataSenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadataRecipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    media: { type: [planNoteMediaSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hiddenFromUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

planNoteSchema.index({ userId: 1, partnerId: 1, updatedAt: -1 });
planNoteSchema.index({ category: 1 });

export default mongoose.model('PlanNote', planNoteSchema);
