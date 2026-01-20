import { API_BASE } from '../config/api.js';

/**
 * Safely parse JSON response, checking for HTML errors
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Parsed JSON data
 * @throws {Error} If response is not JSON or parsing fails
 */
export async function safeJsonParse(response) {
  // Check if response is actually JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response received:', text.substring(0, 500));
    console.error('Response URL:', response.url);
    console.error('Response status:', response.status, response.statusText);
    
    // Try to extract useful error info
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error(
        `API returned HTML instead of JSON. This usually means:\n` +
        `1. The API endpoint doesn't exist (404 error)\n` +
        `2. VITE_API_URL is not set correctly in production\n` +
        `3. The backend server is not running\n\n` +
        `Current API_BASE: ${API_BASE}\n` +
        `Response URL: ${response.url}\n` +
        `Response status: ${response.status} ${response.statusText}\n\n` +
        `To fix: Set VITE_API_URL environment variable to your backend URL (e.g., https://your-backend.up.railway.app/api)`
      );
    }
    
    throw new Error(`Expected JSON but received: ${contentType}. Response: ${text.substring(0, 200)}`);
  }
  
  return await response.json();
}
