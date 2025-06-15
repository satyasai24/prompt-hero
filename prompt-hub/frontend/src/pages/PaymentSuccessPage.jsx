import React, { useEffect } from 'react'; // Added useEffect
import { Link, useSearchParams } from 'react-router-dom'; // Added useSearchParams
import { useAuth } from '../contexts/AuthContext'; // Added useAuth

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { refreshUserData } = useAuth();

  useEffect(() => {
    // Potentially verify session_id with backend if needed for extra security or logging, then refresh.
    // For now, just assume success if Stripe redirects here and refresh user data.
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      console.log("Stripe Checkout Session ID:", sessionId);
      // Potentially send this sessionId to backend to confirm and log, then refresh.
      // For MVP, directly refreshing user data to reflect new plan.
      refreshUserData();
    }
  }, [searchParams, refreshUserData]);

  return (
    <div className="text-center py-10">
      <h1 className="text-3xl font-bold text-green-400 mb-6">Payment Successful!</h1>
      <p className="text-slate-300 mb-8 text-lg">
        Welcome to Pro! Your subscription is now active. Your account details should update shortly.
      </p>
      <Link to="/dashboard" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition">
        Go to Dashboard
      </Link>
    </div>
  );
};
export default PaymentSuccessPage;
