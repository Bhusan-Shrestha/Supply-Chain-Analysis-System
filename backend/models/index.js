const sequelize = require('../config/db');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Inventory = require('./Inventory');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const OrderTracking = require('./OrderTracking');

// Associations
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

User.hasMany(Product, { foreignKey: 'vendor_id' });
Product.belongsTo(User, { foreignKey: 'vendor_id', as: 'vendor' });

Product.hasMany(Inventory, { foreignKey: 'product_id' });
Inventory.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Inventory, { foreignKey: 'owner_id' });
Inventory.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Order, { foreignKey: 'buyer_id', as: 'purchases' });
Order.belongsTo(User, { foreignKey: 'buyer_id', as: 'buyer' });

User.hasMany(Order, { foreignKey: 'seller_id', as: 'sales' });
Order.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });

Order.hasMany(OrderTracking, { foreignKey: 'order_id' });
OrderTracking.belongsTo(Order, { foreignKey: 'order_id' });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  Inventory,
  Order,
  OrderItem,
  OrderTracking
};
