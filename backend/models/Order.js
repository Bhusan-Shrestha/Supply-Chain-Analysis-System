const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  order_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  buyer_id: { type: DataTypes.INTEGER, allowNull: false },
  seller_id: { type: DataTypes.INTEGER, allowNull: false },
  order_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: {
    type: DataTypes.ENUM('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'),
    defaultValue: 'Pending'
  },
  total_amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }
}, {
  tableName: 'orders',
  timestamps: false
});

module.exports = Order;
