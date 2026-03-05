const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Movement = require('../models/Movement');
const Row = require('../models/Row');
const Order = require('../models/Order');

// ==================== USER1 DASHBOARD ====================
exports.getDashboard = async (req, res) => {
  try {
    // So'nggi 10 ta harakat
    const movements = await Movement.find()
      .populate('productId')
      .sort({ date: -1 })
      .limit(10)
      .lean();

    // Jami qoplar
    const totalBagsAgg = await Inventory.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const totalBags = totalBagsAgg[0]?.total || 0;

    // Qatorlar soni
    const totalRows = await Row.countDocuments();

    // Jami polkalar (barcha qatorlardagi polkalar yig'indisi)
    const rows = await Row.find();
    const totalShelves = rows.reduce((sum, row) => sum + row.shelves, 0);

    // Bandlik foizi (soddalashtirilgan – hisoblash murakkab)
    const occupiedPercent = 45; // keyinroq aniq hisoblash mumkin

    res.render('dashboard', {
      title: 'Dashboard',
      user: { username: req.session.username },
      transactions: movements, // frontend transactions kutadi
      totalIncome: movements
        .filter(m => m.type === 'income')
        .reduce((sum, m) => sum + (m.productId?.price || 0) * m.quantity, 0),
      totalExpense: movements
        .filter(m => m.type === 'expense')
        .reduce((sum, m) => sum + (m.productId?.price || 0) * m.quantity, 0),
      balance: 0, // hisoblash mumkin, hozircha 0
      totalBags,
      totalRows,
      totalShelves,
      occupiedPercent
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Server xatosi');
  }
};

// ==================== ADMIN DASHBOARD (dashboard2) ====================

exports.getAdminDashboard = async (req, res) => {
  try {
    const products = await Product.find().lean();
    // Do NOT populate rowId – it's now a string field
    const inventory = await Inventory.find()
      .populate('productId')
      .lean();

    const rows = await Row.find().lean(); // if you still use Row model elsewhere
    const movements = await Movement.find()
      .populate('productId')
      .sort({ date: -1 })
      .limit(20)
      .lean();

    // Variants for filter (unique)
    const variants = [...new Set(inventory.map(i => i.variant))];

    // Format inventory for frontend – use rowName directly
    const formattedInventory = inventory.map(i => ({
      id: i._id,
      productId: i.productId._id,
      productName: i.productId.name,
      variant: i.variant,
      quantity: i.quantity,
      itemsPerQop: i.itemsPerQop,
      rowName: i.rowName,
      shelf: i.shelf,
      level: i.level
    }));

    // Format movements
    const formattedMovements = movements.map(m => ({
      type: m.type,
      productName: m.productId ? m.productId.name : 'Noma’lum',
      variant: m.variant,
      quantity: m.quantity,
      fromLocation: m.fromLocation || '-',
      toLocation: m.toLocation || '-',
      date: m.date.toLocaleString('uz-UZ')
    }));

    res.render('admin-dashboard', {
      title: 'Admin Dashboard',
      user: { username: req.session.username },
      products,
      inventory: formattedInventory,
      rows,
      movements: formattedMovements,
      variants
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('Server xatosi');
  }
};

// ==================== REPORTER DASHBOARD (dashboard3) ====================
exports.getReporterDashboard = async (req, res) => {
  try {
    // Jami qoplar
    const totalBagsAgg = await Inventory.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const totalBags = totalBagsAgg[0]?.total || 0;

    // Jami qiymat
    const inventoryWithProducts = await Inventory.find().populate('productId');
    const totalValue = inventoryWithProducts.reduce((sum, item) => {
      return sum + (item.productId?.price || 0) * item.quantity;
    }, 0);

    // Kunlik kirim/chiqim (bugun)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const movementsToday = await Movement.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('productId');

    const dailyIncome = movementsToday
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + (m.productId?.price || 0) * m.quantity, 0);

    const dailyExpense = movementsToday
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + (m.productId?.price || 0) * m.quantity, 0);

    // So'nggi 30 kunlik ma'lumotlar (grafiklar uchun)
    const last30Days = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 29; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayMovements = await Movement.find({
        date: { $gte: day, $lt: nextDay }
      }).populate('productId');

      const dayIncome = dayMovements
        .filter(m => m.type === 'income')
        .reduce((sum, m) => sum + (m.productId?.price || 0) * m.quantity, 0);

      const dayExpense = dayMovements
        .filter(m => m.type === 'expense')
        .reduce((sum, m) => sum + (m.productId?.price || 0) * m.quantity, 0);

      last30Days.push(day.toLocaleDateString('uz-UZ'));
      incomeData.push(dayIncome);
      expenseData.push(dayExpense);
    }

    // Yangi buyurtmalar (status = 'Yangi')
    const newOrders = await Order.find({ status: 'Yangi' }).lean();
    const allOrders = await Order.find().sort({ createdAt: -1 }).lean();

    // So'nggi harakatlar (agar grafik o'rniga ishlatmoqchi bo'lsangiz)
    const recentMovements = await Movement.find()
      .populate('productId')
      .sort({ date: -1 })
      .limit(10)
      .lean();

    const formattedRecentMovements = recentMovements.map(m => ({
      type: m.type,
      productName: m.productId?.name || 'Noma’lum',
      variant: m.variant,
      quantity: m.quantity,
      fromLocation: m.fromLocation || '-',
      toLocation: m.toLocation || '-',
      date: m.date
    }));

    res.render('dashboard3', {
      title: 'Hisobot Dashboard',
      user: { username: req.session.username },
      totalBags,
      totalValue,
      dailyIncome,
      dailyExpense,
      orders: newOrders,
      allOrders,
      last30Days,
      incomeData,
      expenseData,
      recentMovements: formattedRecentMovements // agar kerak bo'lsa
    });
  } catch (err) {
    console.error('Reporter dashboard error:', err);
    res.status(500).send('Server xatosi');
  }
};