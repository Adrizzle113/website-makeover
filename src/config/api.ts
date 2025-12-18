// API Configuration
const API_CONFIG = {
  // Live production URL
  live: "https://travelapi-bg6t.onrender.com",

  // Local development URL (if testing locally)
  local: "http://localhost:3001",

  // Current environment
  current: "live" as const,
};

export const API_BASE_URL = API_CONFIG[API_CONFIG.current];
export default API_CONFIG;
