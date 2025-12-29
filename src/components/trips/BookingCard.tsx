import { Link } from "react-router-dom";
import {
  Hotel,
  MapPin,
  Calendar,
  Users,
  FileText,
  ChevronRight,
  Star,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Order, OrderStatus } from "@/types/trips";
import { cn } from "@/lib/utils";

interface BookingCardProps {
  order: Order;
  variant?: "compact" | "detailed";
  showActions?: boolean;
  onClick?: () => void;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; icon: typeof AlertCircle }
> = {
  confirmed: {
    label: "Confirmed",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: Clock,
  },
  pending: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Clock,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: AlertCircle,
  },
  completed: {
    label: "Completed",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: Clock,
  },
};

export function BookingCard({
  order,
  variant = "detailed",
  showActions = true,
  onClick,
}: BookingCardProps) {
  const status = statusConfig[order.status];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (count: number) => {
    return Array.from({ length: count }, (_, i) => (
      <Star
        key={i}
        className="w-3 h-3 fill-sidebar-gold text-sidebar-gold"
      />
    ));
  };

  // Check if cancellation deadline is approaching (within 48 hours)
  const isCancellationSoon =
    order.cancellationDeadline &&
    new Date(order.cancellationDeadline).getTime() - Date.now() <
      48 * 60 * 60 * 1000 &&
    new Date(order.cancellationDeadline).getTime() > Date.now();

  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30",
          onClick && "cursor-pointer"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Hotel className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-foreground truncate">
                  {order.hotelName}
                </h4>
                <Badge variant="outline" className={cn("shrink-0", status.color)}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(order.checkIn)} - {formatDate(order.checkOut)} •{" "}
                {order.nights} nights
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-heading text-foreground">
                {order.currency} {order.totalAmount.toLocaleString()}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group transition-all duration-300 hover:shadow-lg",
        isCancellationSoon && "border-amber-500/50",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Cancellation warning banner */}
        {isCancellationSoon && (
          <div className="px-5 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-600 font-medium">
              Free cancellation ends soon
            </span>
          </div>
        )}

        <div className="p-5">
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Hotel image placeholder */}
            <div className="lg:w-48 h-32 lg:h-auto rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
              <Hotel className="w-12 h-12 text-muted-foreground/50" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-heading text-lg text-foreground">
                      {order.hotelName}
                    </h3>
                    <Badge variant="outline" className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-0.5">
                      {renderStars(order.hotelStars)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      • {order.hotelStars}-star hotel
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{order.hotelAddress}</span>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Check-in
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(order.checkIn)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Check-out
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(order.checkOut)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Hotel className="w-3 h-3" />
                    Room
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {order.roomType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Guests
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {order.occupancy.adults} adult
                    {order.occupancy.adults !== 1 ? "s" : ""}
                    {order.occupancy.children > 0 &&
                      `, ${order.occupancy.children} child`}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {order.nights} night{order.nights !== 1 ? "s" : ""}
                    </p>
                    <p className="font-heading text-xl text-foreground">
                      {order.currency} {order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  {order.documents.length > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>
                        {order.documents.length} document
                        {order.documents.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>

                {showActions && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/orders/${order.id}`}>View Details</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
