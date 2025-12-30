import {
  Calendar,
  MapPin,
  Users,
  Banknote,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Trip, Order } from "@/types/trips";
import { cn } from "@/lib/utils";

interface TripSummaryCardsProps {
  trip: Trip;
  orders: Order[];
  className?: string;
}

export function TripSummaryCards({
  trip,
  orders,
  className,
}: TripSummaryCardsProps) {
  // Calculate trip statistics
  const totalNights = orders.reduce((sum, order) => sum + order.nights, 0);
  const totalGuests = Math.max(
    ...orders.map((o) => o.occupancy.adults + o.occupancy.children)
  );
  const confirmedBookings = orders.filter((o) => o.status === "confirmed").length;

  const formatDateRange = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  const getDaysUntilTrip = () => {
    const now = new Date();
    const tripStart = new Date(trip.dateRange.checkIn);
    const diff = Math.ceil(
      (tripStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0) return "In progress";
    if (diff === 0) return "Starts today";
    if (diff === 1) return "Starts tomorrow";
    return `In ${diff} days`;
  };

  const cards = [
    {
      icon: Calendar,
      label: "Travel Dates",
      value: formatDateRange(trip.dateRange.checkIn, trip.dateRange.checkOut),
      subValue: `${totalNights} total nights`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: MapPin,
      label: "Destinations",
      value: trip.destinations.join(", "),
      subValue: `${orders.length} properties`,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Users,
      label: "Travelers",
      value: `${totalGuests} guest${totalGuests !== 1 ? "s" : ""}`,
      subValue: trip.clientName,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Banknote,
      label: "Total Value",
      value: `${trip.currency} ${trip.totalAmount.toLocaleString()}`,
      subValue: `${confirmedBookings} of ${orders.length} confirmed`,
      color: "text-sidebar-gold",
      bgColor: "bg-sidebar-gold/10",
    },
    {
      icon: Clock,
      label: "Trip Status",
      value: getDaysUntilTrip(),
      subValue: trip.status === "active" ? "Active booking" : trip.status,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4", className)}>
      {cards.map((card, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  card.bgColor
                )}
              >
                <card.icon className={cn("w-5 h-5", card.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                <p className="font-medium text-foreground text-sm leading-tight truncate">
                  {card.value}
                </p>
                {card.subValue && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {card.subValue}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
