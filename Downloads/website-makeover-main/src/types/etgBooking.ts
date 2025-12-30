// ETG / RateHawk APIv3 Booking Types

export type PaymentType = "deposit" | "hotel" | "now";

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
}

// Prebook response from API
export interface PrebookResponse {
  data: {
    booking_hash: string;
    price_changed: boolean;
    new_price?: number;
    original_price?: number;
    currency?: string;
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
    code: string;
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
  };
  status: string;
  error?: {
    message: string;
    code: string;
  };
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
