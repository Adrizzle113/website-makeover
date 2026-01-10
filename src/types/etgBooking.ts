// ETG / RateHawk APIv3 Booking Types

export type PaymentType = "deposit" | "hotel" | "now" | "now_net" | "now_gross";

export type OrderStatus = 
  | "idle" 
  | "prebooked" 
  | "processing" 
  | "confirmed" 
  | "failed" 
  | "cancelled";

// Guest information for booking
export interface BookingGuest {
  first_name: string;
  last_name: string;
  is_child?: boolean;
  age?: number;
}

// Prebook request params
export interface PrebookParams {
  book_hash: string;
  residency: string;
  currency?: string;
  price_increase_percent?: number; // Default 20, allows finding alternative rates within tolerance
}

// Prebook error codes from WorldOTA API
export type PrebookErrorCode = 
  | "NO_AVAILABLE_RATES"    // Rate no longer available
  | "RATE_NOT_FOUND"        // Hash expired or invalid
  | "INVALID_PARAMS"        // Bad request params
  | "PREBOOK_ERROR"         // Generic prebook error
  | "PREBOOK_DISABLED"      // No permission for prebook
  | "CONTRACT_MISMATCH"     // Contract differs from rate
  | "UNKNOWN";              // Internal timeout

// Prebook response from API
export interface PrebookResponse {
  success?: boolean;
  data: {
    booking_hash: string;        // New p-... hash for booking (use this for order form!)
    price_changed: boolean;
    new_price?: number;
    original_price?: number;
    currency?: string;
    price_increase_percent?: number; // The value used in the request
    final_price?: {
      amount: string;
      currency_code: string;
    };
    room_data?: {
      name?: string;
      meal?: string;
    };
    cancellation_info?: {
      free_cancellation_before?: string;
      cancellation_policy?: string;
    };
  };
  status: string;
  error?: {
    message: string;
    code: PrebookErrorCode;
  };
}

// Order Booking Form - required guest fields from API
export interface OrderFormField {
  name: string;
  required: boolean;
  type: "text" | "email" | "phone" | "date" | "select";
  label?: string;
  options?: string[];
}

export interface OrderFormResponse {
  data: {
    order_id: string;        // Required for finish step
    item_id: string;         // Required for finish step
    booking_hash?: string;   // Deprecated - for backward compat
    required_fields: OrderFormField[];
    rooms: Array<{
      guests_required: number;
      is_lead_guest?: boolean;
    }>;
    terms_and_conditions?: string;
    payment_types_available: PaymentType[];
    final_price: {
      amount: string;
      currency_code: string;
    };
    // Payota credit card tokenization fields
    pay_uuid?: string;
    init_uuid?: string;
    is_need_credit_card_data?: boolean;
    is_need_cvc?: boolean;
  };
  status: string;
  error?: {
    message: string;
    code: string;
  };
}

// Payota Credit Card Token Request
export interface PayotaTokenRequest {
  object_id: string;          // order_id
  pay_uuid: string;
  init_uuid: string;
  user_first_name: string;
  user_last_name: string;
  is_cvc_required: boolean;
  cvc?: string;
  credit_card_data_core: {
    card_number: string;      // No spaces, just digits
    card_holder: string;
    month: string;            // "01" format
    year: string;             // "25" format (2-digit)
  };
}

// Payota Credit Card Token Response
export interface PayotaTokenResponse {
  status: "ok" | "error";
  error?: string;
}

// Order Booking Finish params
export interface OrderFinishParams {
  order_id: string;           // From order form response
  item_id: string;            // From order form response
  partner_order_id: string;   // Required - same as used in form
  payment_type: PaymentType;
  guests: Array<{
    first_name: string;
    last_name: string;
    is_child?: boolean;
    age?: number;
  }>;
  user_ip?: string;
  language?: string;
  email?: string;
  phone?: string;
}

// Order Booking Finish response
export interface OrderFinishResponse {
  data: {
    order_id: string;
    order_group_id: string;
    status: "processing" | "confirmed" | "failed";
    partner_order_id?: string;
  };
  status: string;
  error?: {
    message: string;
    code: string;
  };
}

// Order Finish Status response
export interface OrderStatusResponse {
  data: {
    order_id: string;
    order_group_id?: string;
    status: "processing" | "confirmed" | "failed" | "cancelled";
    confirmation_number?: string;
    supplier_confirmation?: string;
    final_price?: {
      amount: string;
      currency_code: string;
    };
    cancellation_info?: {
      free_cancellation_before?: string;
    };
  };
  status: string;
  error?: {
    message: string;
    code: string;
  };
}

