const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OrderTracking = sequelize.define('OrderTracking', {
  tracking_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  remarks: { type: DataTypes.STRING, allowNull: true },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'order_tracking',
  timestamps: false
});

module.exports = OrderTracking;
