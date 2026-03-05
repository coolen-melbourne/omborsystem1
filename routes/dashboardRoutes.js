const express = require('express');
const { requireLogin, requireAdmin, requireReporter } = require('../middleware/authMiddleware');
const { getDashboard, getAdminDashboard, getReporterDashboard } = require('../controllers/dashboardController');
const router = express.Router();

router.get('/dashboard', requireLogin, getDashboard);
router.get('/dashboard2', requireAdmin, getAdminDashboard);
router.get('/dashboard3', requireReporter, getReporterDashboard);

module.exports = router;