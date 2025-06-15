import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const LoginPage = () => {
  const { currentUser, signInWithGoogle, signInWithGitHub, loading } = useAuth();

  if (loading) return <p className="text-center p-10">Loading...</p>;
  if (currentUser) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-6 text-sky-400">Login</h2>
        <p className="text-slate-300 mb-6">Sign in to access the Prompt Hub.</p>
        <button
          onClick={signInWithGoogle}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded w-full mb-4 transition"
        >
          Sign in with Google
        </button>
        <button
          onClick={signInWithGitHub}
          className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded w-full transition"
        >
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
};
export default LoginPage;
