import express from 'express';
import Stripe from 'stripe';
import authMiddleware from '../middleware/authMiddleware.js';
import pg from 'pg';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper to get local user ID and email by Firebase UID
const getLocalUserByFirebaseUid = async (firebaseUid) => {
  const userRes = await pool.query('SELECT id, email, stripe_customer_id, plan_tier FROM users WHERE auth_provider_id = $1', [firebaseUid]);
  return userRes.rows[0];
};

router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const localUser = await getLocalUserByFirebaseUid(firebaseUid);

    if (!localUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if user is already pro
    if (localUser.plan_tier === 'pro') {
        return res.status(400).json({ message: "User is already on the Pro plan." });
    }

    let stripeCustomerId = localUser.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: localUser.email,
        metadata: { local_user_id: localUser.id }, // Store local user ID in Stripe customer metadata
      });
      stripeCustomerId = customer.id;
      await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [stripeCustomerId, localUser.id]);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      line_items: [{ price: process.env.PRO_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/payment-cancel`,
      metadata: { local_user_id: localUser.id } // Pass local_user_id to webhook
    });
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler - Placed here, but needs to be registered with express.raw in server.js
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Stripe Webhook Event Type:', event.type);
  const session = event.data.object;

  try {
    if (event.type === 'checkout.session.completed') {
      if (session.mode === 'subscription' && session.payment_status === 'paid') {
        // Use local_user_id from metadata if available
        const localUserId = session.metadata?.local_user_id;
        const stripeSubscriptionId = session.subscription;
        const stripeCustomerId = session.customer;

        if (localUserId) {
          await pool.query(
            'UPDATE users SET plan_tier = $1, stripe_subscription_id = $2, stripe_customer_id = $3, subscription_status = $4 WHERE id = $5',
            ['pro', stripeSubscriptionId, stripeCustomerId, 'active', localUserId]
          );
          console.log(`User ${localUserId} upgraded to Pro via checkout.session.completed.`);
        } else {
          console.error('Webhook (checkout.session.completed): local_user_id not found in session metadata for session_id:', session.id);
          // Fallback: Try to find user by stripe_customer_id if local_user_id was not in metadata (should not happen with current setup)
          if (stripeCustomerId) {
            const userByCustomerId = await pool.query('SELECT id FROM users WHERE stripe_customer_id = $1', [stripeCustomerId]);
            if (userByCustomerId.rows.length > 0) {
              const fallbackUserId = userByCustomerId.rows[0].id;
               await pool.query(
                'UPDATE users SET plan_tier = $1, stripe_subscription_id = $2, subscription_status = $3 WHERE id = $4',
                ['pro', stripeSubscriptionId, 'active', fallbackUserId]
              );
              console.log(`User ${fallbackUserId} (found by customer_id) upgraded to Pro.`);
            } else {
              console.error('Webhook: No user found for stripe_customer_id', stripeCustomerId);
            }
          }
        }
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        const newStatus = subscription.status;
        const planTier = (newStatus === 'active' || newStatus === 'trialing') ? 'pro' : 'free';

        const result = await pool.query(
            'UPDATE users SET subscription_status = $1, plan_tier = $2 WHERE stripe_subscription_id = $3 RETURNING id',
            [newStatus, planTier, subscription.id]
        );
        if (result.rows.length > 0) {
            console.log(`User ${result.rows[0].id} subscription ${subscription.id} status updated to ${newStatus}. Plan tier set to: ${planTier}`);
        } else {
            console.warn(`No user found for subscription_id ${subscription.id} during update/delete event.`);
        }
    }
    // Consider other events like 'invoice.payment_failed' to potentially downgrade users or notify them.
  } catch (dbError) {
    console.error("Webhook DB update error:", dbError);
    // Do not send 500 to Stripe, as it will retry. Log error for investigation.
  }
  res.status(200).json({ received: true }); // Always send 200 to Stripe for acknowledged webhooks
});
export default router;
