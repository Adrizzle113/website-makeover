// Reporting Types

export type UserRole = "admin" | "agent" | "subagent";

export type BookingStatus = "confirmed" | "processing" | "cancelled" | "failed";
export type PaymentStatus = "collected" | "not_collected" | "pay_at_property";
export type PaymentType = "deposit" | "now_net" | "now_gross" | "hotel";
export type InvoiceStatus = "draft" | "sent" | "unpaid" | "partial" | "paid" | "overdue";
export type PaymentLedgerType = "payment" | "refund" | "adjustment";
export type PaymentMethod = "card" | "bank_transfer" | "payment_link";
export type ReconciliationSeverity = "low" | "medium" | "high";
export type ReconciliationStatus = "open" | "in_progress" | "resolved";
export type PayoutStatus = "available" | "pending" | "paid";

export interface ReportingBooking {
  id: string;
  etgOrderId: string;
  status: BookingStatus;
  leadGuest: string;
  guestEmail: string;
  hotel: string;
  city: string;
  country: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  clientTotal: number;
  supplierTotal: number;
  margin: number;
  marginPercent: number;
  currency: string;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  agentId?: string;
  agentName?: string;
  subagentId?: string;
  subagentName?: string;
  groupId?: string;
  groupName?: string;
  cancellationPolicy: string;
  cancellationDeadline?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface ReportingInvoice {
  id: string;
  groupId?: string;
  groupName?: string;
  clientName: string;
  bookingsCount: number;
  bookingIds: string[];
  totalDue: number;
  currency: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentLinkStatus?: "active" | "expired" | "used";
  createdAt: string;
  paidAt?: string;
}

export interface PaymentLedgerEntry {
  id: string;
  date: string;
  type: PaymentLedgerType;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference: string;
  referenceType: "invoice" | "booking";
  status: "pending" | "completed" | "failed";
  description?: string;
}

export interface ReconciliationItem {
  id: string;
  type: "price_mismatch" | "cancellation_mismatch" | "fx_mismatch" | "duplicate_status";
  bookingId?: string;
  invoiceId?: string;
  expected: number;
  actual: number;
  difference: number;
  currency: string;
  severity: ReconciliationSeverity;
  status: ReconciliationStatus;
  notes?: string;
  description: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface PayoutEntry {
  id: string;
  agentId: string;
  agentName: string;
  subagentId?: string;
  subagentName?: string;
  period: string;
  commissionEarned: number;
  adjustments: number;
  netPayout: number;
  currency: string;
  status: PayoutStatus;
  payoutMethod?: string;
  createdAt: string;
  paidAt?: string;
}

export interface ExportHistoryItem {
  id: string;
  dataset: "bookings" | "revenue" | "invoices" | "payments" | "payouts";
  format: "csv" | "excel";
  filters: string;
  dateRange: string;
  createdAt: string;
  downloadUrl?: string;
  status: "pending" | "completed" | "failed";
}

export interface SavedView {
  id: string;
  name: string;
  filters: ReportingFilters;
  createdAt: string;
  isDefault?: boolean;
}

export interface ReportingFilters {
  search?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  dateMode?: "created" | "checkin" | "checkout";
  status?: BookingStatus[];
  paymentType?: PaymentType[];
  paymentStatus?: PaymentStatus[];
  currency?: string;
  groupId?: string;
  agentId?: string;
  subagentId?: string;
}

export interface RevenueMetrics {
  grossSales: number;
  supplierCost: number;
  margin: number;
  marginPercent: number;
  cancellationLosses: number;
  currency: string;
}

export interface RevenueByCity {
  city: string;
  country: string;
  bookingsCount: number;
  revenue: number;
  margin: number;
  currency: string;
}

export interface RevenueByAgent {
  agentId: string;
  agentName: string;
  bookingsCount: number;
  revenue: number;
  margin: number;
  currency: string;
}

export interface TopHotel {
  hotelName: string;
  city: string;
  bookingsCount: number;
  revenue: number;
  margin: number;
  marginPercent: number;
  currency: string;
}
