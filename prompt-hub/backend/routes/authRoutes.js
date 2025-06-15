import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import pg from 'pg';

const router = express.Router();
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false } // Uncomment if needed
});

// This endpoint is called by frontend after Firebase login to sync user with local DB
router.post('/verify-user', authMiddleware, async (req, res) => {
  const firebaseUser = req.user; // User from verified Firebase token

  try {
    // Check if user exists, select new fields
    let userResult = await pool.query(
      'SELECT id, email, auth_provider_id, plan_tier, stripe_customer_id, stripe_subscription_id, subscription_status FROM users WHERE auth_provider_id = $1',
      [firebaseUser.uid]
    );

    let localUser = userResult.rows[0];

    if (!localUser) {
      const email = firebaseUser.email;
      if (!email) {
          return res.status(400).json({ message: "Email not available from auth provider." });
      }
      // Create new user with default 'free' plan_tier
      const newUserResult = await pool.query(
        'INSERT INTO users (email, auth_provider_id, plan_tier, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, email, auth_provider_id, plan_tier, stripe_customer_id, stripe_subscription_id, subscription_status',
        [email, firebaseUser.uid, 'free'] // Default to 'free'
      );
      localUser = newUserResult.rows[0];
      console.log('New user created in local DB:', localUser);
    } else {
      console.log('User found in local DB:', localUser);
    }

    res.status(200).json({
      message: 'User verified successfully.',
      user: {
        id: localUser.id,
        email: localUser.email,
        firebase_uid: firebaseUser.uid,
        plan_tier: localUser.plan_tier,
        subscription_status: localUser.subscription_status,
        // stripe_customer_id: localUser.stripe_customer_id, // Optionally return these if needed on frontend
        // stripe_subscription_id: localUser.stripe_subscription_id,
      }
    });

  } catch (error) {
    console.error('Error during user verification/creation in local DB:', error);
    res.status(500).json({ message: 'Server error during user verification.' });
  }
});

export default router;
