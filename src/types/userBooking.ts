// Types for user bookings stored in Supabase

export type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed";

export interface RoomData {
  roomId: string;
  roomName: string;
  mealPlan?: string;
  quantity: number;
}

export interface GuestData {
  firstName: string;
  lastName: string;
  email?: string;
  type: "adult" | "child";
  age?: number;
  isLead?: boolean;
}

export interface TaxData {
  name: string;
  amount: string;
  currency_code: string;
  included_by_supplier: boolean;
}

export interface CancellationPolicy {
  from?: string;
  to?: string;
  penalty?: string;
  description?: string;
}

// Database row type (matches Supabase table structure)
export interface UserBookingRow {
  id: string;
  user_id: string;
  order_id: string;
  partner_order_id?: string | null;
  order_group_id?: string | null;
  status: string;
  confirmation_number?: string | null;
  hotel_id?: string | null;
  hotel_name?: string | null;
  hotel_address?: string | null;
  hotel_city?: string | null;
  hotel_country?: string | null;
  hotel_star_rating?: number | null;
  hotel_phone?: string | null;
  hotel_image?: string | null;
  check_in_date: string;
  check_out_date: string;
  nights?: number | null;
  rooms_data?: RoomData[] | null;
  guests_data?: GuestData[] | null;
  lead_guest_name?: string | null;
  lead_guest_email?: string | null;
  amount?: string | null;
  currency_code?: string | null;
  amount_refunded?: string | null;
  is_cancellable?: boolean | null;
  free_cancellation_before?: string | null;
  cancellation_policies?: CancellationPolicy[] | null;
  cancelled_at?: string | null;
  payment_type?: string | null;
  payment_status?: string | null;
  taxes?: TaxData[] | null;
  raw_api_response?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  last_synced_at?: string | null;
}

// Insert type for creating new bookings
export interface UserBookingInsert {
  user_id: string;
  order_id: string;
  partner_order_id?: string;
  order_group_id?: string;
  status?: string;
  confirmation_number?: string;
  hotel_id?: string;
  hotel_name?: string;
  hotel_address?: string;
  hotel_city?: string;
  hotel_country?: string;
  hotel_star_rating?: number;
  hotel_phone?: string;
  hotel_image?: string;
  check_in_date: string;
  check_out_date: string;
  nights?: number;
  rooms_data?: RoomData[];
  guests_data?: GuestData[];
  lead_guest_name?: string;
  lead_guest_email?: string;
  amount?: string;
  currency_code?: string;
  is_cancellable?: boolean;
  free_cancellation_before?: string;
  cancellation_policies?: CancellationPolicy[];
  payment_type?: string;
  payment_status?: string;
  taxes?: TaxData[];
  raw_api_response?: Record<string, unknown>;
}

// Transformed type for frontend use (matches existing UserBooking interface in MyBookingsPage)
export interface UserBooking {
  id: string;
  orderId: string;
  hotelName: string;
  hotelImage: string;
  hotelStars: number;
  city: string;
  country: string;
  address: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  roomCount: number;
  guests: {
    adults: number;
    children: number;
  };
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  paymentType: "prepaid" | "pay_at_hotel";
  cancellationPolicy: string;
  cancellationDeadline?: string;
  canCancel: boolean;
  confirmedAt?: string;
  createdAt: string;
  voucherUrl?: string;
}

// Helper to transform database row to frontend type
export function transformBookingRow(row: UserBookingRow): UserBooking {
  const checkOutDate = new Date(row.check_out_date);
  const now = new Date();
  
  const guests = row.guests_data || [];
  const adults = guests.filter(g => g.type === "adult").length || 2;
  const children = guests.filter(g => g.type === "child").length || 0;
  
  const rooms = row.rooms_data || [];
  const roomType = rooms[0]?.roomName || "Standard Room";
  const roomCount = rooms.reduce((sum, r) => sum + (r.quantity || 1), 0) || 1;
  
  const canCancel = row.status === "confirmed" && 
    !!row.free_cancellation_before &&
    new Date(row.free_cancellation_before) > now;
  
  // Map database status to frontend status
  let status: BookingStatus = row.status as BookingStatus;
  if (status === "confirmed" && checkOutDate < now) {
    status = "completed";
  }
  
  return {
    id: row.id,
    orderId: row.order_id,
    hotelName: row.hotel_name || "Unknown Hotel",
    hotelImage: row.hotel_image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
    hotelStars: row.hotel_star_rating || 4,
    city: row.hotel_city || "",
    country: row.hotel_country || "",
    address: row.hotel_address || "",
    checkIn: row.check_in_date,
    checkOut: row.check_out_date,
    nights: row.nights || Math.ceil((checkOutDate.getTime() - new Date(row.check_in_date).getTime()) / (1000 * 60 * 60 * 24)),
    roomType,
    roomCount,
    guests: { adults, children },
    status,
    totalAmount: parseFloat(row.amount || "0"),
    currency: row.currency_code || "USD",
    paymentType: row.payment_type === "hotel" ? "pay_at_hotel" : "prepaid",
    cancellationPolicy: row.cancellation_policies?.[0]?.description || "Check with hotel for cancellation policy",
    cancellationDeadline: row.free_cancellation_before || undefined,
    canCancel,
    confirmedAt: status === "confirmed" ? row.updated_at : undefined,
    createdAt: row.created_at,
    voucherUrl: status !== "cancelled" ? `/documents/voucher-${row.order_id}` : undefined,
  };
}
