const Inventory = require('../models/Inventory');
const Movement = require('../models/Movement');
const Product = require('../models/Product');

// Add product to inventory (income)
// Add product to inventory (income)
exports.addInventory = async (req, res) => {
  try {
    const { modelName, variant, quantity, itemsPerQop, rowName, shelf, level } = req.body;

    if (!modelName || !variant || !quantity || !rowName || !shelf || !level) {
      return res.status(400).send('Barcha maydonlarni to‘ldiring');
    }

    // Find or create product
    let product = await Product.findOne({ name: { $regex: new RegExp('^' + modelName + '$', 'i') } });
    if (!product) {
      product = new Product({
        name: modelName,
        price: 0,
        stock: 0,
        image: '/images/default.jpg',
        variant: '',
        itemsPerQop: 1,
        active: true,
        promotion: false
      });
      await product.save();
    }

    const inventoryItem = new Inventory({
      productId: product._id,
      variant,
      quantity: parseInt(quantity),
      itemsPerQop: parseInt(itemsPerQop) || 1,
      rowName,
      shelf,
      level
    });
    await inventoryItem.save();

    product.stock += parseInt(quantity);
    await product.save();

    await Movement.create({
      type: 'income',
      productId: product._id,
      variant,
      quantity: parseInt(quantity),
      fromLocation: '',
      toLocation: `${rowName}-${shelf}-${level}`,
      date: new Date()
    });

    // ✅ Foydalanuvchini oldingi sahifaga qaytarish
    res.redirect(req.get('Referrer') || '/dashboard');
  } catch (err) {
    console.error('Error in addInventory:', err);
    res.status(500).send('Server xatosi: ' + err.message);
  }
};

// Move inventory item (placeholder – adapt to your needs)
exports.moveInventory = async (req, res) => {
  try {
    // ... your move logic ...
    res.redirect('/dashboard2');
  } catch (err) {
    console.error('Error in moveInventory:', err);
    res.status(500).send('Server xatosi');
  }
};

// Remove inventory (expense)
exports.removeInventory = async (req, res) => {
  try {
    // ... your remove logic ...
    res.redirect('/dashboard2');
  } catch (err) {
    console.error('Error in removeInventory:', err);
    res.status(500).send('Server xatosi');
  }
};