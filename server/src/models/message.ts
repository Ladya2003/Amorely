import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true }
});

const replySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: false },
    senderAvatar: { type: String, required: false }
  },
  { _id: false }
);

const encryptedPayloadSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true, default: 1 },
    algorithm: { type: String, required: true, default: 'ECDH-P256-AES-GCM' },
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    senderDeviceId: { type: String, required: true }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String },
  attachments: [attachmentSchema],
  encryptedPayload: { type: encryptedPayloadSchema, required: false },
  replyTo: { type: replySchema, required: false },
  forwardFrom: { type: replySchema, required: false },
  editedAt: { type: Date, required: false },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Message', messageSchema); 