import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/db.js';

const router = express.Router();
const JWT_SECRET = 'rk_realtor_super_secret_key_13579';

// Middleware to authenticate JWT
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await getDb();
    const user = db.find('users', u => u.id === decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, role, phone } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  const db = await getDb();
  const existingUser = db.find('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.insert('users', {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role, // buyer, tenant, owner, designer, agent, admin
      phone: phone || '',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`, // default avatar
      verified: role === 'buyer' || role === 'tenant' // Buyers and tenants are auto-verified, others need KYC/Admin approval
    });

    // If role is designer, auto-insert a blank designer profile in table 'designers'
    if (role === 'designer') {
      await db.insert('designers', {
        userId: newUser.id,
        name: newUser.name,
        avatar: newUser.avatar,
        bio: 'New Interior Designer',
        rating: 5.0,
        experience: '0 Years',
        rate: 50,
        styles: ['Modern'],
        portfolio: []
      });
    }

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const db = await getDb();
  const user = db.find('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  try {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.verified) {
      return res.status(403).json({ message: 'Your account is pending verification by administration.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  return res.status(200).json(userWithoutPassword);
});

export default router;
