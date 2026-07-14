import express from 'express';
import { getDb } from '../db/db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/visits (Get list of site visits)
router.get('/', authenticateToken, async (req, res) => {
  const db = await getDb();
  const userId = req.user.id;
  const role = req.user.role;

  let visits = db.get('visits');

  if (role === 'buyer' || role === 'tenant') {
    visits = visits.filter(v => v.userId === userId);
  } else if (role === 'owner') {
    // Show visits on properties owned by this owner
    const myProperties = db.filter('properties', p => p.ownerId === userId).map(p => p.id);
    visits = visits.filter(v => myProperties.includes(v.propertyId));
  } else if (role === 'agent') {
    // Show visits on properties handled by this agent
    const myProperties = db.filter('properties', p => p.agentId === userId).map(p => p.id);
    visits = visits.filter(v => myProperties.includes(v.propertyId));
  }
  // Admins see all visits

  // Populate property & user details
  const populated = visits.map(v => {
    const prop = db.find('properties', p => p.id === v.propertyId);
    const user = db.find('users', u => u.id === v.userId);
    return {
      ...v,
      property: prop ? { title: prop.title, location: prop.location, image: prop.image } : null,
      client: user ? { name: user.name, email: user.email, phone: user.phone } : null
    };
  });

  return res.status(200).json(populated);
});

// POST /api/visits (Schedule a site visit)
router.post('/', authenticateToken, async (req, res) => {
  const { propertyId, date, time, visitType } = req.body; // visitType: virtual or physical
  if (!propertyId || !date || !time) {
    return res.status(400).json({ message: 'Property, date, and time are required' });
  }

  const db = await getDb();
  const prop = db.find('properties', p => p.id === Number(propertyId));
  if (!prop) return res.status(404).json({ message: 'Property not found' });

  const visit = await db.insert('visits', {
    userId: req.user.id,
    propertyId: Number(propertyId),
    date,
    time,
    visitType: visitType || 'physical',
    status: 'pending' // pending, confirmed, declined, completed
  });

  return res.status(201).json(visit);
});

// PUT /api/visits/:id (Confirm / Decline / Complete a visit)
router.put('/:id', authenticateToken, async (req, res) => {
  const db = await getDb();
  const id = Number(req.params.id);
  const visit = db.find('visits', v => v.id === id);

  if (!visit) return res.status(404).json({ message: 'Visit not found' });

  const prop = db.find('properties', p => p.id === visit.propertyId);
  const isAuthorized = 
    req.user.role === 'admin' ||
    (prop && (prop.ownerId === req.user.id || prop.agentId === req.user.id));

  if (!isAuthorized) {
    return res.status(403).json({ message: 'Unauthorized to update this site visit status' });
  }

  const { status } = req.body; // confirmed, declined, completed, pending
  if (!['confirmed', 'declined', 'completed', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const updatedVisit = await db.update('visits', id, { status });
  return res.status(200).json(updatedVisit);
});

export default router;
