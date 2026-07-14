import express from 'express';
import { getDb } from '../db/db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/designers (List designers and portfolios)
router.get('/', async (req, res) => {
  const db = await getDb();
  const list = db.get('designers');
  return res.status(200).json(list);
});

// GET /api/designers/:id (Single designer profile)
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const id = Number(req.params.id);
  const designer = db.find('designers', d => d.id === id || d.userId === id);
  if (!designer) return res.status(404).json({ message: 'Designer profile not found' });
  return res.status(200).json(designer);
});

// POST /api/designers/book (Book designer consultation)
router.post('/book', authenticateToken, async (req, res) => {
  const { designerId, styleSelected, date, time, notes } = req.body;
  if (!designerId || !date || !time) {
    return res.status(400).json({ message: 'Designer, date, and time are required' });
  }

  const db = await getDb();
  const designer = db.find('designers', d => d.id === Number(designerId));
  if (!designer) return res.status(404).json({ message: 'Designer not found' });

  const booking = await db.insert('bookings', {
    userId: req.user.id,
    designerId: Number(designerId),
    styleSelected: styleSelected || 'General Consultation',
    date,
    time,
    notes: notes || '',
    status: 'pending' // pending, confirmed, completed
  });

  return res.status(201).json(booking);
});

// GET /api/designers/bookings (View booked consultations)
router.get('/bookings', authenticateToken, async (req, res) => {
  const db = await getDb();
  const userId = req.user.id;
  const role = req.user.role;

  let bookings = [];

  if (role === 'designer') {
    // Find designer profile corresponding to this user
    const designer = db.find('designers', d => d.userId === userId);
    if (designer) {
      bookings = db.filter('bookings', b => b.designerId === designer.id);
    }
  } else {
    // Buyer/Tenant/Owner booking a designer
    bookings = db.filter('bookings', b => b.userId === userId);
  }

  // Populate client details and designer details
  const populated = bookings.map(b => {
    const client = db.find('users', u => u.id === b.userId);
    const designer = db.find('designers', d => d.id === b.designerId);
    return {
      ...b,
      client: client ? { name: client.name, email: client.email, phone: client.phone } : null,
      designer: designer ? { name: designer.name, avatar: designer.avatar, rate: designer.rate } : null
    };
  });

  return res.status(200).json(populated);
});

// PUT /api/designers/bookings/:id (Update booking status)
router.put('/bookings/:id', authenticateToken, async (req, res) => {
  const db = await getDb();
  const id = Number(req.params.id);
  const booking = db.find('bookings', b => b.id === id);

  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  // Verification: only designer or admin can confirm/complete
  const designer = db.find('designers', d => d.id === booking.designerId);
  const isAuthorized = req.user.role === 'admin' || (designer && designer.userId === req.user.id);

  if (!isAuthorized) {
    return res.status(403).json({ message: 'Unauthorized to update booking' });
  }

  const { status } = req.body;
  if (!['pending', 'confirmed', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const updatedBooking = await db.update('bookings', id, { status });
  return res.status(200).json(updatedBooking);
});

export default router;
