// Trip represents an ETG order_group_id - a collection of bookings/orders
export interface Trip {
  id: string; // ETG order_group_id
  name: string; // Auto-generated or custom name
  clientName: string;
  clientEmail?: string;
  dateRange: {
    checkIn: string; // ISO date string
    checkOut: string; // ISO date string
  };
  destinations: string[]; // List of cities
  bookingsCount: number;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  currency: string;
}

export type TripStatus = "active" | "cancelled" | "mixed" | "completed";

// Order represents a single ETG order within a trip
export interface Order {
  id: string; // ETG order_id
  tripId: string; // ETG order_group_id
  hotelName: string;
  hotelAddress: string;
  hotelStars: number;
  city: string;
  country: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  roomCount: number;
  occupancy: {
    adults: number;
    children: number;
    childrenAges?: number[];
  };
  leadGuest: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  paymentType: "now" | "deposit" | "pay_at_hotel";
  status: OrderStatus;
  cancellationPolicy: string;
  cancellationDeadline?: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  confirmedAt?: string;
  documents: OrderDocument[];
}

export type OrderStatus = "confirmed" | "pending" | "cancelled" | "completed";

// Document represents an ETG document (voucher, confirmation, etc.)
export interface OrderDocument {
  id: string;
  orderId: string;
  tripId: string;
  type: DocumentType;
  name: string;
  url: string;
  generatedAt: string;
  fileSize?: number;
}

export type DocumentType = "voucher" | "confirmation" | "invoice" | "receipt";

// Timeline event for order history
export type OrderEventType = 
  | "booked" 
  | "payment_authorized" 
  | "paid" 
  | "confirmed" 
  | "documents_issued" 
  | "documents_resent" 
  | "cancellation_requested" 
  | "cancelled" 
  | "refunded" 
  | "synced" 
  | "agent_note";

export type OrderEventSource = "SYSTEM" | "SUPPLIER" | "AGENT";

export interface OrderTimelineEvent {
  id: string;
  orderId: string;
  type: OrderEventType;
  source: OrderEventSource;
  actorName?: string;
  message: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Search/filter params for trips list
export interface TripFilters {
  search?: string;
  clientName?: string;
  hotelName?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: TripStatus;
  orderId?: string;
}
