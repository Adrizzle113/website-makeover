import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BookingStatus, PaymentStatus, InvoiceStatus, ReconciliationSeverity, ReconciliationStatus, PayoutStatus } from "@/types/reporting";

type StatusType = BookingStatus | PaymentStatus | InvoiceStatus | ReconciliationSeverity | ReconciliationStatus | PayoutStatus | string;

const statusStyles: Record<string, string> = {
  // Booking status
  confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  processing: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  failed: "bg-red-500/10 text-red-600 border-red-500/20",
  
  // Payment status
  collected: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  not_collected: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  pay_at_property: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  
  // Invoice status
  draft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  sent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  unpaid: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  partial: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-600 border-red-500/20",
  
  // Reconciliation severity
  low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  high: "bg-red-500/10 text-red-600 border-red-500/20",
  
  // Reconciliation status
  open: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  
  // Payout status
  available: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  
  // Payment ledger
  payment: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  refund: "bg-red-500/10 text-red-600 border-red-500/20",
  adjustment: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  
  // Generic
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  
  // Default
  default: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.default;
  const displayLabel = label || status.replace(/_/g, " ");
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium capitalize text-xs",
        style,
        className
      )}
    >
      {displayLabel}
    </Badge>
  );
}
