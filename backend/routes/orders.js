const express = require('express');
const router = express.Router();
const { sequelize, Product, Inventory, Order, OrderItem, OrderTracking, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// Supply chain hierarchy: who a given role is allowed to buy from.
const SELLER_ROLE_FOR_BUYER = {
  wholesaler: 'vendor',
  retailer: 'wholesaler',
  consumer: 'retailer'
};

// Fetches (and lazily creates) the stock record a seller holds for a product.
// Vendors' stock lives on Product.stock_qty; Wholesalers/Retailers hold
// stock in the Inventory table (per Table 4.2 ER design).
async function getStockRecord(product_id, owner_id, owner_role, t) {
  if (owner_role === 'vendor') {
    return { kind: 'product', record: await Product.findByPk(product_id, { transaction: t }) };
  }
  let inv = await Inventory.findOne({ where: { product_id, owner_id, owner_role }, transaction: t });
  if (!inv) {
    inv = await Inventory.create({ product_id, owner_id, owner_role, quantity: 0, threshold: 10 }, { transaction: t });
  }
  return { kind: 'inventory', record: inv };
}

function getQty(stockRec) {
  return stockRec.kind === 'product' ? stockRec.record.stock_qty : stockRec.record.quantity;
}
async function setQty(stockRec, qty, t) {
  if (stockRec.kind === 'product') stockRec.record.stock_qty = qty;
  else stockRec.record.quantity = qty;
  await stockRec.record.save({ transaction: t });
}
function getThreshold(stockRec) {
  return stockRec.kind === 'product' ? stockRec.record.low_stock_threshold : stockRec.record.threshold;
}

// POST /api/orders - Wholesaler/Retailer/Consumer places order to tier above (FR-4)
// body: { seller_id, items: [{ product_id, quantity }] }
router.post('/', authenticate, authorize('wholesaler', 'retailer', 'consumer'), async (req, res) => {
  const { seller_id, items } = req.body;
  if (!seller_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'seller_id and a non-empty items array are required' });
  }

  const expectedSellerRole = SELLER_ROLE_FOR_BUYER[req.user.role];
  const seller = await User.findByPk(seller_id);
  if (!seller || seller.role !== expectedSellerRole) {
    return res.status(400).json({ message: `As a ${req.user.role}, you must order from a ${expectedSellerRole}` });
  }

  const t = await sequelize.transaction();
  try {
    let total = 0;
    const orderItemsData = [];
    const lowStockAlerts = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      if (!product) throw new Error(`Product ${item.product_id} not found`);

      const stockRec = await getStockRecord(item.product_id, seller_id, expectedSellerRole, t);
      const available = getQty(stockRec);
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name} (available: ${available})`);
      }

      // Price depends on which tier is buying (tiered pricing)
      const unit_price = req.user.role === 'wholesaler' ? product.vendor_price
        : req.user.role === 'retailer' ? (product.wholesale_price || product.vendor_price)
        : (product.retail_price || product.wholesale_price || product.vendor_price);

      total += unit_price * item.quantity;
      orderItemsData.push({ product_id: item.product_id, quantity: item.quantity, unit_price });

      // Reserve stock immediately on order placement (TC-04)
      const newQty = available - item.quantity;
      await setQty(stockRec, newQty, t);
      if (newQty <= getThreshold(stockRec)) {
        lowStockAlerts.push({ product_id: product.product_id, product_name: product.name, remaining: newQty });
      }
    }

    const order = await Order.create({
      buyer_id: req.user.user_id,
      seller_id,
      status: 'Pending',
      total_amount: total
    }, { transaction: t });

    for (const oi of orderItemsData) {
      await OrderItem.create({ ...oi, order_id: order.order_id }, { transaction: t });
    }

    await OrderTracking.create({
      order_id: order.order_id,
      status: 'Pending',
      remarks: 'Order placed, awaiting seller confirmation'
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ order, low_stock_alerts: lowStockAlerts });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/status - seller updates order status (FR-6)
// Confirming an order atomically increases the buyer's inventory (TC-05)
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status, remarks } = req.body;
  const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.seller_id !== req.user.user_id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the seller can update this order status' });
  }

  const t = await sequelize.transaction();
  try {
    const wasConfirmed = order.status === 'Confirmed' || order.status === 'Shipped' || order.status === 'Delivered';

    // On first confirmation, credit the buyer's inventory (unless buyer is a plain consumer)
    if (status === 'Confirmed' && !wasConfirmed) {
      const buyer = await User.findByPk(order.buyer_id, { transaction: t });
      if (buyer.role !== 'consumer') {
        const items = await OrderItem.findAll({ where: { order_id: order.order_id }, transaction: t });
        for (const item of items) {
          const stockRec = await getStockRecord(item.product_id, buyer.user_id, buyer.role, t);
          await setQty(stockRec, getQty(stockRec) + item.quantity, t);
        }
      }
    }

    // If cancelled before confirmation, restock the seller
    if (status === 'Cancelled' && order.status === 'Pending') {
      const seller = await User.findByPk(order.seller_id, { transaction: t });
      const items = await OrderItem.findAll({ where: { order_id: order.order_id }, transaction: t });
      for (const item of items) {
        const stockRec = await getStockRecord(item.product_id, seller.user_id, seller.role, t);
        await setQty(stockRec, getQty(stockRec) + item.quantity, t);
      }
    }

    order.status = status;
    await order.save({ transaction: t });
    await OrderTracking.create({
      order_id: order.order_id,
      status,
      remarks: remarks || `Status updated to ${status}`
    }, { transaction: t });

    await t.commit();
    res.json(order);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Failed to update order status', error: err.message });
  }
});

// GET /api/orders/mine - orders where I'm the buyer
router.get('/mine', authenticate, async (req, res) => {
  const orders = await Order.findAll({
    where: { buyer_id: req.user.user_id },
    include: [OrderItem, { model: User, as: 'seller', attributes: ['user_id', 'name'] }],
    order: [['order_date', 'DESC']]
  });
  res.json(orders);
});

// GET /api/orders/incoming - orders where I'm the seller
router.get('/incoming', authenticate, async (req, res) => {
  const orders = await Order.findAll({
    where: { seller_id: req.user.user_id },
    include: [OrderItem, { model: User, as: 'buyer', attributes: ['user_id', 'name'] }],
    order: [['order_date', 'DESC']]
  });
  res.json(orders);
});

// GET /api/orders/:id/tracking - full order lifecycle history
router.get('/:id/tracking', authenticate, async (req, res) => {
  const history = await OrderTracking.findAll({
    where: { order_id: req.params.id },
    order: [['updated_at', 'ASC']]
  });
  res.json(history);
});

module.exports = router;
