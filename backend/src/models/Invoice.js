import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    unitRate: { type: Number, min: 0, default: null },
    mrp: { type: Number, min: 0, default: null },
    skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true },
    poNumber: { type: String, required: true, trim: true, index: true },
    invoiceDate: { type: Date, required: true },
    items: { type: [invoiceItemSchema], default: [] },
    rawParsed: { type: mongoose.Schema.Types.Mixed, required: true },
    filePath: { type: String, required: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ poNumber: 1, invoiceNumber: 1 });

export default mongoose.model('Invoice', invoiceSchema);
