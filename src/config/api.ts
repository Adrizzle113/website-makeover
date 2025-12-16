// API Configuration for RateHawk Backend
export const API_BASE_URL = "https://travel-frontend-5izj2xq3z-bba-b6b19fcb.vercel.app";

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    SEARCH_HOTELS: "/api/ratehawk/search",
    GET_HOTEL_DETAILS: "/api/ratehawk/hotel",
    GET_DESTINATIONS: "/api/ratehawk/destinations",
    INIT_SESSION: "/api/ratehawk/session",
  },
} as const;

export const getApiUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
};
