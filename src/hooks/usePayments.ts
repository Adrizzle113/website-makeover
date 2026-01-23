import { useMemo } from "react";
import { useReportingBookings } from "./useReportingBookings";
import type { ReportingFilters, PaymentLedgerEntry, PaymentLedgerType, PaymentMethod } from "@/types/reporting";

export interface PaymentTotals {
  totalPayments: number;
  totalRefunds: number;
  totalAdjustments: number;
  netTotal: number;
  currency: string;
}

export interface UsePaymentsResult {
  payments: PaymentLedgerEntry[];
  totals: PaymentTotals;
  isLoading: boolean;
  error: string | null;
}

/**
 * Generates payment ledger entries from bookings.
 * Each confirmed booking with "collected" payment status generates a payment entry.
 * Cancelled bookings with refunds generate refund entries.
 */
export function usePayments(filters?: ReportingFilters): UsePaymentsResult {
  const { bookings, isLoading, error } = useReportingBookings(filters);

  const payments = useMemo<PaymentLedgerEntry[]>(() => {
    if (!bookings.length) return [];

    const entries: PaymentLedgerEntry[] = [];

    bookings.forEach((booking, index) => {
      // Determine payment method based on payment type
      let method: PaymentMethod = "card";
      if (booking.paymentType === "deposit") {
        method = "bank_transfer";
      } else if (booking.paymentType === "now_net" || booking.paymentType === "now_gross") {
        method = "card";
      } else if (booking.paymentType === "hotel") {
        method = "payment_link"; // Pay at property - no actual payment
      }

      // Create payment entry for collected payments
      if (booking.paymentStatus === "collected" && booking.status !== "cancelled") {
        entries.push({
          id: `PAY-${String(index + 1).padStart(3, "0")}`,
          date: booking.confirmedAt || booking.createdAt,
          type: "payment" as PaymentLedgerType,
          amount: booking.clientTotal,
          currency: booking.currency,
          method,
          reference: booking.etgOrderId,
          referenceType: "booking",
          status: "completed",
          description: `Payment for booking ${booking.etgOrderId} - ${booking.hotel}`,
        });
      }

      // Create refund entry for cancelled bookings
      if (booking.status === "cancelled") {
        entries.push({
          id: `REF-${String(index + 1).padStart(3, "0")}`,
          date: booking.createdAt, // Would be cancellation date in real implementation
          type: "refund" as PaymentLedgerType,
          amount: -booking.clientTotal, // Negative for refunds
          currency: booking.currency,
          method,
          reference: booking.etgOrderId,
          referenceType: "booking",
          status: "completed",
          description: `Refund for cancelled booking ${booking.etgOrderId}`,
        });
      }

      // Pending payments (not yet collected)
      if (booking.paymentStatus === "not_collected" && booking.status === "confirmed") {
        entries.push({
          id: `PND-${String(index + 1).padStart(3, "0")}`,
          date: booking.createdAt,
          type: "payment" as PaymentLedgerType,
          amount: booking.clientTotal,
          currency: booking.currency,
          method,
          reference: booking.etgOrderId,
          referenceType: "booking",
          status: "pending",
          description: `Pending payment for ${booking.hotel}`,
        });
      }

      // Pay at property entries
      if (booking.paymentStatus === "pay_at_property" && booking.status === "confirmed") {
        entries.push({
          id: `PAP-${String(index + 1).padStart(3, "0")}`,
          date: booking.checkIn, // Payment expected at check-in
          type: "payment" as PaymentLedgerType,
          amount: booking.clientTotal,
          currency: booking.currency,
          method: "payment_link",
          reference: booking.etgOrderId,
          referenceType: "booking",
          status: "pending",
          description: `Pay at property - ${booking.hotel}`,
        });
      }
    });

    // Sort by date descending
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings]);

  // Calculate totals from completed transactions
  const totals = useMemo<PaymentTotals>(() => {
    let totalPayments = 0;
    let totalRefunds = 0;
    let totalAdjustments = 0;

    const completedPayments = payments.filter((p) => p.status === "completed");

    completedPayments.forEach((p) => {
      if (p.type === "payment") {
        totalPayments += p.amount;
      } else if (p.type === "refund") {
        totalRefunds += Math.abs(p.amount);
      } else if (p.type === "adjustment") {
        totalAdjustments += p.amount;
      }
    });

    // Get most common currency
    const currencyCounts: Record<string, number> = {};
    payments.forEach((p) => {
      currencyCounts[p.currency] = (currencyCounts[p.currency] || 0) + 1;
    });
    const currency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "USD";

    return {
      totalPayments,
      totalRefunds,
      totalAdjustments,
      netTotal: totalPayments - totalRefunds + totalAdjustments,
      currency,
    };
  }, [payments]);

  return {
    payments,
    totals,
    isLoading,
    error,
  };
}
