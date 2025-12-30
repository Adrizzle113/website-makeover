import { format } from "date-fns";
import { XIcon, ExternalLinkIcon, DownloadIcon, CalendarIcon, UserIcon, HotelIcon, CreditCardIcon, FileTextIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ReportingBooking, BookingStatus, PaymentStatus } from "@/types/reporting";

interface BookingDrawerProps {
  booking: ReportingBooking | null;
  open: boolean;
  onClose: () => void;
}

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  processing: { label: "Processing", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  cancelled: { label: "Cancelled", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  failed: { label: "Failed", className: "bg-red-500/10 text-red-600 border-red-500/20" },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  collected: { label: "Collected", className: "bg-emerald-500/10 text-emerald-600" },
  not_collected: { label: "Not Collected", className: "bg-amber-500/10 text-amber-600" },
  pay_at_property: { label: "Pay at Property", className: "bg-blue-500/10 text-blue-600" },
};

// Mock audit log
const mockAuditLog = [
  { id: "1", action: "Booking created", timestamp: "2025-01-05T10:30:00Z", actor: "System" },
  { id: "2", action: "Payment authorized", timestamp: "2025-01-05T10:31:00Z", actor: "System" },
  { id: "3", action: "Confirmed by supplier", timestamp: "2025-01-05T10:35:00Z", actor: "Supplier" },
  { id: "4", action: "Voucher issued", timestamp: "2025-01-05T10:36:00Z", actor: "System" },
];

export function BookingDrawer({ booking, open, onClose }: BookingDrawerProps) {
  if (!booking) return null;

  const statusStyle = statusConfig[booking.status];
  const paymentStatusStyle = paymentStatusConfig[booking.paymentStatus];
  const serviceFee = booking.margin * 0.1; // Mock 10% service fee
  const markup = booking.margin - serviceFee;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Booking Details</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("font-medium", statusStyle.className)}>
              {statusStyle.label}
            </Badge>
            <span className="text-sm text-muted-foreground">#{booking.id}</span>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* IDs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Internal ID</p>
              <p className="font-mono text-sm">{booking.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">ETG Order ID</p>
              <p className="font-mono text-sm">{booking.etgOrderId}</p>
            </div>
          </div>

          <Separator />

          {/* Hotel Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HotelIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">Property</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium">{booking.hotel}</p>
              <p className="text-sm text-muted-foreground">{booking.city}, {booking.country}</p>
              <p className="text-sm text-muted-foreground mt-1">{booking.roomType}</p>
            </div>
          </div>

          {/* Dates */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">Stay Details</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Check-in</p>
                <p className="text-sm font-medium">{format(new Date(booking.checkIn), "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Check-out</p>
                <p className="text-sm font-medium">{format(new Date(booking.checkOut), "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nights</p>
                <p className="text-sm font-medium">{booking.nights}</p>
              </div>
            </div>
          </div>

          {/* Guest Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">Guest</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium">{booking.leadGuest}</p>
              <p className="text-sm text-muted-foreground">{booking.guestEmail}</p>
            </div>
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCardIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">Price Breakdown</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Supplier Total (ETG)</span>
                <span className="font-mono">{booking.currency} {booking.supplierTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Markup</span>
                <span className="font-mono">{booking.currency} {markup.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-mono">{booking.currency} {serviceFee.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Client Total</span>
                <span className="font-mono">{booking.currency} {booking.clientTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Margin</span>
                <span className="font-mono">{booking.currency} {booking.margin.toLocaleString()} ({booking.marginPercent.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Status</span>
              <Badge variant="secondary" className={paymentStatusStyle.className}>
                {paymentStatusStyle.label}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">Payment Type</span>
              <span className="text-sm capitalize">{booking.paymentType.replace("_", " ")}</span>
            </div>
          </div>

          <Separator />

          {/* Cancellation Policy */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileTextIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">Cancellation Policy</h3>
            </div>
            <p className="text-sm text-muted-foreground">{booking.cancellationPolicy}</p>
            {booking.cancellationDeadline && (
              <p className="text-sm mt-2">
                <span className="text-muted-foreground">Deadline: </span>
                <span className="font-medium">{format(new Date(booking.cancellationDeadline), "MMM d, yyyy 'at' HH:mm")}</span>
              </p>
            )}
          </div>

          <Separator />

          {/* Audit Log */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ClockIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">Activity Log</h3>
            </div>
            <div className="space-y-3">
              {mockAuditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">{entry.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.actor} • {format(new Date(entry.timestamp), "MMM d, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2">
              <DownloadIcon className="w-4 h-4" />
              Voucher
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <ExternalLinkIcon className="w-4 h-4" />
              Invoice
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
