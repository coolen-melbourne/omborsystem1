const Order = require('../models/Order');
const Product = require('../models/Product');
const Movement = require('../models/Movement');
const Inventory = require('../models/Inventory');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Checkout
exports.checkout = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const cart = req.session.cart || [];

        if (!firstName || !lastName || !phone) {
            return res.status(400).json({ error: 'Barcha maydonlarni to‘ldiring' });
        }
        if (cart.length === 0) {
            return res.status(400).json({ error: 'Savat bo‘sh' });
        }

        const productIds = cart.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } })
            .select('_id name price stock image itemsPerQop')
            .lean();
        const productMap = {};
        products.forEach(p => productMap[p._id.toString()] = p);

        const orderItems = [];
        const updatePromises = [];

        for (let item of cart) {
            const product = productMap[item.productId];
            if (!product) {
                return res.status(400).json({ error: `Mahsulot topilmadi: ${item.productId}` });
            }

            const itemsPerQop = item.itemsPerQop || product.itemsPerQop || 1;
            orderItems.push({
                productId: item.productId,
                name: product.name,
                price: item.price,
                quantity: item.quantity,
                image: product.image,
                variant: item.variant || '',
                itemsPerQop
            });

            updatePromises.push(
                Product.updateOne(
                    { _id: item.productId },
                    { $inc: { stock: -item.quantity } }
                )
            );
        }

        await Promise.all(updatePromises);

        const totalItems = cart.reduce((sum, i) => sum + i.quantity * (i.itemsPerQop || 1), 0);
        const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity * (i.itemsPerQop || 1), 0);

        const order = await Order.create({
            firstName,
            lastName,
            phone,
            items: orderItems,
            totalItems,
            totalPrice,
            status: 'Yangi'
        });

        const movementPromises = cart.map(item =>
            Movement.create({
                type: 'expense',
                productId: item.productId,
                variant: item.variant || 'N/A',
                quantity: item.quantity,
                fromLocation: 'Noma’lum',
                toLocation: '',
                date: new Date()
            })
        );
        await Promise.all(movementPromises);

        req.session.cart = [];

        res.json({ success: true, orderId: order._id });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ error: 'Server xatosi' });
    }
};

// Get order details (AJAX)
exports.getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).lean();
        if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server xatosi' });
    }
};

// Acknowledge order (with salesperson name)
exports.acknowledgeOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Ism kiritilmadi' });
        }

        await Order.findByIdAndUpdate(orderId, { status: 'Ko‘rildi', acceptedBy: name });
        req.session.salespersonName = name;

        if (req.accepts('json')) {
            return res.json({ success: true });
        } else {
            res.redirect('/dashboard3');
        }
    } catch (err) {
        console.error(err);
        if (req.accepts('json')) {
            res.status(500).json({ error: 'Server xatosi' });
        } else {
            res.status(500).send('Server xatosi');
        }
    }
};

// Export all orders to Excel (CSV)
exports.exportOrdersToExcel = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).lean();
        let csv = 'ID,Sana,Ism,Familiya,Telefon,Mahsulotlar,Dona,Summa,Holat,Qabul qildi\n';
        orders.forEach(order => {
            const products = order.items.map(i => `${i.name} (${i.variant || ''})`).join('; ');
            csv += `${order._id},${new Date(order.createdAt).toLocaleString('uz-UZ')},${order.firstName},${order.lastName},${order.phone},"${products}",${order.totalItems},${order.totalPrice},${order.status},${order.acceptedBy || ''}\n`;
        });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=buyurtmalar.csv');
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server xatosi');
    }
};

