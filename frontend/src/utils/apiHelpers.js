import { API_BASE } from '../config/api.js';

/**
 * Handle fetch network errors with helpful messages
 * @param {Error} error - The fetch error
 * @param {string} url - The URL that failed
 * @returns {Error} A more descriptive error
 */
export function handleNetworkError(error, url) {
  console.error('Network error details:', {
    name: error.name,
    message: error.message,
    url: url,
    apiBase: API_BASE,
  });

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new Error(
      `Network Error: Failed to connect to API\n\n` +
      `Possible causes:\n` +
      `• Backend server is not running\n` +
      `• CORS is blocking the request\n` +
      `• API URL is incorrect\n` +
      `• Network connectivity issue\n\n` +
      `Request URL: ${url}\n` +
      `API_BASE: ${API_BASE}\n` +
      `VITE_API_URL: ${import.meta.env.VITE_API_URL || 'NOT SET'}\n\n` +
      `Check:\n` +
      `1. Is the backend server running?\n` +
      `2. Is CORS_ORIGIN set correctly in backend?\n` +
      `3. Is VITE_API_URL set correctly in frontend?\n` +
      `4. Check browser console (F12) for CORS errors`
    );
  }

  return error;
}

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
    // Clone the response so we can read it without consuming it
    const clonedResponse = response.clone();
    const text = await clonedResponse.text();
    
    console.error('=== API Error Details ===');
    console.error('Response URL:', response.url);
    console.error('Response status:', response.status, response.statusText);
    console.error('Content-Type:', contentType);
    console.error('Response body (first 1000 chars):', text.substring(0, 1000));
    console.error('Current API_BASE:', API_BASE);
    console.error('VITE_API_URL env:', import.meta.env.VITE_API_URL || 'NOT SET');
    console.error('========================');
    
    // Try to extract useful error info from HTML
    if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('<body')) {
      // Try to extract title or error message from HTML
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      const h1Match = text.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const errorInfo = titleMatch ? titleMatch[1] : (h1Match ? h1Match[1] : 'Unknown error');
      
      // Create a user-friendly error message
      let errorMessage = `API returned HTML instead of JSON (${response.status} ${response.statusText})\n\n`;
      errorMessage += `Possible causes:\n`;
      errorMessage += `• API endpoint doesn't exist (404 error)\n`;
      errorMessage += `• VITE_API_URL not set in production\n`;
      errorMessage += `• Backend server not running\n`;
      errorMessage += `• Request routed to frontend instead of backend\n\n`;
      
      // Show the actual URL being called
      const requestUrl = response.url || 'Unknown';
      errorMessage += `Request URL: ${requestUrl}\n`;
      errorMessage += `API_BASE: ${API_BASE}\n`;
      
      const viteApiUrl = import.meta.env.VITE_API_URL;
      if (!viteApiUrl && import.meta.env.PROD) {
        errorMessage += `\n❌ VITE_API_URL is NOT SET (this is likely the problem!)\n\n`;
        errorMessage += `🔧 SOLUTION:\n`;
        errorMessage += `1. Go to your deployment platform (Vercel/Railway)\n`;
        errorMessage += `2. Add environment variable: VITE_API_URL\n`;
        errorMessage += `3. Set value to: https://your-backend.up.railway.app/api\n`;
        errorMessage += `4. Redeploy your frontend\n`;
      } else {
        errorMessage += `VITE_API_URL: ${viteApiUrl || 'Not set'}\n`;
      }
      
      throw new Error(errorMessage);
    }
    
    // For other non-JSON content types
    throw new Error(
      `Expected JSON but received ${contentType}\n` +
      `Response URL: ${response.url}\n` +
      `Status: ${response.status} ${response.statusText}\n` +
      `First 200 chars: ${text.substring(0, 200)}`
    );
  }
  
  return await response.json();
}
