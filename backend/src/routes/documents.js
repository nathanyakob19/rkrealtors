import express from 'express';
import { getDb } from '../db/db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/documents (List agreements)
router.get('/', authenticateToken, async (req, res) => {
  const db = await getDb();
  const userId = req.user.id;
  const role = req.user.role;

  let docs = db.get('documents');

  if (role === 'buyer' || role === 'tenant') {
    docs = docs.filter(d => d.buyerId === userId);
  } else if (role === 'owner') {
    docs = docs.filter(d => d.ownerId === userId);
  } else if (role === 'agent') {
    // Show agreements where the property's agent is current user
    const myProperties = db.filter('properties', p => p.agentId === userId).map(p => p.id);
    docs = docs.filter(d => myProperties.includes(d.propertyId));
  }
  // Admins see all documents

  // Populate references
  const populated = docs.map(d => {
    const prop = db.find('properties', p => p.id === d.propertyId);
    const buyer = db.find('users', u => u.id === d.buyerId);
    const owner = db.find('users', u => u.id === d.ownerId);

    return {
      ...d,
      property: prop ? { title: prop.title, location: prop.location, price: prop.price, type: prop.type } : null,
      buyer: buyer ? { name: buyer.name, email: buyer.email } : null,
      owner: owner ? { name: owner.name, email: owner.email } : null
    };
  });

  return res.status(200).json(populated);
});

// GET /api/documents/:id (Single document detail)
router.get('/:id', authenticateToken, async (req, res) => {
  const db = await getDb();
  const doc = db.find('documents', d => d.id === Number(req.params.id));
  if (!doc) return res.status(404).json({ message: 'Document not found' });

  // Authorization check
  const userId = req.user.id;
  const role = req.user.role;
  const isAuthorized = 
    role === 'admin' ||
    doc.buyerId === userId ||
    doc.ownerId === userId ||
    db.filter('properties', p => p.agentId === userId).some(p => p.id === doc.propertyId);

  if (!isAuthorized) {
    return res.status(403).json({ message: 'Unauthorized to view this document' });
  }

  const prop = db.find('properties', p => p.id === doc.propertyId);
  const buyer = db.find('users', u => u.id === doc.buyerId);
  const owner = db.find('users', u => u.id === doc.ownerId);

  return res.status(200).json({
    ...doc,
    property: prop ? { title: prop.title, location: prop.location, price: prop.price, type: prop.type, address: prop.address } : null,
    buyer: buyer ? { name: buyer.name, email: buyer.email, phone: buyer.phone } : null,
    owner: owner ? { name: owner.name, email: owner.email, phone: owner.phone } : null
  });
});

// POST /api/documents (Draft a new lease/purchase contract)
router.post('/', authenticateToken, async (req, res) => {
  const { title, type, propertyId, buyerEmail, content } = req.body;
  if (!title || !type || !propertyId || !buyerEmail || !content) {
    return res.status(400).json({ message: 'Required drafting details missing' });
  }

  const db = await getDb();
  const property = db.find('properties', p => p.id === Number(propertyId));
  if (!property) return res.status(404).json({ message: 'Property not found' });

  // Find buyer by email
  const buyer = db.find('users', u => u.email.toLowerCase() === buyerEmail.toLowerCase());
  if (!buyer) return res.status(404).json({ message: 'Buyer/Tenant with this email does not exist' });

  // Access check
  if (req.user.role !== 'admin' && property.ownerId !== req.user.id && property.agentId !== req.user.id) {
    return res.status(403).json({ message: 'Unauthorized to draft agreement for this property' });
  }

  const newDoc = await db.insert('documents', {
    title,
    type, // lease, purchase
    propertyId: Number(propertyId),
    buyerId: buyer.id,
    ownerId: property.ownerId,
    status: 'pending_signatures',
    content,
    signatures: {
      owner: null,
      buyer: null
    }
  });

  return res.status(201).json(newDoc);
});

// POST /api/documents/:id/sign (Apply e-signature)
router.post('/:id/sign', authenticateToken, async (req, res) => {
  const { signatureData } = req.body; // Can be drawn canvas image URL or name
  if (!signatureData) return res.status(400).json({ message: 'Signature drawing or content required' });

  const db = await getDb();
  const id = Number(req.params.id);
  const doc = db.find('documents', d => d.id === id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });

  const userId = req.user.id;
  const signatures = { ...doc.signatures };
  let signatureRole = null;

  if (doc.buyerId === userId) {
    signatureRole = 'buyer';
  } else if (doc.ownerId === userId) {
    signatureRole = 'owner';
  } else {
    return res.status(403).json({ message: 'Unauthorized to sign this document' });
  }

  signatures[signatureRole] = {
    signature: signatureData,
    signedAt: new Date().toISOString()
  };

  let newStatus = doc.status;
  if (signatures.owner && signatures.buyer) {
    newStatus = 'fully_signed';
  } else if (signatures.owner || signatures.buyer) {
    newStatus = 'partially_signed';
  }

  const updatedDoc = await db.update('documents', id, {
    signatures,
    status: newStatus
  });

  return res.status(200).json(updatedDoc);
});

export default router;
