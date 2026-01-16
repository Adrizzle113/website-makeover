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

// Payment type with amount details (from order form response)
export interface PaymentTypeDetail {
  type: PaymentType;
  amount: string;         // e.g., "9.00"
  currency_code: string;  // e.g., "USD"
  // Payota credit card tokenization fields (only present for type="now")
  pay_uuid?: string;
  init_uuid?: string;
  is_need_credit_card_data?: boolean;
  is_need_cvc?: boolean;
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
    // Full payment types array with amounts (use this!)
    payment_types?: PaymentTypeDetail[];
    // Backend's recommended payment type (priority: hotel > now > deposit)
    recommended_payment_type?: PaymentTypeDetail;
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
  payment_amount: string;     // Required - from payment_types[].amount
  payment_currency_code: string; // Required - from payment_types[].currency_code
  guests: Array<{
    first_name: string;
    last_name: string;
    is_child?: boolean;
    age?: number;
  }>;
  user_ip?: string;
  language?: string;
  email?: string;             // Required for booking
  phone?: string;             // Required for booking
  // For card payments after tokenization (UUIDs at root level for backend)
  pay_uuid?: string;
  init_uuid?: string;
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

// Note: DocumentInfo and DocumentsResponse are defined in the POST-BOOKING TYPES section

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

// ============================================
// MULTIROOM BOOKING TYPES (RateHawk APIv3)
// ============================================

// Guest configuration for multiroom
export interface MultiroomGuests {
  adults: number;
  children: Array<{ age: number } | number>;
}

// Single room for multiroom prebook request
export interface MultiroomPrebookRoom {
  book_hash?: string;      // Use book_hash (h-...) for hotel search results
  match_hash?: string;     // Use match_hash (m-...) for region search results
  guests: MultiroomGuests[];
  residency?: string;
  price_increase_percent?: number; // 0-100, per room
}

// Multiroom Prebook Request
export interface MultiroomPrebookParams {
  rooms: MultiroomPrebookRoom[];
  language?: string;
  currency?: string;
}

// Single room result in multiroom prebook response
export interface MultiroomPrebookRoomResult {
  roomIndex: number;
  booking_hash: string;    // p-... hash for order form
  book_hash: string;       // Alias for booking_hash
  price_changed: boolean;
  new_price?: number;
  original_price?: number;
  currency: string;
}

// Failed room in multiroom response
export interface MultiroomFailedRoom {
  roomIndex: number;
  error: string;
  code: string;
  book_hash?: string;      // Original hash that failed
}

// Multiroom Prebook Response
export interface MultiroomPrebookResponse {
  status: "ok" | "error";
  success: boolean;        // true if ALL rooms succeeded, false if any failed
  data: {
    rooms: MultiroomPrebookRoomResult[];
    failed?: MultiroomFailedRoom[];
    total_rooms: number;
    successful_rooms: number;
    failed_rooms: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

// Single room in multiroom order form response
export interface MultiroomOrderFormRoom {
  roomIndex: number;
  order_id: number | string;
  item_id: number | string;
  booking_hash: string;
  payment_types: PaymentType[];
  // Full payment types array with amounts (use this!)
  payment_types_detail?: PaymentTypeDetail[];
  // Backend's recommended payment type (priority: hotel > now > deposit)
  recommended_payment_type?: PaymentTypeDetail;
  form_fields?: OrderFormField[];
  // Payota tokenization fields
  pay_uuid?: string;
  init_uuid?: string;
  is_need_credit_card_data?: boolean;
  is_need_cvc?: boolean;
}

// Multiroom Order Form Response
export interface MultiroomOrderFormResponse {
  success: boolean;        // true if all rooms succeeded
  data: {
    rooms: MultiroomOrderFormRoom[];
    failed?: MultiroomFailedRoom[];
    total_rooms: number;
    successful_rooms: number;
    failed_rooms: number;
    // Common payment types across all rooms
    payment_types_available?: PaymentType[];
  };
  status: string;
  error?: {
    message: string;
    code: string;
  };
}

// Single room for multiroom order finish request
export interface MultiroomOrderFinishRoom {
  order_id: number | string;
  item_id: number | string;
  guests: MultiroomGuests[];
}

// Multiroom Order Finish Request
export interface MultiroomOrderFinishParams {
  rooms: MultiroomOrderFinishRoom[];
  payment_type: "hotel" | "deposit" | "now"; // Same for all rooms
  payment_amount: string;                     // Required - from payment_types array
  payment_currency_code: string;              // Required - from payment_types array
  email: string;                              // Required - user email
  phone?: string;                             // Required - user phone
  partner_order_id: string;                   // Same for all rooms (links them)
  language?: string;
  upsell_data?: unknown[];                    // Same for all rooms
}

// Single room result in multiroom order finish response
export interface MultiroomOrderFinishRoomResult {
  roomIndex: number;
  order_id: number | string;
  status: "processing" | "confirmed" | "failed";
}

// Multiroom Order Finish Response
export interface MultiroomOrderFinishResponse {
  success: boolean;        // true if all rooms succeeded
  data: {
    rooms: MultiroomOrderFinishRoomResult[];
    failed?: MultiroomFailedRoom[];
    partner_order_id: string;
    order_ids: (number | string)[]; // All order IDs from successful bookings
    total_rooms: number;
    successful_rooms: number;
    failed_rooms: number;
  };
  status: string;
  error?: {
    message: string;
    code: string;
  };
}

// Type guards for detecting multiroom vs single room
export function isMultiroomPrebookParams(params: PrebookParams | MultiroomPrebookParams): params is MultiroomPrebookParams {
  return 'rooms' in params && Array.isArray(params.rooms);
}

export function isMultiroomPrebookResponse(response: PrebookResponse | MultiroomPrebookResponse): response is MultiroomPrebookResponse {
  return 'data' in response && 'rooms' in response.data && Array.isArray(response.data.rooms);
}

export function isMultiroomOrderFormResponse(response: OrderFormResponse | MultiroomOrderFormResponse): response is MultiroomOrderFormResponse {
  return 'data' in response && 'rooms' in response.data && Array.isArray(response.data.rooms);
}

export function isMultiroomOrderFinishParams(params: OrderFinishParams | MultiroomOrderFinishParams): params is MultiroomOrderFinishParams {
  return 'rooms' in params && Array.isArray(params.rooms);
}

// Multiroom prebooked room stored in state
export interface PrebookedRoom {
  roomIndex: number;
  originalRoomId: string;  // From selectedRooms
  booking_hash: string;    // p-... hash from prebook
  book_hash: string;       // Original h-... or m-... hash
  price_changed: boolean;
  new_price?: number;
  original_price?: number;
  currency: string;
}

// Multiroom order form stored in state
export interface OrderFormData {
  roomIndex: number;
  order_id: string;
  item_id: string;
  booking_hash: string;
  payment_types: PaymentType[];
  pay_uuid?: string;
  init_uuid?: string;
  is_need_credit_card_data?: boolean;
  is_need_cvc?: boolean;
}

// Multiroom booking status tracking
export interface MultiroomBookingStatus {
  rooms: Array<{
    roomIndex: number;
    order_id: string;
    status: "processing" | "confirmed" | "failed";
    confirmation_number?: string;
  }>;
  failed?: MultiroomFailedRoom[];
  partner_order_id: string;
  total_rooms: number;
  successful_rooms: number;
  failed_rooms: number;
}

// Extended PendingBookingData for multiroom
export interface MultiroomPendingBookingData extends PendingBookingData {
  isMultiroom: boolean;
  prebookedRooms?: PrebookedRoom[];
  orderForms?: OrderFormData[];
  multiroomStatus?: MultiroomBookingStatus;
}

// ============================================
// POST-BOOKING TYPES (Cancel, Contract, Financial, Documents)
// Aligned with backend mock API responses
// ============================================

// Cancellation Request
export interface CancellationRequest {
  order_id: string;
  language?: string;
  reason?: string;
}

// Cancellation penalty term
export interface CancellationPenalty {
  from_date: string;
  to_date?: string;
  amount: number;
  currency_code: string;
  percent?: number;
}

// Cancellation Response (matches backend mock)
export interface CancellationResponse {
  status: "ok" | "error";
  order_id: string;
  cancelled_at: string;
  cancellation_fee: number;
  refund_amount: number;
  currency: string;
  message?: string;
  // Legacy data wrapper for backward compatibility
  data?: {
    order_id: string;
    status: "cancelled" | "pending_cancellation" | "cancellation_failed";
    refund_amount?: number;
    refund_currency?: string;
    cancellation_fee?: number;
    expected_refund_date?: string;
    cancellation_id?: string;
    message?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Contract Data Response (matches backend mock - account level)
export interface ContractDataResponse {
  contract_id: string;
  partner_id: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  commission_rate: number;
  currency: string;
  status: string;
}

// Contract Data (for order-specific use, keep for backward compat)
export interface ContractData {
  order_id?: string;
  contract_id: string;
  rate_type?: "net" | "sell" | "gross";
  supplier_name?: string;
  commission_percent?: number;
  markup_percent?: number;
  terms?: string[];
  cancellation_terms?: CancellationPenalty[];
  payment_terms?: string;
  special_conditions?: string[];
}

// Financial Info Response (matches backend mock - account level)
export interface FinancialInfoResponse {
  contract_id: string;
  balance: number;
  currency: string;
  pending_payments: number;
  last_payment_date: string;
  next_payment_date: string;
  transactions: Array<{
    date: string;
    amount: number;
    type: string;
    description: string;
  }>;
}

// Tax and fee items (keep for compatibility)
export interface TaxItem {
  name: string;
  amount: number;
  currency_code: string;
  included_in_price: boolean;
}

export interface FeeItem {
  name: string;
  amount: number;
  currency_code: string;
  type: "service" | "booking" | "processing" | "other";
}

// Transaction record (keep for compatibility)
export interface Transaction {
  id: string;
  type: "charge" | "refund" | "adjustment";
  amount: number;
  currency_code: string;
  status: "pending" | "completed" | "failed";
  timestamp: string;
  description?: string;
  payment_method?: string;
}

// Financial Info (order-specific, keep for backward compat)
export interface FinancialInfo {
  order_id: string;
  amounts: {
    net_rate: number;
    sell_rate: number;
    commission: number;
    taxes: TaxItem[];
    fees: FeeItem[];
    total: number;
    currency_code: string;
  };
  payment_status: "pending" | "paid" | "partial" | "refunded";
  transactions: Transaction[];
  billing_info?: {
    invoice_number?: string;
    invoice_date?: string;
    due_date?: string;
  };
}

// Closing document types
export type ClosingDocumentType = 
  | "voucher" 
  | "invoice" 
  | "confirmation" 
  | "single_act" 
  | "receipt" 
  | "contract"
  | "closing_statement";

// Closing document info (matches backend mock)
export interface ClosingDocumentInfo {
  document_id: string;
  document_type: string;
  period: string;
  date: string;
  amount: number;
  currency: string;
  download_url: string;
  // Legacy fields for backward compat
  id?: string;
  type?: ClosingDocumentType;
  name?: string;
  generated_at?: string;
  available?: boolean;
  file_size?: number;
  format?: "pdf" | "html";
}

// Closing Documents Info Response (matches backend mock)
export interface ClosingDocumentsInfoResponse {
  documents: ClosingDocumentInfo[];
  total_documents: number;
  // Legacy wrapper
  status?: "ok" | "error";
  data?: {
    order_id: string;
    documents: ClosingDocumentInfo[];
  };
  error?: {
    code: string;
    message: string;
  };
}

// Closing Document Download Response (matches backend mock)
export interface ClosingDocumentDownloadResponse {
  document_id: string;
  document_url: string;
  document_data?: string; // base64
  downloaded_at: string;
}

// Voucher Download Response (matches backend mock)
export interface VoucherDownloadResponse {
  order_id: string;
  partner_order_id: string;
  voucher_url: string;
  voucher_data?: string; // base64
  language: string;
  generated_at: string;
  // Backward compat - alias fields
  status?: "ok" | "error";
  data?: {
    url: string;
    file_name: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Invoice Download Response (matches backend mock)
export interface InvoiceDownloadResponse {
  order_id: string;
  invoice_number: string;
  invoice_url: string;
  invoice_data?: string; // base64
  amount: number;
  currency: string;
  issue_date: string;
  // Backward compat
  status?: "ok" | "error";
  data?: {
    url: string;
    file_name: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Order group invoice (matches backend mock)
export interface OrderGroupInvoiceResponse {
  invoice_id: string;
  invoice_url: string;
  invoice_data?: string; // base64
  total_amount: number;
  currency: string;
  orders_count: number;
  issue_date: string;
  // Backward compat
  status?: "ok" | "error";
  data?: {
    order_group_id: string;
    url: string;
    expires_at: string;
    file_name: string;
    content_type: string;
    total_amount: number;
    currency_code: string;
    order_count: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Single Act Download Response (matches backend mock)
export interface ActDownloadResponse {
  order_id: string;
  act_url: string;
  act_data?: string; // base64
  act_number: string;
  issue_date: string;
  // Backward compat
  status?: "ok" | "error";
  data?: {
    url: string;
    file_name: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Legacy DocumentDownloadResponse (keep for backward compat)
export interface DocumentDownloadResponse {
  status: "ok" | "error";
  data: {
    url: string;
    expires_at: string;
    file_name: string;
    content_type: string;
    file_size?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Legacy DocumentInfo for order documents
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

// ============================================
// RATEHAWK ORDER INFO BATCH API TYPES
// Matches /api/b2b/v3/hotel/order/info/ endpoint
// ============================================

// Request structure for batch order retrieval
export interface OrderInfoBatchRequest {
  ordering: {
    ordering_type: "asc" | "desc";
    ordering_by: "created_at" | "checkin_at" | "checkout_at";
  };
  pagination: {
    page_size: string;  // "1" to "100"
    page_number: string;
  };
  search?: {
    created_at?: {
      from_date?: string;  // ISO format "YYYY-MM-DDTHH:mm"
      to_date?: string;
    };
    order_id?: number[];
    partner_order_id?: string[];
    status?: Array<"confirmed" | "cancelled" | "processing" | "failed">;
  };
  language?: string;
}

// Guest data in RateHawk order response
export interface RateHawkGuestData {
  first_name: string;
  first_name_original: string;
  last_name: string;
  last_name_original: string;
  is_child: boolean;
  age: number | null;
}

// Room data in RateHawk order response
export interface RateHawkRoomData {
  room_idx: number;
  room_name: string;
  meal_name: string;
  bedding_name: string[];
  has_breakfast: boolean;
  no_child_meal: boolean;
  guest_data: {
    adults_number: number;
    children_number: number;
    guests: RateHawkGuestData[];
  };
}

// Tax in RateHawk order response
export interface RateHawkTax {
  name: string;
  amount_tax: {
    amount: string;
    currency_code: string;
  };
  is_included: boolean;
}

// Cancellation policy in RateHawk order response
export interface RateHawkCancellationPolicy {
  start_at: string | null;
  end_at: string | null;
  penalty: {
    amount: string;
    currency_code: string;
    amount_info?: {
      amount_commission: string;
      amount_gross: string;
      amount_net: string;
    };
  };
}

// Full order data from RateHawk batch response
export interface RateHawkOrderData {
  order_id: number;
  order_type: "hotel";
  status: "confirmed" | "cancelled" | "processing" | "failed";
  source: string;
  
  // Timestamps
  created_at: string;
  modified_at: string;
  cancelled_at: string | null;
  
  // Booking dates
  checkin_at: string;
  checkout_at: string;
  nights: number;
  roomnights: number;
  
  // Cancellation
  is_cancellable: boolean;
  cancellation_info: {
    free_cancellation_before: string;
    policies: RateHawkCancellationPolicy[];
  };
  
  // Pricing
  amount_sell: { amount: string; currency_code: string };
  amount_payable: { amount: string; currency_code: string };
  amount_payable_vat: { amount: string; currency_code: string };
  amount_refunded: { amount: string; currency_code: string };
  amount_sell_b2b2c: { amount: string; currency_code: string };
  amount_payable_with_upsells: { amount: string; currency_code: string };
  total_vat: { amount: string; currency_code: string; included: boolean };
  
  // Hotel
  hotel_data: {
    id: string;
    hid: number;
    order_id: number | null;
  };
  
  // Rooms with guest data
  rooms_data: RateHawkRoomData[];
  
  // Taxes
  taxes: RateHawkTax[];
  
  // Payment
  payment_data: {
    payment_type: PaymentType;
    invoice_id: string | null;
    invoice_id_v2: string | null;
    paid_at: string | null;
    payment_by: string | null;
    payment_due: string;
    payment_pending: string;
  };
  
  // Partner data (our order reference)
  partner_data: {
    order_id: string;
    order_comment: string | null;
  };
  
  // User data
  user_data: {
    email: string;
    user_comment: string | null;
    arrival_datetime: string | null;
  };
  
  // Supplier
  supplier_data: {
    confirmation_id: string;
    name: string;
    order_id: string;
  };
  
  // Metadata
  agreement_number: string | null;
  api_auth_key_id: number;
  contract_slug: string;
  invoice_id: string | null;
  is_checked: boolean;
  is_package: boolean;
  has_tickets: boolean;
  meta_data: {
    voucher_order_comment: string | null;
  };
  upsells: unknown[];
  amount_sell_b2b2c_commission: string | null;
}

// Batch response from RateHawk /api/b2b/v3/hotel/order/info/
export interface RateHawkOrderInfoBatchResponse {
  status: "ok" | "error";
  error: string | null;
  data: {
    current_page_number: number;
    total_orders: number;
    total_pages: number;
    found_orders: number;
    found_pages: number;
    orders: RateHawkOrderData[];
  };
  debug?: {
    request_id: string;
    utcnow: string;
  };
}
