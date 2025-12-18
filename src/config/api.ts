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

// Export the base URL based on current environment
export const API_BASE_URL = API_CONFIG[API_CONFIG.current];

// Export the full config object for reference
export default API_CONFIG;
