// Resets the database and populates demo data so the app can be
// evaluated / screenshotted immediately without manual setup.
const bcrypt = require('bcryptjs');
const { sequelize, User, Category, Product, Inventory, Order, OrderItem, OrderTracking } = require('./models');

async function seed() {
  await sequelize.sync({ force: true });

  const pw = await bcrypt.hash('password123', 10);

  const admin = await User.create({ name: 'Admin User', email: 'admin@scms.com', password_hash: pw, role: 'admin', status: 'approved' });
  const vendor = await User.create({ name: 'Himalayan Foods Pvt Ltd', email: 'vendor@scms.com', password_hash: pw, role: 'vendor', status: 'approved' });
  const wholesaler = await User.create({ name: 'Kathmandu Wholesale Hub', email: 'wholesaler@scms.com', password_hash: pw, role: 'wholesaler', status: 'approved' });
  const retailer = await User.create({ name: 'Valley Retail Mart', email: 'retailer@scms.com', password_hash: pw, role: 'retailer', status: 'approved' });
  const consumer = await User.create({ name: 'Sita Sharma', email: 'consumer@scms.com', password_hash: pw, role: 'consumer', status: 'approved' });

  const grocery = await Category.create({ name: 'Grocery' });
  const beverages = await Category.create({ name: 'Beverages' });

  const rice = await Product.create({
    vendor_id: vendor.user_id, category_id: grocery.category_id,
    name: 'Basmati Rice (25kg)', batch_no: 'RICE-2026-001',
    description: 'Premium basmati rice, sourced from Terai region.',
    vendor_price: 2500, wholesale_price: 2750, retail_price: 3100,
    stock_qty: 200, low_stock_threshold: 20
  });
  const tea = await Product.create({
    vendor_id: vendor.user_id, category_id: beverages.category_id,
    name: 'Ilam Black Tea (1kg)', batch_no: 'TEA-2026-014',
    description: 'Organic black tea leaves from Ilam.',
    vendor_price: 450, wholesale_price: 520, retail_price: 650,
    stock_qty: 150, low_stock_threshold: 15
  });

  await Inventory.create({ product_id: rice.product_id, owner_id: vendor.user_id, owner_role: 'vendor', quantity: rice.stock_qty, threshold: 20 });
  await Inventory.create({ product_id: tea.product_id, owner_id: vendor.user_id, owner_role: 'vendor', quantity: tea.stock_qty, threshold: 15 });

  // A sample confirmed order: wholesaler bought rice from vendor
  const order = await Order.create({
    buyer_id: wholesaler.user_id, seller_id: vendor.user_id,
    status: 'Confirmed', total_amount: 2750 * 20
  });
  await OrderItem.create({ order_id: order.order_id, product_id: rice.product_id, quantity: 20, unit_price: 2750 });
  await OrderTracking.bulkCreate([
    { order_id: order.order_id, status: 'Pending', remarks: 'Order placed' },
    { order_id: order.order_id, status: 'Confirmed', remarks: 'Confirmed by vendor' }
  ]);
  await Inventory.create({ product_id: rice.product_id, owner_id: wholesaler.user_id, owner_role: 'wholesaler', quantity: 20, threshold: 10 });
  rice.stock_qty -= 20;
  await rice.save();

  // Wholesaler -> Retailer: confirmed order, so retailer has sellable stock for the consumer
  const order2 = await Order.create({
    buyer_id: retailer.user_id, seller_id: wholesaler.user_id,
    status: 'Confirmed', total_amount: 3100 * 10
  });
  await OrderItem.create({ order_id: order2.order_id, product_id: rice.product_id, quantity: 10, unit_price: 3100 });
  await OrderTracking.bulkCreate([
    { order_id: order2.order_id, status: 'Pending', remarks: 'Order placed' },
    { order_id: order2.order_id, status: 'Confirmed', remarks: 'Confirmed by wholesaler' }
  ]);
  await Inventory.create({ product_id: rice.product_id, owner_id: retailer.user_id, owner_role: 'retailer', quantity: 10, threshold: 5 });
  const wholesalerInv = await Inventory.findOne({ where: { product_id: rice.product_id, owner_id: wholesaler.user_id, owner_role: 'wholesaler' } });
  wholesalerInv.quantity -= 10;
  await wholesalerInv.save();

  // Retailer -> Consumer: an in-progress order (Shipped) to showcase the tracking manifest
  const order3 = await Order.create({
    buyer_id: consumer.user_id, seller_id: retailer.user_id,
    status: 'Shipped', total_amount: 3100 * 2
  });
  await OrderItem.create({ order_id: order3.order_id, product_id: rice.product_id, quantity: 2, unit_price: 3100 });
  await OrderTracking.bulkCreate([
    { order_id: order3.order_id, status: 'Pending', remarks: 'Order placed' },
    { order_id: order3.order_id, status: 'Confirmed', remarks: 'Confirmed by retailer' },
    { order_id: order3.order_id, status: 'Shipped', remarks: 'Out for delivery' }
  ]);
  const retailerInv = await Inventory.findOne({ where: { product_id: rice.product_id, owner_id: retailer.user_id, owner_role: 'retailer' } });
  retailerInv.quantity -= 2;
  await retailerInv.save();

  console.log('Seed complete. Demo accounts (password: password123):');
  console.log('  Admin:      admin@scms.com');
  console.log('  Vendor:     vendor@scms.com');
  console.log('  Wholesaler: wholesaler@scms.com');
  console.log('  Retailer:   retailer@scms.com');
  console.log('  Consumer:   consumer@scms.com');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
