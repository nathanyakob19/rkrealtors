import express from 'express';
import cors from 'cors';
import { getDb } from './db/db.js';
import authRouter from './routes/auth.js';
import propertiesRouter from './routes/properties.js';
import visitsRouter from './routes/visits.js';
import documentsRouter from './routes/documents.js';
import designersRouter from './routes/designers.js';
import usersRouter from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (usually runs on http://localhost:5173)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Init DB
console.log('Initializing database connection...');
await getDb();

// Routes
app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/designers', designersRouter);
app.use('/api/users', usersRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`RK Realtor Backend running on http://localhost:${PORT}`);
});
