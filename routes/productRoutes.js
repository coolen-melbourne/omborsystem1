const express = require('express');
const { getActiveProducts } = require('../controllers/productController');
const router = express.Router();

router.get('/', getActiveProducts); // homepage

module.exports = router;