import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, signOut } = useAuth();

  return (
    <nav className="bg-slate-800 shadow-lg p-4 w-full mb-10 sticky top-0 z-50"> {/* Added sticky and z-index */}
      <div className="container mx-auto flex flex-wrap justify-between items-center max-w-6xl">
        <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mr-6">
          PromptHub
        </Link>
        <div className="space-x-2 sm:space-x-4 text-sm sm:text-base"> {/* Adjusted spacing for responsiveness */}
          <Link to="/" className="text-slate-300 hover:text-sky-400 transition px-2 py-1">Home</Link>
          {currentUser ? (
            <>
              <Link to="/dashboard" className="text-slate-300 hover:text-sky-400 transition px-2 py-1">Dashboard</Link>
              <Link to="/builder" className="text-slate-300 hover:text-sky-400 transition px-2 py-1">Builder</Link>
              <Link to="/pricing" className="text-slate-300 hover:text-yellow-400 transition px-2 py-1">Pricing</Link>
              <button onClick={signOut} className="text-slate-300 hover:text-red-500 transition px-2 py-1">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/pricing" className="text-slate-300 hover:text-yellow-400 transition px-2 py-1">Pricing</Link>
              <Link to="/login" className="text-slate-300 hover:text-sky-400 transition bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-md">Login</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
