const express = require('express');
const {
  addToCart,
  getCartData,
  renderCart,
  updateCartItem,
  removeCartItem
} = require('../controllers/cartController');
const router = express.Router();

router.get('/cart-data', getCartData);
router.get('/cart', renderCart);
router.post('/add-to-cart/:id', addToCart);
router.post('/cart/update-ajax/:id', updateCartItem);
router.post('/cart/remove/:id', removeCartItem);

module.exports = router;