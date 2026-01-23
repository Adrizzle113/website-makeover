import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReportingBooking, ReportingFilters, BookingStatus, PaymentType, PaymentStatus } from "@/types/reporting";
import type { UserBookingRow, RoomData, CancellationPolicy } from "@/types/userBooking";

// Markup percentage for deriving supplier cost (since we don't store it)
const DEFAULT_MARKUP_PERCENT = 20;

// Extract room type from rooms_data JSON
function extractRoomType(roomsData: unknown): string {
  if (!roomsData || !Array.isArray(roomsData) || roomsData.length === 0) {
    return "Standard Room";
  }
  const rooms = roomsData as RoomData[];
  return rooms[0]?.roomName || "Standard Room";
}

// Extract cancellation policy description
function extractCancellationPolicy(row: UserBookingRow): string {
  if (row.free_cancellation_before) {
    const deadline = new Date(row.free_cancellation_before);
    return `Free cancellation until ${deadline.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    })}`;
  }
  
  if (row.cancellation_policies && Array.isArray(row.cancellation_policies)) {
    const policies = row.cancellation_policies as CancellationPolicy[];
    if (policies.length > 0 && policies[0].description) {
      return policies[0].description;
    }
  }
  
  return "Check with hotel for cancellation policy";
}

// Calculate supplier cost (derived from client total using markup)
function calculateSupplierCost(amount: string | null): number {
  const clientTotal = parseFloat(amount || "0");
  // Assuming 20% markup, supplier cost = clientTotal / 1.20
  return Math.round(clientTotal / (1 + DEFAULT_MARKUP_PERCENT / 100) * 100) / 100;
}

// Calculate margin
function calculateMargin(amount: string | null): number {
  const clientTotal = parseFloat(amount || "0");
  const supplierCost = calculateSupplierCost(amount);
  return Math.round((clientTotal - supplierCost) * 100) / 100;
}

// Map DB status to reporting status
function mapStatus(status: string): BookingStatus {
  const statusMap: Record<string, BookingStatus> = {
    confirmed: "confirmed",
    pending: "processing",
    processing: "processing",
    cancelled: "cancelled",
    completed: "confirmed", // Completed bookings show as confirmed in reports
    failed: "failed",
  };
  return statusMap[status] || "processing";
}

// Map payment type
function mapPaymentType(paymentType: string | null): PaymentType {
  const typeMap: Record<string, PaymentType> = {
    prepaid: "now_net",
    now_net: "now_net",
    now_gross: "now_gross",
    deposit: "deposit",
    hotel: "hotel",
    pay_at_hotel: "hotel",
  };
  return typeMap[paymentType || ""] || "now_net";
}

// Map payment status
function mapPaymentStatus(paymentStatus: string | null, paymentType: string | null): PaymentStatus {
  if (paymentType === "hotel" || paymentType === "pay_at_hotel") {
    return "pay_at_property";
  }
  
  const statusMap: Record<string, PaymentStatus> = {
    collected: "collected",
    paid: "collected",
    completed: "collected",
    not_collected: "not_collected",
    pending: "not_collected",
    pay_at_property: "pay_at_property",
  };
  return statusMap[paymentStatus || ""] || "not_collected";
}

// Transform database row to ReportingBooking
function transformBooking(row: UserBookingRow): ReportingBooking {
  const clientTotal = parseFloat(row.amount || "0");
  const supplierTotal = calculateSupplierCost(row.amount);
  const margin = calculateMargin(row.amount);
  
  return {
    id: row.partner_order_id || row.id,
    etgOrderId: row.order_id,
    status: mapStatus(row.status),
    leadGuest: row.lead_guest_name || "Guest",
    guestEmail: row.lead_guest_email || "",
    hotel: row.hotel_name || "Unknown Hotel",
    city: row.hotel_city || "",
    country: row.hotel_country || "",
    checkIn: row.check_in_date,
    checkOut: row.check_out_date,
    nights: row.nights || Math.ceil(
      (new Date(row.check_out_date).getTime() - new Date(row.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
    ),
    roomType: extractRoomType(row.rooms_data),
    clientTotal,
    supplierTotal,
    margin,
    marginPercent: clientTotal > 0 ? Math.round((margin / clientTotal) * 100) : 0,
    currency: row.currency_code || "USD",
    paymentType: mapPaymentType(row.payment_type),
    paymentStatus: mapPaymentStatus(row.payment_status, row.payment_type),
    cancellationPolicy: extractCancellationPolicy(row),
    cancellationDeadline: row.free_cancellation_before || undefined,
    createdAt: row.created_at,
    confirmedAt: row.status === "confirmed" ? row.updated_at : undefined,
  };
}

interface UseReportingBookingsResult {
  bookings: ReportingBooking[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReportingBookings(filters?: ReportingFilters): UseReportingBookingsResult {
  const [rawBookings, setRawBookings] = useState<ReportingBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("user_bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (queryError) {
        throw queryError;
      }

      const transformed = (data || []).map((row) => transformBooking(row as unknown as UserBookingRow));
      setRawBookings(transformed);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Apply client-side filters
  const filteredBookings = useMemo(() => {
    if (!filters) return rawBookings;

    return rawBookings.filter((booking) => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch =
          booking.id.toLowerCase().includes(search) ||
          booking.etgOrderId.toLowerCase().includes(search) ||
          booking.leadGuest.toLowerCase().includes(search) ||
          booking.hotel.toLowerCase().includes(search) ||
          booking.city.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status?.length && !filters.status.includes(booking.status)) {
        return false;
      }

      // Payment type filter
      if (filters.paymentType?.length && !filters.paymentType.includes(booking.paymentType)) {
        return false;
      }

      // Payment status filter
      if (filters.paymentStatus?.length && !filters.paymentStatus.includes(booking.paymentStatus)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange?.from && filters.dateRange?.to) {
        const dateField = filters.dateMode === "checkin" 
          ? booking.checkIn 
          : filters.dateMode === "checkout" 
            ? booking.checkOut 
            : booking.createdAt;
        
        const bookingDate = new Date(dateField);
        const fromDate = new Date(filters.dateRange.from);
        const toDate = new Date(filters.dateRange.to);
        
        if (bookingDate < fromDate || bookingDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [rawBookings, filters]);

  return {
    bookings: filteredBookings,
    isLoading,
    error,
    refetch: fetchBookings,
  };
}

// Export aggregate stats for dashboard
export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  processingBookings: number;
  totalRevenue: number;
  totalMargin: number;
  currency: string;
}

export function useBookingStats(): { stats: BookingStats | null; isLoading: boolean } {
  const { bookings, isLoading } = useReportingBookings();

  const stats = useMemo(() => {
    if (isLoading || bookings.length === 0) return null;

    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const cancelled = bookings.filter((b) => b.status === "cancelled");
    const processing = bookings.filter((b) => b.status === "processing");

    // Use the most common currency
    const currencyCounts = bookings.reduce((acc, b) => {
      acc[b.currency] = (acc[b.currency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const primaryCurrency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "USD";

    // Sum only confirmed bookings for revenue
    const totalRevenue = confirmed.reduce((sum, b) => sum + b.clientTotal, 0);
    const totalMargin = confirmed.reduce((sum, b) => sum + b.margin, 0);

    return {
      totalBookings: bookings.length,
      confirmedBookings: confirmed.length,
      cancelledBookings: cancelled.length,
      processingBookings: processing.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalMargin: Math.round(totalMargin * 100) / 100,
      currency: primaryCurrency,
    };
  }, [bookings, isLoading]);

  return { stats, isLoading };
}
