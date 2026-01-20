/**
 * API Configuration
 * 
 * In production, this uses VITE_API_URL environment variable
 * In development, it defaults to the local backend
 */
const getApiBase = () => {
  // Check if we have an explicit API URL from environment
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    console.log('Using VITE_API_URL:', url);
    return url;
  }
  
  // In development, use relative path (proxied by Vite)
  if (import.meta.env.DEV) {
    console.log('Development mode: Using /api (proxied by Vite)');
    return '/api';
  }
  
  // In production without VITE_API_URL, default to relative path
  // This assumes the frontend and backend are on the same domain
  // For separate deployments, VITE_API_URL must be set
  console.warn('⚠️ VITE_API_URL not set in production! Using /api (may not work if backend is on different domain)');
  console.warn('Set VITE_API_URL environment variable to your backend URL (e.g., https://your-backend.up.railway.app/api)');
  return '/api';
};

export const API_BASE = getApiBase();
