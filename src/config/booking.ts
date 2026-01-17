// Booking Configuration for ETG/RateHawk API

export const BOOKING_CONFIG = {
  // Polling configuration for booking status checks
  polling: {
    maxWaitTime: 300, // 5 minutes in seconds
    pollInterval: 5000, // 5 seconds in milliseconds
  },
};

export default BOOKING_CONFIG;
