const express = require('express');
const { 
  checkout,
  getOrderDetails,
  acknowledgeOrder,
  exportOrdersToExcel,
  exportSummaryByPerson,
  exportMonthlySummary,
  getSalespersonDashboard,
  generateOrderPDF
} = require('../controllers/orderController');
const { requireLogin, requireReporter } = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes (yoki login talab qiladigan)
router.post('/checkout', checkout);
router.get('/order-details/:id', getOrderDetails);

// Reporter (user3) huquqi talab qilinadigan route'lar
router.post('/orders/acknowledge/:id', requireReporter, acknowledgeOrder);
router.get('/orders/export', requireReporter, exportOrdersToExcel);
router.get('/orders/export-by-person', requireReporter, exportSummaryByPerson);
router.get('/orders/monthly-summary', requireReporter, exportMonthlySummary);

// Har qanday login bo‘lgan foydalanuvchi uchun
router.get('/salesperson', requireLogin, getSalespersonDashboard);
router.get('/order/pdf/:id', requireLogin, generateOrderPDF);
router.get('/api/new-orders-count', requireLogin, async (req, res) => {
    try {
        const count = await Order.countDocuments({ status: 'Yangi' });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;