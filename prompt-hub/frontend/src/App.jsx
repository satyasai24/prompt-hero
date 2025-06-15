import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import UserDashboardPage from './pages/UserDashboardPage';
import PromptBuilderPage from './pages/PromptBuilderPage';
import ProtectedRoute from './components/ProtectedRoute';
import PricingPage from './pages/PricingPage'; // Import PricingPage
import PaymentSuccessPage from './pages/PaymentSuccessPage'; // Import PaymentSuccessPage
import PaymentCancelPage from './pages/PaymentCancelPage'; // Import PaymentCancelPage


function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <p className="text-xl">Loading application state...</p> {/* Slightly more descriptive loading */}
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-900 text-white">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pricing" element={<PricingPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/builder" element={<PromptBuilderPage />} />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
              <Route path="/payment-cancel" element={<PaymentCancelPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} /> {/* Catch-all route */}
          </Routes>
        </main>
        <footer className="text-center p-4 text-sm text-slate-500 border-t border-slate-700 mt-auto">
          Prompt Engineering Hub &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </Router>
  );
}
export default App;
