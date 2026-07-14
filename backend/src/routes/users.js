import express from 'express';
import { getDb } from '../db/db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Middleware to verify admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// GET /api/users/verifications (Admin view of pending verifications)
router.get('/verifications', authenticateToken, requireAdmin, async (req, res) => {
  const db = await getDb();

  // Find all unverified users
  const unverifiedUsers = db.filter('users', u => !u.verified);

  // Find all pending properties
  const pendingProperties = db.filter('properties', p => p.status === 'pending' || !p.verified).map(p => {
    const owner = db.find('users', u => u.id === p.ownerId);
    return {
      ...p,
      owner: owner ? { name: owner.name, email: owner.email } : null
    };
  });

  return res.status(200).json({
    users: unverifiedUsers.map(u => {
      const { password: _, ...clean } = u;
      return clean;
    }),
    properties: pendingProperties
  });
});

// POST /api/users/:id/verify (Verify a user)
router.post('/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  const db = await getDb();
  const id = Number(req.params.id);

  const user = db.find('users', u => u.id === id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const updatedUser = await db.update('users', id, { verified: true });
  const { password: _, ...clean } = updatedUser;
  return res.status(200).json({ message: 'User verified successfully', user: clean });
});

// POST /api/users/properties/:id/verify (Verify a property)
router.post('/properties/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  const db = await getDb();
  const id = Number(req.params.id);

  const property = db.find('properties', p => p.id === id);
  if (!property) return res.status(404).json({ message: 'Property not found' });

  const updatedProperty = await db.update('properties', id, { verified: true, status: 'available' });
  return res.status(200).json({ message: 'Property verified successfully', property: updatedProperty });
});

// GET /api/users/stats (Global platform stats for Admin Dashboard)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  const db = await getDb();

  const totalUsers = db.get('users').length;
  const totalProperties = db.get('properties').length;
  const totalBookings = db.get('bookings').length;
  const totalVisits = db.get('visits').length;
  const totalDocuments = db.get('documents').length;

  const usersByRole = db.get('users').reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const propertiesByType = db.get('properties').reduce((acc, prop) => {
    acc[prop.type] = (acc[prop.type] || 0) + 1;
    return acc;
  }, {});

  return res.status(200).json({
    counts: {
      users: totalUsers,
      properties: totalProperties,
      bookings: totalBookings,
      visits: totalVisits,
      documents: totalDocuments
    },
    roles: usersByRole,
    types: propertiesByType
  });
});

export default router;
