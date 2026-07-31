import mongoose from 'mongoose';

const uploadJobSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['queued', 'parsing', 'resolving', 'saving', 'matching', 'completed', 'failed'],
      default: 'queued',
    },
    step: { type: String, default: 'Upload received' },
    documentType: { type: String, enum: ['po', 'grn', 'invoice'], required: true },
    filePath: { type: String, required: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    error: {
      code: { type: String },
      message: { type: String },
    },
  },
  { timestamps: true }
);

uploadJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export default mongoose.model('UploadJob', uploadJobSchema);
