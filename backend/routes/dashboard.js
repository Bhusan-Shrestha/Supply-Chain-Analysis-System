const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, User, sequelize } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/dashboard/summary - role-specific summary for reports (FR-9)
router.get('/summary', authenticate, async (req, res) => {
  const { user_id, role } = req.user;

  if (role === 'admin') {
    const [totalUsers, pendingUsers, totalProducts, totalOrders] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'pending' } }),
      Product.count(),
      Order.count()
    ]);
    return res.json({ totalUsers, pendingUsers, totalProducts, totalOrders });
  }

  // Vendor/Wholesaler/Retailer: sales as seller
  const salesOrders = await Order.findAll({ where: { seller_id: user_id } });
  const totalSales = salesOrders.reduce((s, o) => s + o.total_amount, 0);
  const statusCounts = {};
  salesOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  let productCount = null;
  if (role === 'vendor') {
    productCount = await Product.count({ where: { vendor_id: user_id } });
  }

  // Purchases as buyer (wholesaler/retailer/consumer)
  const purchaseOrders = await Order.findAll({ where: { buyer_id: user_id } });
  const totalSpent = purchaseOrders.reduce((s, o) => s + o.total_amount, 0);

  res.json({
    role,
    totalSalesOrders: salesOrders.length,
    totalSalesRevenue: totalSales,
    salesByStatus: statusCounts,
    productCount,
    totalPurchaseOrders: purchaseOrders.length,
    totalSpent
  });
});

module.exports = router;
