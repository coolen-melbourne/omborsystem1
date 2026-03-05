const express = require('express');
const { requireLogin, requireAdmin } = require('../middleware/authMiddleware');
const { upload, resizeImage } = require('../middleware/upload');
const {
  getAdminProducts,
  addProduct,
  editProduct,
  deleteProduct,
  toggleActive
} = require('../controllers/productController');
const {
  addInventory,
  moveInventory,
  removeInventory
} = require('../controllers/inventoryController');
const router = express.Router();

// ✅ INVENTAR ROUTES – har qanday tizimga kirgan foydalanuvchi uchun
router.post('/inventory/add', requireLogin, addInventory);
router.post('/inventory/move', requireLogin, moveInventory);
router.post('/inventory/remove', requireLogin, removeInventory);

// ❌ Quyidagi barcha route'lar faqat admin uchun
router.use(requireAdmin);

// Admin route'lari (faqat admin)
router.get('/dashboard2', getAdminProducts);
router.post('/admin/add-product', upload.single('image'), resizeImage, addProduct);
router.post('/admin/edit-product/:id', upload.single('image'), resizeImage, editProduct);
router.post('/admin/delete-product/:id', deleteProduct);
router.post('/admin/toggle-product/:id', toggleActive);

module.exports = router;