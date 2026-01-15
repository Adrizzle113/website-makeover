// API Configuration for website-makeover / bookja
// This file configures which backend API the frontend connects to

const API_CONFIG = {
  // Live production URL - Your backend API on Render
  live: "https://travelapi-bg6t.onrender.com",

  // Local development URL - Use this when testing with local backend
  local: "http://localhost:3001",

  // Current environment - Change to 'local' for local development, 'live' for production
  current: "live" as const,

  // WorldOTA integration toggle - set to false when credentials unavailable
  // Reads from VITE_WORLDOTA_ENABLED env var (default: false to avoid 401 errors)
  worldotaEnabled: import.meta.env.VITE_WORLDOTA_ENABLED === "true",
};

// Export the base URL from environment variable, with fallback to live URL
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || API_CONFIG.live;

// Export WorldOTA toggle for use in components
export const WORLDOTA_ENABLED = API_CONFIG.worldotaEnabled;

// Export the full config object for reference
export default API_CONFIG;
