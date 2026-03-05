const Product = require('../models/Product');

// Add to cart (AJAX)
exports.addToCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findOne({ _id: productId, active: true });
    if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });

    req.session.cart = req.session.cart || [];
    const existingItem = req.session.cart.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += 1;  // allow any quantity, no stock limit
    } else {
      req.session.cart.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: 1,
        stock: product.stock,      // we still store current stock for display
        image: product.image,
        variant: product.variant,
        itemsPerQop: product.itemsPerQop
      });
    }

    const totalItems = req.session.cart.reduce((sum, i) => sum + i.quantity * i.itemsPerQop, 0);
    const totalPrice = req.session.cart.reduce((sum, i) => sum + i.price * i.quantity * i.itemsPerQop, 0);
    res.json({ success: true, cart: req.session.cart, totalItems, totalPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// Get cart data (AJAX)
exports.getCartData = (req, res) => {
  const cart = req.session.cart || [];
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.json({ cart, totalItems, totalPrice });
};

// Render cart page
exports.renderCart = async (req, res) => {
  const cart = req.session.cart || [];
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // For orders history, we'll fetch from DB (user specific if needed)
  const Order = require('../models/Order');
  const orders = await Order.find().sort({ createdAt: -1 }).lean();

 res.render('cart', {
  title: 'Savat',
  user: req.session.userId ? { 
    username: req.session.username,
    role: req.session.role      // ✅ role qo‘shildi
  } : null,
  cart,
  orders,
  totalItems,
  totalPrice
});
};

// Update quantity (AJAX)
exports.updateCartItem = async (req, res) => {
  try {
    const productId = req.params.id;
    const newQuantity = parseInt(req.body.quantity);
    const cart = req.session.cart || [];
    const itemIndex = cart.findIndex(i => i.productId === productId);
    if (itemIndex === -1) return res.status(404).json({ error: 'Mahsulot topilmadi' });

    if (newQuantity >= 1) {
      cart[itemIndex].quantity = newQuantity;
    } else {
      return res.status(400).json({ error: 'Noto‘g‘ri miqdor' });
    }
    req.session.cart = cart;

    const totalItems = cart.reduce((sum, i) => sum + i.quantity * i.itemsPerQop, 0);
    const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity * i.itemsPerQop, 0);
    const itemTotal = cart[itemIndex].price * cart[itemIndex].quantity * cart[itemIndex].itemsPerQop;
    res.json({ success: true, totalItems, totalPrice, itemTotal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// Remove item from cart (AJAX)
exports.removeCartItem = (req, res) => {
  const productId = req.params.id;
  req.session.cart = (req.session.cart || []).filter(i => i.productId !== productId);
  res.json({ success: true });
};