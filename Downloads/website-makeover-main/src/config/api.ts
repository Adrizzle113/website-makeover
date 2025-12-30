// API Configuration for website-makeover / bookja
// This file configures which backend API the frontend connects to

const API_CONFIG = {
  // Live production URL - Your backend API on Render
  live: "https://travelapi-bg6t.onrender.com",

  // Local development URL - Use this when testing with local backend
  local: "http://localhost:3001",

  // Current environment - Change to 'local' for local development, 'live' for production
  current: "live" as const,
};

// Determine which API URL to use based on environment variable or current config
function getApiBaseUrl(): string {
  // Priority 1: Environment variable (VITE_API_BASE_URL)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Priority 2: Environment-based selection (VITE_API_ENV)
  const env = import.meta.env.VITE_API_ENV || import.meta.env.MODE;
  if (env === "development" || env === "dev") {
    return API_CONFIG.local;
  }
  
  // Priority 3: Default to live/production
  return API_CONFIG.live;
}

// Export the base URL
export const API_BASE_URL = getApiBaseUrl();

// Export the full config object for reference
export default API_CONFIG;