// Order Information response
export interface OrderInfoResponse {
  data: {
    order_id: string;
    order_group_id: string;
    status: OrderStatus;
    confirmation_number: string;
    hotel: {
      id: string;
      name: string;
      address: string;
      city: string;
      country: string;
      star_rating: number;
      phone?: string;
    };
    room: {
      name: string;
      meal_plan?: string;
      guests: BookingGuest[];
    };
    dates: {
      check_in: string;
      check_out: string;
      nights: number;
    };
    price: {
      amount: string;
      currency_code: string;
    };
    lead_guest: {
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
    };
    payment: {
      type: PaymentType;
      status: "pending" | "paid" | "refunded";
    };
    cancellation_policy?: string;
    created_at: string;
    updated_at: string;
  };
  status: string;
  error?: {
    message: string;
    code: string;
  };
}

// Documents response
export interface DocumentInfo {
  document_id: string;
  type: "voucher" | "invoice" | "confirmation";
  name: string;
  format: "pdf" | "html";
  url?: string;
  created_at: string;
}

export interface DocumentsResponse {
  data: {
    order_id: string;
    documents: DocumentInfo[];
  };
  status: string;
  error?: {
    message: string;
    code: string;
  };
}

// RateHawk API Error Codes (Best Practices Section 5.3)
// Final failure errors - stop polling immediately
export type FinalFailureErrorCode =
  | "3ds"
  | "block"
  | "book_limit"
  | "booking_finish_did_not_succeed"
  | "charge"
  | "soldout"
  | "provider"
  | "not_allowed";

// Retryable errors - continue polling
export type RetryableErrorCode = "timeout" | "unknown";

// All booking error codes
export type BookingErrorCode = FinalFailureErrorCode | RetryableErrorCode;

// User-friendly error messages for each error code
export const BOOKING_ERROR_MESSAGES: Record<BookingErrorCode, string> = {
  "3ds": "Card authentication failed. Please try a different payment method.",
  "block": "This booking has been blocked. Please contact support for assistance.",
  "book_limit": "Booking limit reached for this property. Please try again later.",
  "booking_finish_did_not_succeed": "Booking could not be completed. Please try again.",
  "charge": "Payment could not be processed. Please check your card details and try again.",
  "soldout": "This rate is no longer available. Please select a different room or rate.",
  "provider": "The hotel's system is temporarily unavailable. Please try again in a few minutes.",
  "not_allowed": "This booking is not permitted. Please contact support for assistance.",
  "timeout": "Request timed out. We're still checking the status...",
  "unknown": "An unexpected error occurred. We're still checking the status...",
};

// Check if an error code is a final failure (stop polling)
export function isFinalFailureError(errorCode: string): boolean {
  const finalErrors: FinalFailureErrorCode[] = [
    "3ds", "block", "book_limit", "booking_finish_did_not_succeed",
    "charge", "soldout", "provider", "not_allowed"
  ];
  return finalErrors.includes(errorCode as FinalFailureErrorCode);
}

// Check if an error code is retryable (continue polling)
export function isRetryableError(errorCode: string): boolean {
  const retryableErrors: RetryableErrorCode[] = ["timeout", "unknown"];
  return retryableErrors.includes(errorCode as RetryableErrorCode);
}

// Get user-friendly message for an error code
export function getBookingErrorMessage(errorCode: string): string {
  return BOOKING_ERROR_MESSAGES[errorCode as BookingErrorCode] || 
    "An unexpected error occurred. Please try again or contact support.";
}

// Selected upsell for booking
export interface BookingUpsell {
  id: string;
  type: "early_checkin" | "late_checkout";
  name: string;
  price: number;
  currency: string;
  roomId: string;
  newTime?: string;
}

// Booking data stored in session
export interface PendingBookingData {
  bookingId: string;          // partner_order_id
  bookingHash: string;        // book_hash from prebook
  orderId?: string;           // From order form response
  itemId?: string;            // From order form response
  hotel: {
    id: string;
    name: string;
    address: string;
    city: string;
    country?: string;
    starRating: number;
    currency: string;
    mainImage?: string;
  };
  rooms: Array<{
    roomId: string;
    roomName: string;
    quantity: number;
    pricePerRoom: number;
    totalPrice: number;
    taxes?: Array<{
      name: string;
      included_by_supplier: boolean;
      amount: string;
      currency_code: string;
    }>;
  }>;
  guests: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    type: "adult" | "child";
    age?: number;
    isLead: boolean;
    citizenship?: string;
  }>;
  bookingDetails: {
    countryCode: string;
    phoneNumber: string;
    groupOfClients: string;
    specialRequests: string;
  };
  totalPrice: number;
  searchParams: {
    checkIn: string | Date;
    checkOut: string | Date;
    guests: number;
    rooms: number;
    children?: number;
    childrenAges?: number[];
  };
  pricingSnapshot?: {
    netPrice: number;
    commission: number;
    commissionType: "percentage" | "fixed";
    commissionValue: number;
    clientPrice: number;
  } | null;
  residency: string;
  paymentType?: PaymentType;
  upsells?: BookingUpsell[];
}
