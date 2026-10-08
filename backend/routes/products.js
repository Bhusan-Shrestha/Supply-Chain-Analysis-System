const express = require('express');
const router = express.Router();
const { Product, Category, Inventory, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/products - public catalog (browse/search) (Consumer Portal)
router.get('/', async (req, res) => {
  const { search, category_id } = req.query;
  const where = {};
  if (category_id) where.category_id = category_id;
  const { Op } = require('sequelize');
  if (search) where.name = { [Op.like]: `%${search}%` };

  const products = await Product.findAll({
    where,
    include: [
      { model: Category },
      { model: User, as: 'vendor', attributes: ['user_id', 'name'] }
    ],
    order: [['created_at', 'DESC']]
  });
  res.json(products);
});

// GET /api/products/:id/traceability - consumer trace to origin vendor/batch (FR-8)
router.get('/:id/traceability', async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    include: [
      { model: User, as: 'vendor', attributes: ['user_id', 'name', 'email'] },
      { model: Category }
    ]
  });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({
    product_id: product.product_id,
    name: product.name,
    batch_no: product.batch_no,
    category: product.Category ? product.Category.name : null,
    originating_vendor: product.vendor ? product.vendor.name : null,
    current_available_stock: product.stock_qty
  });
});

// POST /api/products - Vendor adds product (FR-3)
router.post('/', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const { name, batch_no, description, category_id, vendor_price, wholesale_price, retail_price, stock_qty, low_stock_threshold } = req.body;
    if (!name || !batch_no || vendor_price == null) {
      return res.status(400).json({ message: 'name, batch_no, and vendor_price are required' });
    }
    const product = await Product.create({
      vendor_id: req.user.user_id,
      name, batch_no, description, category_id,
      vendor_price, wholesale_price, retail_price,
      stock_qty: stock_qty || 0,
      low_stock_threshold: low_stock_threshold || 10
    });

    // Seed the vendor's own inventory row for this product
    await Inventory.create({
      product_id: product.product_id,
      owner_id: req.user.user_id,
      owner_role: 'vendor',
      quantity: stock_qty || 0,
      threshold: low_stock_threshold || 10
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
});

// PUT /api/products/:id - Vendor updates own product (FR-3)
router.put('/:id', authenticate, authorize('vendor'), async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.vendor_id !== req.user.user_id) {
    return res.status(403).json({ message: 'You can only edit your own products' });
  }
  const fields = ['name', 'batch_no', 'description', 'category_id', 'vendor_price', 'wholesale_price', 'retail_price', 'low_stock_threshold'];
  fields.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
  await product.save();
  res.json(product);
});

// DELETE /api/products/:id - Vendor removes own product (FR-3)
router.delete('/:id', authenticate, authorize('vendor'), async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.vendor_id !== req.user.user_id) {
    return res.status(403).json({ message: 'You can only delete your own products' });
  }
  await product.destroy();
  res.json({ message: 'Product deleted' });
});

// --- Categories ---

// GET /api/products/categories/all
router.get('/categories/all', async (req, res) => {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  res.json(categories);
});

// POST /api/products/categories - Admin manages master categories
router.post('/categories', authenticate, authorize('admin'), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  const category = await Category.create({ name });
  res.status(201).json(category);
});

module.exports = router;
