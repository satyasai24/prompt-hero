import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../firebaseConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState(null);

  // Function to fetch extended user data from backend
  const fetchBackendUser = async (firebaseUser, token) => {
    try {
      const response = await fetch('/api/auth/verify-user', { // Vite proxies this in dev
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to verify user with backend.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const backendData = await response.json();
      return backendData.user; // { id, email, plan_tier, subscription_status, ... }
    } catch (error) {
      console.error("Error fetching backend user data:", error);
      return null; // Return null or a default user object if backend sync fails
    }
  };

  const handleUser = async (firebaseUser) => {
    setLoading(true); // Set loading true at the start of handling user state change
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken();
      setIdToken(token); // Set ID token first
      localStorage.setItem('firebaseIdToken', token);

      const backendUser = await fetchBackendUser(firebaseUser, token);

      // Combine Firebase user data with backend data
      // Prioritize backend data for fields like plan_tier, but keep Firebase's core info
      setCurrentUser({
        ...firebaseUser, // uid, displayName, email, photoURL etc. from Firebase
        ...(backendUser || {}), // Add plan_tier, subscription_status etc. from backend
      });

    } else {
      setCurrentUser(null);
      setIdToken(null);
      localStorage.removeItem('firebaseIdToken');
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const signInWithGoogle = async () => {
    // setLoading(true) will be handled by onAuthStateChanged -> handleUser
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setLoading(false); // Ensure loading is false if sign-in popup fails
    }
  };

  const signInWithGitHub = async () => {
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (error) {
      console.error("GitHub Sign-In Error:", error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // currentUser and idToken will be set to null by onAuthStateChanged -> handleUser
    } catch (error) {
      console.error("Sign Out Error:", error);
    }
  };

  // Function to refresh user data manually if needed, e.g., after subscription success
  const refreshUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      await handleUser(user); // Re-run the handleUser logic
    }
  };


  const value = {
    currentUser,
    idToken,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    loading,
    refreshUserData // Expose refresh function
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
