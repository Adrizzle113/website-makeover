import { MapPin, Calendar, Clock, Plane, Hotel, CheckCircle2, DownloadIcon, Loader2Icon } from "lucide-react";
import { Order } from "@/types/trips";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface TripTimelineProps {
  orders: Order[];
  className?: string;
  onDownloadVoucher?: (orderId: string, hotelName: string) => void;
  downloadingVoucher?: string | null;
}

export function TripTimeline({ orders, className, onDownloadVoucher, downloadingVoucher }: TripTimelineProps) {
  // Sort orders by check-in date
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-500";
      case "pending":
        return "bg-amber-500";
      case "cancelled":
        return "bg-red-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />

      <div className="space-y-0">
        {sortedOrders.map((order, index) => {
          const isFirst = index === 0;
          const isLast = index === sortedOrders.length - 1;
          const prevOrder = index > 0 ? sortedOrders[index - 1] : null;

          // Check if there's a travel gap between stays
          const hasGap =
            prevOrder &&
            new Date(order.checkIn).getTime() >
              new Date(prevOrder.checkOut).getTime();

          return (
            <div key={order.id}>
              {/* Travel indicator between stays */}
              {hasGap && (
                <div className="relative flex items-center gap-4 py-4 pl-3">
                  <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center z-10">
                    <Plane className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="text-sm text-muted-foreground italic">
                    Travel to {order.city}
                  </div>
                </div>
              )}

              {/* Stay card */}
              <div className="relative flex gap-4 pb-8">
                {/* Timeline node */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                      order.status === "confirmed"
                        ? "bg-primary text-primary-foreground"
                        : order.status === "cancelled"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Hotel className="w-5 h-5" />
                  </div>
                  {/* Status indicator */}
                  <div
                    className={cn(
                      "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                      getStatusColor(order.status)
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-heading text-base text-foreground line-clamp-1">
                          {order.hotelName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>
                            {order.city}, {order.country}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-heading text-lg text-foreground">
                          {order.currency} {order.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.nights} night{order.nights !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Date bar */}
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium">
                          {formatDate(order.checkIn)}
                        </span>
                      </div>
                      <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">
                          {formatDate(order.checkOut)}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Room info */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{order.roomType}</span>
                        <span>•</span>
                        <span>
                          {order.occupancy.adults} adult
                          {order.occupancy.adults !== 1 ? "s" : ""}
                          {order.occupancy.children > 0 &&
                            `, ${order.occupancy.children} child${
                              order.occupancy.children !== 1 ? "ren" : ""
                            }`}
                        </span>
                      </div>
                      {onDownloadVoucher && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownloadVoucher(order.id, order.hotelName)}
                          disabled={downloadingVoucher === order.id}
                        >
                          {downloadingVoucher === order.id ? (
                            <Loader2Icon className="w-4 h-4 animate-spin" />
                          ) : (
                            <DownloadIcon className="w-4 h-4" />
                          )}
                          <span className="ml-1.5">Voucher</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* End marker */}
        <div className="relative flex items-center gap-4 pl-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center z-10">
            <CheckCircle2 className="w-3 h-3 text-primary" />
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Trip ends
          </div>
        </div>
      </div>
    </div>
  );
}
