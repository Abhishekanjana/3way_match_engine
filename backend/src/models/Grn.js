import mongoose from 'mongoose';

const grnItemSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    receivedQuantity: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0, default: null },
    skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
  },
  { _id: false }
);

const grnSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, trim: true },
    poNumber: { type: String, required: true, trim: true, index: true },
    grnDate: { type: Date, required: true },
    items: { type: [grnItemSchema], default: [] },
    rawParsed: { type: mongoose.Schema.Types.Mixed, required: true },
    filePath: { type: String, required: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
  },
  { timestamps: true }
);

grnSchema.index({ poNumber: 1, grnNumber: 1 });

export default mongoose.model('Grn', grnSchema);
