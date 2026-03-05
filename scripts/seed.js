const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Row = require('../models/Row');

// Debug: check if MONGO_URL is loaded
console.log('MONGO_URL from env:', process.env.MONGO_URL);

if (!process.env.MONGO_URL) {
  console.error('ERROR: MONGO_URL is not defined in .env file');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional – comment out if you want to keep old data)
    await User.deleteMany({});
    await Product.deleteMany({});
    await Row.deleteMany({});

    // Create users
    const users = [
      { username: 'user1', password: await bcrypt.hash('1', 10), role: 'user' },
      { username: 'user2', password: await bcrypt.hash('2', 10), role: 'admin' },
      { username: 'user3', password: await bcrypt.hash('3', 10), role: 'reporter' }
    ];
    await User.insertMany(users);
    console.log('✅ Users created');

    // Create rows
    const rows = [
      { name: 'A', shelves: 20, levelsPerShelf: 2 },
      { name: 'B', shelves: 20, levelsPerShelf: 2 },
      { name: 'C', shelves: 20, levelsPerShelf: 2 }
    ];
    await Row.insertMany(rows);
    console.log('✅ Rows created');

    // Create products
    const products = [
      { name: 'Klassik krossovkalar', price: 89, stock: 10, image: '/images/krossovka.jpg', active: true, promotion: false },
      { name: 'Minimal soat', price: 149, stock: 5, image: '/images/soat.jpg', active: true, promotion: true },
      { name: 'Somon sumka', price: 59, stock: 8, image: '/images/bembi.jpg', active: true, promotion: false }
    ];
    await Product.insertMany(products);
    console.log('✅ Products created');

    console.log('🎉 Seed data inserted successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  });