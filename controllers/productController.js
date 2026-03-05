const Product = require("../models/Product");
const path = require("path");
const fs = require("fs");

// Admin: list products
exports.getAdminProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;

    const products = await Product.find()
      .select("name price stock image active promotion variant itemsPerQop")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.render("admin-dashboard", {
      title: "Admin Dashboard",
      user: { username: req.session.username },
      products,
      page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server xatosi");
  }
};

// Add product
exports.addProduct = async (req, res) => {
  try {
    const { name, price, stock, variant, itemsPerQop, active, promotion } =
      req.body;

    const image = req.file
      ? "/uploads/" + req.file.filename
      : "/images/default.jpg";

    const product = new Product({
      name,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      variant: variant || "",
      itemsPerQop: parseInt(itemsPerQop) || 1,
      image,
      active: active === "on",
      promotion: promotion === "on",
    });

    await product.save();

    res.redirect("/dashboard2");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server xatosi");
  }
};

// Edit product
exports.editProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const { name, price, stock, variant, itemsPerQop, active, promotion } =
      req.body;

    const product = await Product.findById(productId);

    if (!product) return res.status(404).send("Mahsulot topilmadi");

    product.name = name;
    product.price = parseFloat(price);
    product.stock = parseInt(stock) || 0;
    product.variant = variant || "";
    product.itemsPerQop = parseInt(itemsPerQop) || 1;
    product.active = active === "on";
    product.promotion = promotion === "on";

    if (req.file) {
      if (product.image && !product.image.includes("default.jpg")) {
        const oldImagePath = path.join(__dirname, "../public", product.image);

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      product.image = "/uploads/" + req.file.filename;
    }

    await product.save();

    res.redirect("/dashboard2");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server xatosi");
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (product && product.image && !product.image.includes("default.jpg")) {
      const imagePath = path.join(__dirname, "../public", product.image);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Product.findByIdAndDelete(productId);

    res.redirect("/dashboard2");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server xatosi");
  }
};

// Toggle active
exports.toggleActive = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (product) {
      await Product.findByIdAndUpdate(productId, {
        active: !product.active,
      });
    }

    res.redirect("/dashboard2");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server xatosi");
  }
};

// Home page active products
exports.getActiveProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 16; // har sahifada 15 ta mahsulot
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments({ active: true });
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find({ active: true })
      .skip(skip)
      .limit(limit)
      .lean();

    // So‘nggi 3 kun ichida qo‘shilgan mahsulotlarni belgilash
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const productsWithNewFlag = products.map((p) => ({
      ...p,
      isNewProduct: p.createdAt > threeDaysAgo,
    }));

    res.render("index", {
      title: "Mukammal Marketplace",
      user: req.session.userId ? { username: req.session.username } : null,
      products: productsWithNewFlag,
      currentPage: page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server xatosi");
  }
};
