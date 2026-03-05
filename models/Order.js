const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  price: Number,
  quantity: Number,
  image: String,
  variant: String,
  itemsPerQop: { type: Number, default: 1 }
});

const orderSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  phone: String,
  items: [orderItemSchema],
  totalItems: Number,
  totalPrice: Number,
  status: { type: String, default: 'Yangi', enum: ['Yangi', 'Ko‘rildi', 'Yetkazildi'] },
  acceptedBy: { type: String, default: '' }   // yangi maydon – kim qabul qilgani
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);