import mongoose from 'mongoose';

const poItemSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, trim: true, index: true },
    poDate: { type: Date, required: true },
    vendorName: { type: String, trim: true, default: '' },
    items: { type: [poItemSchema], default: [] },
    rawParsed: { type: mongoose.Schema.Types.Mixed, required: true },
    filePath: { type: String, required: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ poNumber: 1, createdAt: 1 });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
