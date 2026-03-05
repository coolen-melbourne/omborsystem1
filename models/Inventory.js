const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  itemsPerQop: { type: Number, default: 1, min: 1 },
  rowName: { type: String, required: true },
  shelf: { type: String, required: true },
  level: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);