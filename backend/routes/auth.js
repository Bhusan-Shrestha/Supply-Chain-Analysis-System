const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User } = require('../models');
const { authenticate, authorize, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register  (FR-1)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password, and role are required' });
    }
    if (!['vendor', 'wholesaler', 'retailer', 'consumer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    // Consumers are auto-approved; supply-chain tiers need Admin approval (FR-2)
    const status = role === 'consumer' ? 'approved' : 'pending';

    const user = await User.create({ name, email, password_hash, role, status });
    res.status(201).json({
      message: status === 'pending'
        ? 'Registered successfully. Your account is pending Admin approval.'
        : 'Registered successfully. You can now log in.',
      user_id: user.user_id,
      status
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// POST /api/auth/login  (FR-1)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    if (user.status !== 'approved') {
      return res.status(403).json({ message: `Account is ${user.status}. Please wait for Admin approval.` });
    }

    const token = jwt.sign(
      { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// GET /api/auth/pending-users - Admin only (FR-2)
router.get('/pending-users', authenticate, authorize('admin'), async (req, res) => {
  const users = await User.findAll({
    where: { status: 'pending' },
    attributes: ['user_id', 'name', 'email', 'role', 'status', 'created_at']
  });
  res.json(users);
});

// PATCH /api/auth/users/:id/status - Admin approves/rejects (FR-2)
router.patch('/users/:id/status', authenticate, authorize('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'status must be approved or rejected' });
  }
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.status = status;
  await user.save();
  res.json({ message: `User ${status}`, user_id: user.user_id, status: user.status });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

module.exports = router;
