const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0 },   // min constraint removed
  image: { type: String, default: '/images/default.jpg' },
  variant: { type: String, default: '' },
  itemsPerQop: { type: Number, default: 1, min: 1 },
  active: { type: Boolean, default: true },
  promotion: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);