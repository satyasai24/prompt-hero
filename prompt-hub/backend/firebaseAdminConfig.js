import admin from 'firebase-admin';
// IMPORTANT: Developer needs to download this file from Firebase console
// and place it in the backend directory.
// Ensure this file is in .gitignore
// For subtask, we assume it will be present at runtime.
// const serviceAccount = require('./firebase-service-account.json'); // For CommonJS

// For ES Modules, you might need to read it differently or ensure your bundler handles it.
// A common way is to set GOOGLE_APPLICATION_CREDENTIALS env var.
// For this subtask, we'll assume GOOGLE_APPLICATION_CREDENTIALS is set.
try {
  admin.initializeApp({
    // credential: admin.credential.cert(serviceAccount) // If using explicit import
    // If GOOGLE_APPLICATION_CREDENTIALS is set, this is often not needed.
  });
  console.log("Firebase Admin SDK initialized.");
} catch (error) {
  if (error.code === 'app/no-app' && error.message.includes('initializeApp()')) {
    // This error means it's already initialized, which is fine.
    console.log("Firebase Admin SDK already initialized or using GOOGLE_APPLICATION_CREDENTIALS.");
  } else {
    console.error("Firebase Admin SDK Initialization Error:", error);
  }
}
export default admin;
