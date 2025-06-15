import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './firebaseAdminConfig.js'; // Initialize Firebase Admin
import authRoutes from './routes/authRoutes.js';
import promptRoutes from './routes/promptRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js'; // Import Stripe routes
import pg from 'pg';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

// Stripe webhook needs raw body, so it must be registered BEFORE express.json()
// All other /api/stripe routes can use express.json()
// The stripeRoutes.js file itself applies express.raw for its /webhook route.
// So, we can mount it normally here if other routes in stripeRoutes need express.json().
// If stripeRoutes *only* contained the webhook, or if all its routes needed raw bodies,
// then it would be different.
// For now, let's assume other stripe routes (if added later) might need JSON.
// The router.post('/webhook', express.raw(...)) in stripeRoutes.js will handle the raw body for that specific route.
app.use('/api/stripe', stripeRoutes);


app.use(express.json()); // For all other routes that expect JSON

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Backend is running healthy!', timestamp: new Date() });
});

// Use auth routes
app.use('/api/auth', authRoutes);
// Use prompt routes
app.use('/api/prompts', promptRoutes);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { // Add SSL config if needed for your PostgreSQL provider
  //   rejectUnauthorized: false
  // }
});

pool.connect()
  .then(() => console.log("Connected to PostgreSQL database via Pool"))
  .catch(err => console.error("Pool connection error", err.stack));

// Test DB connection endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.status(200).json({ connected: true, time: result.rows[0].now });
    client.release();
  } catch (err) {
    console.error('Database test connection error', err.stack);
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
