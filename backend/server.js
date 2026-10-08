const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'SCMS API is running' }));

const PORT = process.env.PORT || 5000;

// { force: false } keeps existing data; use `npm run seed` to reset + seed demo data
sequelize.sync({ alter: false }).then(() => {
  app.listen(PORT, () => console.log(`SCMS backend listening on http://localhost:${PORT}`));
}).catch(err => console.error('Failed to sync database:', err));
