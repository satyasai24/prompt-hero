import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../contexts/AuthContext';

// Ensure VITE_STRIPE_PUBLISHABLE_KEY is in frontend/.env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PricingPage = () => {
  const { idToken, currentUser } = useAuth();

  const handleUpgrade = async () => {
    if (!idToken) { alert("Please login to upgrade."); return; }
    if (currentUser?.plan_tier === 'pro') {
        alert("You are already on the Pro plan!");
        return;
    }
    try {
      const res = await fetch('/api/stripe/create-checkout-session', { // Vite proxies this in dev
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json' // Good practice, though no body sent for this specific request
        }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to create checkout session. Server error.'}));
        throw new Error(errorData.message || 'Failed to create checkout session');
      }
      const { sessionId } = await res.json();
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        console.error("Stripe redirect error:", error.message);
        alert(`Stripe Error: ${error.message}`);
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="text-center max-w-lg mx-auto p-4"> {/* Increased max-width slightly */}
      <h1 className="text-3xl font-bold text-sky-400 mb-10">Pricing Plans</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-8 rounded-lg shadow-xl flex flex-col">
          <h2 className="text-2xl font-semibold text-teal-400 mb-4">Free Tier</h2>
          <ul className="text-slate-300 space-y-2 text-left mb-6 flex-grow">
            <li>✓ Up to 5 saved prompts</li>
            <li>✓ Access to all models for testing</li>
            <li>✓ Basic community support</li>
          </ul>
          <button
            disabled
            className="w-full bg-slate-700 text-slate-400 font-bold py-3 px-6 rounded-lg cursor-not-allowed"
          >
            Currently Active
          </button>
        </div>
        <div className="bg-slate-800 p-8 rounded-lg shadow-xl border-2 border-purple-500 flex flex-col">
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">Pro Tier</h2>
          <ul className="text-slate-300 space-y-2 text-left mb-6 flex-grow">
            <li>✓ Unlimited saved prompts</li>
            <li>✓ Access to all models for testing</li>
            <li>✓ Priority support (coming soon)</li>
            <li>✓ Early access to new features (coming soon)</li>
          </ul>
          <p className="text-3xl font-extrabold my-4 text-white">$10<span className="text-base font-normal text-slate-400">/month</span></p>
          {currentUser?.plan_tier === 'pro' ? (
               <p className="text-green-400 font-semibold py-3">You are currently on the Pro plan!</p>
          ) : (
               <button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
               >
                  Upgrade to Pro
               </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default PricingPage;
