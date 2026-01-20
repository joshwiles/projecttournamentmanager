/**
 * API Configuration
 * 
 * In production, this uses VITE_API_URL environment variable
 * In development, it defaults to the local backend
 */
const getApiBase = () => {
  // Check if we have an explicit API URL from environment
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use relative path (proxied by Vite)
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production without VITE_API_URL, default to relative path
  // This assumes the frontend and backend are on the same domain
  // For separate deployments, VITE_API_URL must be set
  return '/api';
};

export const API_BASE = getApiBase();
