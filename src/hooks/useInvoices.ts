import { useMemo } from "react";
import { useReportingBookings } from "./useReportingBookings";
import type { ReportingFilters, ReportingInvoice, InvoiceStatus } from "@/types/reporting";

export interface UseInvoicesResult {
  invoices: ReportingInvoice[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generates invoice data from bookings.
 * Currently creates one invoice per booking since we don't have invoice grouping.
 * In the future, bookings could be grouped by order_group_id or client.
 */
export function useInvoices(filters?: ReportingFilters): UseInvoicesResult {
  const { bookings, isLoading, error, refetch } = useReportingBookings(filters);

  const invoices = useMemo<ReportingInvoice[]>(() => {
    if (!bookings.length) return [];

    // Group bookings by order_group_id if available, otherwise each booking is its own invoice
    const invoiceMap = new Map<string, {
      bookings: typeof bookings;
      groupId?: string;
    }>();

    bookings.forEach((booking) => {
      // Use a unique key - in the future this could be order_group_id for grouping
      const key = booking.id; // Each booking as separate invoice for now
      
      const existing = invoiceMap.get(key);
      if (existing) {
        existing.bookings.push(booking);
      } else {
        invoiceMap.set(key, {
          bookings: [booking],
          groupId: undefined,
        });
      }
    });

    return Array.from(invoiceMap.entries()).map(([key, data], index) => {
      const firstBooking = data.bookings[0];
      const totalDue = data.bookings.reduce((sum, b) => sum + b.clientTotal, 0);
      const bookingIds = data.bookings.map((b) => b.etgOrderId);
      
      // Determine invoice status based on booking status and payment status
      let status: InvoiceStatus = "draft";
      const paymentStatus = firstBooking.paymentStatus;
      const bookingStatus = firstBooking.status;
      
      if (bookingStatus === "cancelled") {
        status = "paid"; // Cancelled bookings are considered settled
      } else if (paymentStatus === "collected") {
        status = "paid";
      } else if (paymentStatus === "pay_at_property") {
        status = "unpaid";
      } else {
        // Check if overdue (due date in the past)
        const dueDate = new Date(firstBooking.checkIn);
        dueDate.setDate(dueDate.getDate() - 7); // Due 7 days before check-in
        
        if (dueDate < new Date()) {
          status = "overdue";
        } else {
          status = "sent";
        }
      }

      // Generate invoice number
      const year = new Date(firstBooking.createdAt).getFullYear();
      const invoiceNumber = `INV-${year}-${String(index + 1).padStart(3, "0")}`;
      
      // Calculate due date (7 days before check-in or creation date + 14 days)
      const checkInDate = new Date(firstBooking.checkIn);
      const dueDate = new Date(checkInDate);
      dueDate.setDate(dueDate.getDate() - 7);
      
      // If due date is in the past, use creation date + 14 days
      const createdDate = new Date(firstBooking.createdAt);
      const fallbackDue = new Date(createdDate);
      fallbackDue.setDate(fallbackDue.getDate() + 14);
      
      const finalDueDate = dueDate > new Date() ? dueDate : fallbackDue;

      return {
        id: invoiceNumber,
        groupId: data.groupId,
        groupName: firstBooking.hotel || "Direct Booking",
        clientName: firstBooking.leadGuest,
        bookingsCount: data.bookings.length,
        bookingIds,
        totalDue,
        currency: firstBooking.currency,
        dueDate: finalDueDate.toISOString().split("T")[0],
        status,
        paymentLinkStatus: status === "paid" ? undefined : 
          (status === "overdue" ? "expired" : "active") as "active" | "expired" | "used" | undefined,
        createdAt: firstBooking.createdAt,
        paidAt: status === "paid" ? firstBooking.confirmedAt : undefined,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings]);

  return {
    invoices,
    isLoading,
    error,
    refetch,
  };
}