// Export summary by person (Excel)
exports.exportSummaryByPerson = async (req, res) => {
    try {
        const { person } = req.query;
        let filter = { status: 'Ko‘rildi' };
        if (person) filter.acceptedBy = person;

        const orders = await Order.find(filter).lean();
        const summary = {};
        orders.forEach(order => {
            const name = order.acceptedBy || 'Noma’lum';
            if (!summary[name]) {
                summary[name] = { totalQops: 0, totalAmount: 0 };
            }
            summary[name].totalQops += order.totalItems;
            summary[name].totalAmount += order.totalPrice;
        });

        let csv = 'Sotuvchi,Jami dona,Umumiy summa\n';
        Object.entries(summary).forEach(([person, data]) => {
            csv += `${person},${data.totalQops},${data.totalAmount}\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=sotuvchi_hisobot.csv');
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server xatosi');
    }
};

// Export monthly summary by person (Excel)
exports.exportMonthlySummary = async (req, res) => {
    try {
        const orders = await Order.find({ status: 'Ko‘rildi' }).lean();
        const summary = {};
        orders.forEach(order => {
            if (!order.acceptedBy) return;
            const date = new Date(order.createdAt);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const key = `${order.acceptedBy}|${year}-${month.toString().padStart(2, '0')}`;
            if (!summary[key]) {
                summary[key] = {
                    salesperson: order.acceptedBy,
                    year,
                    month,
                    totalOrders: 0,
                    totalQops: 0,
                    totalAmount: 0
                };
            }
            summary[key].totalOrders += 1;
            summary[key].totalQops += order.totalItems;
            summary[key].totalAmount += order.totalPrice;
        });

        const data = Object.values(summary).sort((a, b) => a.salesperson.localeCompare(b.salesperson) || a.year - b.year || a.month - b.month);

        if (req.query.format === 'json') {
            return res.json(data);
        }

        let csv = 'Sotuvchi,Yil,Oy,Buyurtmalar soni,Jami dona,Umumiy summa\n';
        data.forEach(row => {
            csv += `${row.salesperson},${row.year},${row.month},${row.totalOrders},${row.totalQops},${row.totalAmount}\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=oylik_sotuvchilar.csv');
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server xatosi');
    }
};

// Salesperson dashboard
exports.getSalespersonDashboard = async (req, res) => {
    try {
        const salespersonName = req.session.salespersonName;
        if (!salespersonName) {
            return res.redirect('/dashboard3');
        }

        const orders = await Order.find({ acceptedBy: salespersonName }).sort({ createdAt: -1 }).lean();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const totalQopsToday = orders
            .filter(o => new Date(o.createdAt) >= today && new Date(o.createdAt) < tomorrow)
            .reduce((sum, o) => sum + o.totalItems, 0);

        const totalQopsMonth = orders
            .filter(o => new Date(o.createdAt) >= startOfMonth)
            .reduce((sum, o) => sum + o.totalItems, 0);

        const totalQopsOverall = orders.reduce((sum, o) => sum + o.totalItems, 0);

        const grouped = {};
        orders.forEach(order => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('uz-UZ');
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push(order);
        });

        res.render('salesperson', {
            title: `Sotuvchi: ${salespersonName}`,
            salespersonName,
            totalQopsToday,
            totalQopsMonth,
            totalQopsOverall,
            grouped
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server xatosi');
    }
};

// Generate PDF for an order
exports.generateOrderPDF = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).lean();
        if (!order) return res.status(404).send('Buyurtma topilmadi');

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=order-${orderId}.pdf`);
        doc.pipe(res);

        const primaryColor = '#2563eb';
        const secondaryColor = '#4b5563';
        const lightGray = '#f3f4f6';

        doc.rect(0, 0, doc.page.width, 120).fill(lightGray);
        doc.fillColor(primaryColor).fontSize(24).font('Helvetica-Bold').text('MILANA PREMIUM', 50, 40);
        doc.fillColor(secondaryColor).fontSize(12).font('Helvetica').text('Buyurtma cheki', 50, 70);
        doc.fontSize(10).text(`Chop etilgan sana: ${new Date().toLocaleString('uz-UZ')}`, 50, 90);
        doc.fillColor(primaryColor).fontSize(14).text(`Buyurtma ID: ${order._id}`, 50, 130);
        doc.moveDown();

        doc.rect(50, 150, doc.page.width - 100, 80).fill(lightGray).stroke();
        doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('Mijoz maʼlumotlari', 60, 160);
        doc.font('Helvetica').fontSize(10);
        doc.text(`Ism: ${order.firstName} ${order.lastName}`, 60, 180);
        doc.text(`Telefon: ${order.phone}`, 60, 195);
        doc.text(`Sotuvchi: ${order.acceptedBy || 'Nomaʼlum'}`, 60, 210);

        let y = 250;
        doc.rect(50, y - 5, doc.page.width - 100, 20).fill(primaryColor);
        doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold');
        doc.text('Rasm', 60, y);
        doc.text('Mahsulot', 120, y);
        doc.text('Variant', 220, y);
        doc.text('Qop', 290, y);
        doc.text('Dona/qop', 340, y);
        doc.text('Jami dona', 390, y);
        doc.text('Narxi/dona', 440, y);
        doc.text('Summa', 500, y);

        doc.fillColor('#000').font('Helvetica').fontSize(9);
        y += 20;
        order.items.forEach((item, i) => {
            const lineY = y + i * 18;
            const imageName = item.image ? item.image.split('/').pop() : 'default.jpg';
            doc.text(imageName.substring(0, 15) + (imageName.length > 15 ? '…' : ''), 60, lineY);
            doc.text(item.name.substring(0, 15) + (item.name.length > 15 ? '…' : ''), 120, lineY);
            doc.text(item.variant || '—', 220, lineY);
            doc.text(item.quantity.toString(), 290, lineY);
            doc.text(item.itemsPerQop.toString(), 340, lineY);
            doc.text((item.quantity * item.itemsPerQop).toString(), 390, lineY);
            doc.text(`$${item.price}`, 440, lineY);
            doc.text(`$${item.price * item.quantity * item.itemsPerQop}`, 500, lineY);
        });

        const lastY = y + order.items.length * 18 + 10;
        doc.moveTo(50, lastY - 5).lineTo(550, lastY - 5).stroke(lightGray);
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text(`Jami dona: ${order.totalItems}`, 400, lastY);
        doc.text(`Jami summa: $${order.totalPrice}`, 400, lastY + 15);

        doc.fontSize(8).fillColor(secondaryColor).text('© MILANA PREMIUM | Rahmat!', 50, doc.page.height - 50, { align: 'center', width: doc.page.width - 100 });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('PDF yaratishda xatolik');
    }
};