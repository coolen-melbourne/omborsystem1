const express = require('express');
const session = require('express-session');
const path = require('path');
const hbs = require('hbs');

const app = express();
const port = 3150;

// Handlebars helper: eq (tenglikni tekshirish)
hbs.registerHelper('eq', function(a, b) {
    return a === b;
});

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessiya sozlash
app.use(session({
    secret: 'mySuperSecretKey123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 } // 1 soat
}));

// Public folder
app.use(express.static(path.join(__dirname, 'public')));

// HBS sozlamalari
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// 3 ta oldindan belgilangan foydalanuvchi
const users = [
    { username: 'user1', password: 'parol1' },
    { username: 'user2', password: 'parol2' },
    { username: 'user3', password: 'parol3' }
];

// Himoyalangan sahifalar uchun middleware
function requireLogin(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
    }
}

// ---------- ROUTES ----------

// Asosiy marketpleys sahifasi (hamma ochiq)
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Mukammal Marketplace',
        user: req.session.user
    });
});

// Login sahifasi (GET)
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    const returnTo = req.query.returnTo || '/dashboard';
    res.render('login', { 
        title: 'Kirish', 
        error: null,
        returnTo
    });
});

// Login (POST)
app.post('/login', (req, res) => {
    const { username, password, returnTo } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        req.session.user = { username: user.username };
        if (!req.session.transactions) {
            req.session.transactions = [];
        }
        const redirectUrl = returnTo || '/dashboard';
        return res.redirect(redirectUrl);
    } else {
        res.render('login', { 
            title: 'Kirish', 
            error: 'Login yoki parol noto‘g‘ri',
            returnTo: returnTo || '/dashboard'
        });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// DASHBOARD – kirim/chiqim boshqaruvi (faqat login qilganlar)
app.get('/dashboard', requireLogin, (req, res) => {
    const transactions = req.session.transactions || [];

    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpense += t.amount;
    });
    const balance = totalIncome - totalExpense;

    res.render('dashboard', {
        title: 'Dashboard',
        user: req.session.user,
        transactions,
        totalIncome,
        totalExpense,
        balance
    });
});

// Yangi tranzaksiya qo'shish (POST)
app.post('/dashboard/add', requireLogin, (req, res) => {
    const { type, description, amount } = req.body;
    if (!type || !description || !amount) {
        return res.redirect('/dashboard');
    }
    const newTransaction = {
        id: Date.now() + Math.random(),
        type,
        description,
        amount: parseFloat(amount),
        date: new Date().toLocaleString('uz-UZ')
    };
    if (!req.session.transactions) {
        req.session.transactions = [];
    }
    req.session.transactions.push(newTransaction);
    res.redirect('/dashboard');
});

// Tranzaksiyani o'chirish
app.post('/dashboard/delete/:id', requireLogin, (req, res) => {
    const id = parseFloat(req.params.id);
    if (req.session.transactions) {
        req.session.transactions = req.session.transactions.filter(t => t.id !== id);
    }
    res.redirect('/dashboard');
});

// Serverni ishga tushirish
app.listen(port, () => {
    console.log(`Server http://localhost:${port} da ishlamoqda`);
});