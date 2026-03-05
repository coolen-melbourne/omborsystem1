const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  type: { type: String, enum: ['income', 'expense'], required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: String,
  quantity: { type: Number, required: true, min: 1 },
  fromLocation: String,   // masalan "A-1-2" yoki bo'sh
  toLocation: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Movement', movementSchema);