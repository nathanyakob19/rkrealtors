import { getDb } from './db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Starting database seeding...');
  const db = await getDb();

  // Clear previous data
  db.data = {
    users: [],
    properties: [],
    visits: [],
    bookings: [],
    documents: [],
    favorites: []
  };

  const salt = await bcrypt.genSalt(10);
  const hashPassword = async (pwd) => bcrypt.hash(pwd, salt);

  const defaultPassword = await hashPassword('password123');

  // 1. Seed Users
  const users = [
    {
      id: 1,
      email: 'buyer@rk.com',
      password: defaultPassword,
      role: 'buyer',
      name: 'Sarah Connor',
      phone: '+1 (555) 019-2834',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      verified: true
    },
    {
      id: 2,
      email: 'tenant@rk.com',
      password: defaultPassword,
      role: 'tenant',
      name: 'John Doe',
      phone: '+1 (555) 021-3948',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      verified: true
    },
    {
      id: 3,
      email: 'owner@rk.com',
      password: defaultPassword,
      role: 'owner',
      name: 'Robert Stark',
      phone: '+1 (555) 014-9988',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      verified: true
    },
    {
      id: 4,
      email: 'agent@rk.com',
      password: defaultPassword,
      role: 'agent',
      name: 'Emily Watson',
      phone: '+1 (555) 012-3456',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      verified: true
    },
    {
      id: 5,
      email: 'designer@rk.com',
      password: defaultPassword,
      role: 'designer',
      name: 'Liam Vance',
      phone: '+1 (555) 017-6644',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      verified: true
    },
    {
      id: 6,
      email: 'admin@rk.com',
      password: defaultPassword,
      role: 'admin',
      name: 'Alice Johnson',
      phone: '+1 (555) 010-0000',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      verified: true
    }
  ];
  db.data.users = users;

  // 2. Seed Properties
  const properties = [
    {
      id: 1,
      title: 'Skyline Obsidian Villa',
      description: 'A luxurious modern villa featuring smart systems, obsidian architecture, glass facades, an infinity pool, and custom interior finishes throughout.',
      price: 2450000,
      type: 'buy', // buy or rent
      propertyType: 'villa',
      beds: 4,
      baths: 5,
      area: 4200,
      location: 'Beverly Hills, CA',
      address: '742 Evergreen Terrace, Beverly Hills, CA 90210',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      images: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800'
      ],
      features: ['Infinity Pool', 'Smart Home System', 'Home Cinema', 'Wine Cellar', 'Obsidian Finishes'],
      virtualTourUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      ownerId: 3, // Robert Stark
      agentId: 4, // Emily Watson
      verified: true,
      status: 'available'
    },
    {
      id: 2,
      title: 'Neon Heights Penthouse',
      description: 'Stunning high-floor penthouse with panoramic city views, glass panels, a private terrace, and bespoke designer furniture.',
      price: 8500,
      type: 'rent',
      propertyType: 'penthouse',
      beds: 3,
      baths: 3,
      area: 2500,
      location: 'Manhattan, NY',
      address: '450 Park Avenue, Apt 42B, New York, NY 10022',
      image: 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800',
      images: [
        'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
      ],
      features: ['Private Elevator', '24/7 Concierge', 'Roof Terrace', 'Bespoke Bar', 'Floor-to-ceiling Windows'],
      virtualTourUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      ownerId: 3,
      agentId: 4,
      verified: true,
      status: 'available'
    },
    {
      id: 3,
      title: 'Minimalist Glass Studio',
      description: 'Elegant studio apartment built with sustainable materials, smart lighting, and optimized multi-functional Scandinavian furniture.',
      price: 2800,
      type: 'rent',
      propertyType: 'apartment',
      beds: 1,
      baths: 1,
      area: 750,
      location: 'Seattle, WA',
      address: '101 Pine St, Seattle, WA 98101',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800'
      ],
      features: ['Scandinavian Styling', 'Smart Lock', 'Eco Heating', 'Rooftop Lounge'],
      virtualTourUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      ownerId: 3,
      agentId: 4,
      verified: false,
      status: 'pending' // Admin needs to verify this
    },
    {
      id: 4,
      title: 'Emerald Garden Estate',
      description: 'A grand family estate with expansive manicured lawns, classical detailing, and a separate modern guest house.',
      price: 4950000,
      type: 'buy',
      propertyType: 'estate',
      beds: 6,
      baths: 7,
      area: 7800,
      location: 'Miami, FL',
      address: '2200 Brickell Ave, Miami, FL 33129',
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      images: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
      ],
      features: ['Private Pier', 'Tennis Court', 'Guest House', 'Smart Security', 'Spa Room'],
      virtualTourUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      ownerId: 3,
      agentId: 4,
      verified: true,
      status: 'available'
    }
  ];
  db.data.properties = properties;

  // 3. Seed Designers
  const designers = [
    {
      id: 1,
      userId: 5, // Liam Vance
      name: 'Liam Vance',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      bio: 'Bespoke architect and interior designer specializing in industrial and obsidian glassmorphism themes.',
      rating: 4.9,
      experience: '12 Years',
      rate: 150, // Per hour
      styles: ['Obsidian Glass', 'Industrial', 'Minimalist'],
      portfolio: [
        {
          id: 1,
          title: 'The Obsidian Lounge',
          style: 'Obsidian Glass',
          image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
          hotspots: [
            { id: 1, x: 25, y: 45, title: 'Obsidian Velvet Sofa', price: '$2,499', description: 'Custom-crafted dark velvet sofa with brushed steel base.' },
            { id: 2, x: 60, y: 35, title: 'Glass Pendant Light', price: '$450', description: 'Hand-blown smoky grey glass light fixtures.' },
            { id: 3, x: 45, y: 70, title: 'Monolithic Coffee Table', price: '$1,200', description: 'Solid black marble table with raw texture.' }
          ]
        },
        {
          id: 2,
          title: 'Scandinavian Calm',
          style: 'Minimalist',
          image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
          hotspots: [
            { id: 1, x: 30, y: 55, title: 'Oak Sideboard', price: '$850', description: 'Solid white oak storage unit with tambour doors.' },
            { id: 2, x: 75, y: 40, title: 'Linen Lounge Chair', price: '$599', description: 'Ergonomic easy chair with neutral linen upholstery.' }
          ]
        }
      ]
    }
  ];
  db.data.bookings = [];

  // Write designer list directly to tables or store in bookings
  // Let's store designer profiles directly inside db.data
  db.data.designers = designers;

  // 4. Seed Documents (Contract Templates / Active Agreements)
  const documents = [
    {
      id: 1,
      title: 'Standard Residential Lease Agreement',
      type: 'lease',
      propertyId: 2, // Neon Heights Penthouse
      buyerId: 2, // John Doe (Tenant)
      ownerId: 3, // Robert Stark (Owner)
      status: 'pending_signatures', // pending_signatures, partially_signed, fully_signed
      content: `RESIDENTIAL LEASE AGREEMENT

This Agreement is made on 2026-07-14 between Robert Stark (Landlord) and John Doe (Tenant).
The Landlord agrees to rent the property located at "450 Park Avenue, Apt 42B, New York, NY 10022" to the Tenant under the following terms:

1. LEASE TERM: 12 Months starting 2026-08-01.
2. RENT PAYMENTS: The monthly rent is $8,500, due on the 1st of each month.
3. SECURITY DEPOSIT: A deposit of $17,000 shall be held by the Landlord.
4. SIGNATURES: Both parties agree to the terms listed herein.`,
      signatures: {
        owner: null,
        buyer: null
      }
    }
  ];
  db.data.documents = documents;

  await db.save();
  console.log('Database seeded successfully!');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
});
