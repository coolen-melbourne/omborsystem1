require('dotenv').config();
const express = require('express');
const session = require('express-session');
// Yuqorida:
const MongoStore = require('connect-mongo').default ? require('connect-mongo').default : require('connect-mongo');
const compression = require('compression');
const minify = require('express-minify-html');
const path = require('path');
const hbs = require('hbs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorHandler');

// Helpers
require('./utils/helpers');

const app = express();
const port = process.env.PORT || 3150;

// Compression
app.use(compression());

// HTML minifikatsiya (production)
if (process.env.NODE_ENV === 'production') {
    app.use(minify({
        override: true,
        exception_url: false,
        htmlMinifier: {
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            minifyJS: true,
            minifyCSS: true
        }
    }));
}

// MongoDB ulanish va indekslar yaratish
connectDB().then(async () => {
    const db = mongoose.connection;
    try {
        // Indekslar (users kolleksiyasi uchun indeks modelda belgilangan, shuning uchun bu yerda qayta yaratilmaydi)
        await db.collection('products').createIndex({ active: 1, stock: 1 });
        await db.collection('orders').createIndex({ status: 1 });
        await db.collection('orders').createIndex({ acceptedBy: 1 });
        await db.collection('orders').createIndex({ createdAt: -1 });
        await db.collection('inventories').createIndex({ productId: 1, variant: 1 });
        console.log('Indekslar yaratildi');
    } catch (err) {
        // Agar indeks nomi bilan bog'liq xatolik bo'lsa (code 86), e'tiborsiz qoldiramiz
        if (err.code === 86) {
            console.log('Indeks allaqachon mavjud, davom etiladi.');
        } else {
            console.error('Indeks yaratishda xatolik:', err);
        }
    }
});

// Sessiya
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        touchAfter: 24 * 3600
    }),
    cookie: { maxAge: 1000 * 60 * 60, httpOnly: true }
}));


    app.get('/test-session', (req, res) => {
  res.json({ session: req.session });
});



// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Statik fayllar (keshlash bilan)
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
        if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// View engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Routes
app.use('/', productRoutes);
app.use('/', authRoutes);
app.use('/', cartRoutes);
app.use('/', orderRoutes);
app.use('/', dashboardRoutes);
app.use('/', adminRoutes);

// 404
app.use((req, res) => {
    res.status(404).send('Sahifa topilmadi');
});

// Error handler
app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
    console.log(`Server http://localhost:${port} da ishga tushdi`);
});