import express from 'express';
import { getDb } from '../db/db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/properties (Filtered listing)
router.get('/', async (req, res) => {
  const { type, propertyType, minPrice, maxPrice, beds, baths, location, query } = req.query;
  const db = await getDb();
  let list = db.get('properties');

  // Filter out unverified properties for public view, unless request includes a custom flag (e.g. from admins/owners)
  // Let's filter out pending ones for public
  list = list.filter(p => p.verified === true);

  if (type) {
    list = list.filter(p => p.type === type);
  }
  if (propertyType) {
    list = list.filter(p => p.propertyType === propertyType);
  }
  if (minPrice) {
    list = list.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    list = list.filter(p => p.price <= Number(maxPrice));
  }
  if (beds) {
    list = list.filter(p => p.beds >= Number(beds));
  }
  if (baths) {
    list = list.filter(p => p.baths >= Number(baths));
  }
  if (location) {
    list = list.filter(p => p.location.toLowerCase().includes(location.toLowerCase()));
  }
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) || 
      p.location.toLowerCase().includes(q)
    );
  }

  return res.status(200).json(list);
});

// GET /api/properties/my (Properties listed by the logged-in owner/agent)
router.get('/my', authenticateToken, async (req, res) => {
  const db = await getDb();
  const userId = req.user.id;
  const role = req.user.role;

  let properties = [];
  if (role === 'owner') {
    properties = db.filter('properties', p => p.ownerId === userId);
  } else if (role === 'agent') {
    properties = db.filter('properties', p => p.agentId === userId);
  } else if (role === 'admin') {
    properties = db.get('properties');
  } else {
    return res.status(403).json({ message: 'Unauthorized role' });
  }

  return res.status(200).json(properties);
});

// GET /api/properties/favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  const db = await getDb();
  const userId = req.user.id;
  const userFavorites = db.filter('favorites', f => f.userId === userId);
  const propertyIds = userFavorites.map(f => f.propertyId);
  const properties = db.get('properties').filter(p => propertyIds.includes(p.id));
  return res.status(200).json(properties);
});

// GET /api/properties/:id (Single property details)
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const property = db.find('properties', p => p.id === Number(req.params.id));
  if (!property) return res.status(404).json({ message: 'Property not found' });

  // Get owner and agent details
  const owner = db.find('users', u => u.id === property.ownerId);
  const agent = db.find('users', u => u.id === property.agentId);

  const detail = {
    ...property,
    owner: owner ? { name: owner.name, email: owner.email, phone: owner.phone, avatar: owner.avatar } : null,
    agent: agent ? { name: agent.name, email: agent.email, phone: agent.phone, avatar: agent.avatar } : null
  };

  return res.status(200).json(detail);
});

// POST /api/properties (Create a listing)
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'agent' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized to list properties' });
  }

  const { title, description, price, type, propertyType, beds, baths, area, location, address, image, images, features, virtualTourUrl } = req.body;
  if (!title || !price || !type || !propertyType || !location || !address) {
    return res.status(400).json({ message: 'Missing required property details' });
  }

  const db = await getDb();

  // Assign agent automatically if owner posts (let's pick the agent in the system, agentId 4, for simplicity)
  // Admins or agents post, their own id can be mapped or agentId 4
  const newProperty = await db.insert('properties', {
    title,
    description: description || '',
    price: Number(price),
    type,
    propertyType,
    beds: Number(beds) || 1,
    baths: Number(baths) || 1,
    area: Number(area) || 0,
    location,
    address,
    image: image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    images: images || [],
    features: features || [],
    virtualTourUrl: virtualTourUrl || '',
    ownerId: req.user.role === 'owner' ? req.user.id : 3, // Robert Stark default or actual owner
    agentId: req.user.role === 'agent' ? req.user.id : 4, // Emily Watson default or actual agent
    verified: req.user.role === 'admin', // Auto-verify if admin
    status: 'available'
  });

  return res.status(201).json(newProperty);
});

// PUT /api/properties/:id (Update listing)
router.put('/:id', authenticateToken, async (req, res) => {
  const db = await getDb();
  const id = Number(req.params.id);
  const property = db.find('properties', p => p.id === id);

  if (!property) return res.status(404).json({ message: 'Property not found' });

  // Access check
  if (req.user.role !== 'admin' && property.ownerId !== req.user.id && property.agentId !== req.user.id) {
    return res.status(403).json({ message: 'Unauthorized to update this property' });
  }

  const updatedProperty = await db.update('properties', id, req.body);
  return res.status(200).json(updatedProperty);
});

// DELETE /api/properties/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  const db = await getDb();
  const id = Number(req.params.id);
  const property = db.find('properties', p => p.id === id);

  if (!property) return res.status(404).json({ message: 'Property not found' });

  // Access check
  if (req.user.role !== 'admin' && property.ownerId !== req.user.id && property.agentId !== req.user.id) {
    return res.status(403).json({ message: 'Unauthorized to delete this property' });
  }

  await db.delete('properties', id);
  return res.status(200).json({ message: 'Property deleted successfully' });
});

// POST /api/properties/:id/favorite (Toggle favorite)
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  const db = await getDb();
  const userId = req.user.id;
  const propertyId = Number(req.params.id);

  const existingFav = db.find('favorites', f => f.userId === userId && f.propertyId === propertyId);

  if (existingFav) {
    await db.delete('favorites', existingFav.id);
    return res.status(200).json({ favorited: false, message: 'Removed from favorites' });
  } else {
    await db.insert('favorites', { userId, propertyId });
    return res.status(201).json({ favorited: true, message: 'Added to favorites' });
  }
});

export default router;
