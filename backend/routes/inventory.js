const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Inventory, Product, sequelize } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/inventory/mine - Wholesaler/Retailer's own warehouse/shop stock
router.get('/mine', authenticate, authorize('wholesaler', 'retailer'), async (req, res) => {
  const rows = await Inventory.findAll({
    where: { owner_id: req.user.user_id, owner_role: req.user.role },
    include: [Product]
  });
  res.json(rows);
});

// GET /api/inventory/low-stock - stock alerts for the logged-in tier (FR-7)
router.get('/low-stock', authenticate, authorize('vendor', 'wholesaler', 'retailer'), async (req, res) => {
  if (req.user.role === 'vendor') {
    const products = await Product.findAll({
      where: {
        vendor_id: req.user.user_id,
        stock_qty: { [Op.lte]: sequelize.col('low_stock_threshold') }
      }
    });
    return res.json(products.map(p => ({
      product_id: p.product_id, name: p.name, quantity: p.stock_qty, threshold: p.low_stock_threshold
    })));
  }
  const rows = await Inventory.findAll({
    where: {
      owner_id: req.user.user_id,
      owner_role: req.user.role,
      quantity: { [Op.lte]: sequelize.col('threshold') }
    },
    include: [Product]
  });
  res.json(rows.map(r => ({
    product_id: r.product_id,
    name: r.Product ? r.Product.name : null,
    quantity: r.quantity,
    threshold: r.threshold
  })));
});

// GET /api/inventory/sellable/:role - public listing of what a given tier
// (wholesaler/retailer) currently holds and can resell to the tier below.
// Used by the buyer's "order from X" catalog view.
router.get('/sellable/:role', async (req, res) => {
  const { role } = req.params;
  if (!['wholesaler', 'retailer'].includes(role)) {
    return res.status(400).json({ message: 'role must be wholesaler or retailer' });
  }
  const { User } = require('../models');
  const rows = await Inventory.findAll({
    where: { owner_role: role, quantity: { [Op.gt]: 0 } },
    include: [
      { model: Product },
      { model: User, as: 'owner', attributes: ['user_id', 'name'] }
    ]
  });
  res.json(rows.map(r => ({
    product_id: r.Product.product_id,
    name: r.Product.name,
    batch_no: r.Product.batch_no,
    category_id: r.Product.category_id,
    stock_qty: r.quantity,
    wholesale_price: r.Product.wholesale_price,
    retail_price: r.Product.retail_price,
    vendor_id: r.owner_id, // the seller for ordering purposes (this tier's user_id)
    vendor: { user_id: r.owner_id, name: r.owner.name }
  })));
});

module.exports = router;
