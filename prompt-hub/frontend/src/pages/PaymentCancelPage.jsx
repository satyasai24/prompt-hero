import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCancelPage = () => (
  <div className="text-center py-10">
    <h1 className="text-3xl font-bold text-red-400 mb-6">Payment Cancelled or Failed</h1>
    <p className="text-slate-300 mb-8 text-lg">
      Your payment process was cancelled or could not be completed.
      You can try upgrading again from the pricing page.
    </p>
    <Link to="/pricing" className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition">
      Back to Pricing
    </Link>
  </div>
);
export default PaymentCancelPage;
