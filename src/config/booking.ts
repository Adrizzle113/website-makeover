// Booking Configuration for ETG/RateHawk API
// This file contains settings for sandbox vs production mode

export const BOOKING_CONFIG = {
  // Sandbox mode - set to true when using ETG Sandbox API key
  // In sandbox mode:
  // - Only refundable rates can be booked
  // - Only the test hotel (hid=8473727) can be booked
  // - Non-refundable rates will cause "insufficient_b2b_balance" errors
  // - Deposit payment types require B2B balance (which sandbox accounts don't have)
  isSandboxMode: true, // Set to false for production
  
  // ETG Test Hotel IDs (only bookable in sandbox)
  testHotelId: "8473727",
  testHotelSlug: "test_hotel_do_not_book",
  
  // Sandbox restrictions
  sandboxRestrictions: {
    // Only refundable rates with future free_cancellation_before dates
    refundableOnly: true,
    // Show warning banner to users
    showWarningBanner: true,
    // Payment types allowed in sandbox (deposit requires B2B balance!)
    // "hotel" = pay at property, "now" = card payment
    // "deposit" is explicitly blocked because sandbox has no B2B balance
    allowedPaymentTypes: ["hotel", "now"] as string[],
    // Block deposit payment type entirely in sandbox
    blockDeposit: true,
  },
  
  // Polling configuration
  polling: {
    maxWaitTime: 300, // 5 minutes in seconds
    pollInterval: 5000, // 5 seconds in milliseconds
  },
};

// Helper to check if a rate is refundable
export const isRateRefundable = (
  cancellationPolicy: string | undefined,
  cancellationDeadline: string | undefined
): boolean => {
  if (!cancellationPolicy || !cancellationDeadline) {
    return false;
  }
  
  const isFreePolicy = 
    cancellationPolicy.toLowerCase().includes("free") ||
    cancellationPolicy.toLowerCase().includes("refundable") ||
    cancellationPolicy === "free_cancellation";
  
  if (!isFreePolicy) {
    return false;
  }
  
  // Check if deadline is in the future
  try {
    const deadline = new Date(cancellationDeadline);
    return deadline > new Date();
  } catch {
    return false;
  }
};

// Helper to check if hotel is the test hotel
export const isTestHotel = (hotelId: string | undefined): boolean => {
  if (!hotelId) return false;
  return hotelId === BOOKING_CONFIG.testHotelId || 
         hotelId === BOOKING_CONFIG.testHotelSlug;
};

export default BOOKING_CONFIG;
