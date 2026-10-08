const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Tracks how much of a given product each tier (owner) currently holds.
// A row is created per (product, owner) pair as stock moves down the chain:
// Vendor -> Wholesaler -> Retailer.
const Inventory = sequelize.define('Inventory', {
  inventory_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  owner_id: { type: DataTypes.INTEGER, allowNull: false }, // user_id of vendor/wholesaler/retailer
  owner_role: {
    type: DataTypes.ENUM('vendor', 'wholesaler', 'retailer'),
    allowNull: false
  },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  threshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 }
}, {
  tableName: 'inventory',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

module.exports = Inventory;
