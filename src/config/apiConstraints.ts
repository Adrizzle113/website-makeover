/**
 * RateHawk API Constraints
 * Centralized constants for all API validation limits
 * Based on RateHawk API documentation
 */

export const RATEHAWK_CONSTRAINTS = {
  // Date constraints
  MAX_CHECKIN_DAYS_AHEAD: 730,  // Check-in max 730 days from today
  MAX_STAY_NIGHTS: 30,          // Max 30 nights per stay (checkout ≤ 30 days from checkin)
  
  // Guest constraints
  MAX_GUESTS_PER_ROOM: 6,       // Adults + children combined per room
  MAX_ADULTS_PER_ROOM: 6,
  MIN_ADULTS_PER_ROOM: 1,
  MAX_CHILDREN_PER_ROOM: 4,     // Max 4 children per room
  MAX_CHILD_AGE: 17,            // Maximum age per child
  
  // Room constraints
  MAX_ROOMS_PER_REQUEST: 9,     // Max 9 rooms per search request
  MIN_ROOMS_PER_REQUEST: 1,
  
  // Hotel ID search constraints
  MAX_HOTELS_PER_ID_SEARCH: 300, // Max 300 hotel IDs per search
  
  // Timeout constraints
  DEFAULT_SEARCH_TIMEOUT: 30,   // Recommended timeout in seconds
  MAX_SEARCH_TIMEOUT: 100,      // Maximum allowed timeout
} as const;

// Helper for validation messages
export const VALIDATION_MESSAGES = {
  MAX_ROOMS: `Maximum ${RATEHAWK_CONSTRAINTS.MAX_ROOMS_PER_REQUEST} rooms allowed`,
  MAX_CHILDREN: `Maximum ${RATEHAWK_CONSTRAINTS.MAX_CHILDREN_PER_ROOM} children per room`,
  MAX_GUESTS: `Maximum ${RATEHAWK_CONSTRAINTS.MAX_GUESTS_PER_ROOM} guests per room`,
  MAX_HOTELS: `Maximum ${RATEHAWK_CONSTRAINTS.MAX_HOTELS_PER_ID_SEARCH} hotel IDs allowed`,
  MAX_STAY: `Maximum stay is ${RATEHAWK_CONSTRAINTS.MAX_STAY_NIGHTS} nights`,
  MAX_CHECKIN: `Check-in date cannot be more than ${RATEHAWK_CONSTRAINTS.MAX_CHECKIN_DAYS_AHEAD} days ahead`,
} as const;
