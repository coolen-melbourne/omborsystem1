const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};
const createIndexes = async () => {
    const db = mongoose.connection;
    await db.collection('products').createIndex({ active: 1, stock: 1 });
    await db.collection('orders').createIndex({ status: 1 });
    await db.collection('orders').createIndex({ acceptedBy: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });
    await db.collection('inventories').createIndex({ productId: 1, variant: 1 });
    console.log('MongoDB indekslari yaratildi');
};

module.exports = connectDB;