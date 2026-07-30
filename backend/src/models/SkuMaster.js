const mongoose = require('mongoose');

const skuMasterSchema = new mongoose.Schema(
  {
    skuErpCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    eanCode: { type: String, trim: true, default: null },
    hsnCode: { type: String, trim: true, default: null },
    uom: { type: String, trim: true, default: null },
    agreedRate: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0, default: null },
    priceTolerance: { type: Number, default: 0.05, min: 0, max: 1 },
  },
  { timestamps: true }
);

skuMasterSchema.index({ eanCode: 1 });

module.exports = mongoose.model('SkuMaster', skuMasterSchema);
