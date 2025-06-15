import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


const HomePage = () => {
  const { currentUser } = useAuth();
  return (
    <div className="text-center py-10">
      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-6">
        Welcome to Prompt Engineering Hub!
      </h1>
      <p className="text-slate-300 mb-8 text-lg max-w-xl mx-auto">
        Build, test, and share prompts across major AI models.
        Empowering better prompt creation and collaboration.
      </p>
      {currentUser ? (
        <Link to="/dashboard" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition">
          Go to Dashboard
        </Link>
      ) : (
        <Link to="/login" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition">
          Get Started
        </Link>
      )}
    </div>
  );
};
export default HomePage;
