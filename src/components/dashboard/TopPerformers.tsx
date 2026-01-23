import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUpIcon, TrendingDownIcon, StarIcon } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export function TopPerformers() {
  const { topHotels, topDestinations, isLoading } = useDashboardStats();

  const maxBookings = topHotels.length > 0 ? Math.max(...topHotels.map((h) => h.bookings)) : 1;
  const maxDestBookings = topDestinations.length > 0 ? Math.max(...topDestinations.map((d) => d.bookings)) : 1;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-[var(--shadow-card)]">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </CardContent>
        </Card>
        <Card className="border-none shadow-[var(--shadow-card)]">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Hotels */}
      <Card className="border-none shadow-[var(--shadow-card)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-lg text-foreground">
              Top Performing Hotels
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              All Time
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {topHotels.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hotel data available</p>
          ) : (
            topHotels.map((hotel, index) => (
              <div
                key={hotel.name}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <span className="text-lg font-heading text-muted-foreground w-6">
                  #{index + 1}
                </span>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {hotel.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {hotel.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{hotel.location}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <StarIcon className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium text-foreground">{hotel.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    {hotel.trend === "up" ? (
                      <TrendingUpIcon className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <TrendingDownIcon className="w-3 h-3 text-red-500" />
                    )}
                    <span className={`text-xs ${hotel.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                      {hotel.trendValue}
                    </span>
                  </div>
                </div>
                <div className="text-right w-20">
                  <p className="text-sm font-medium text-foreground">{hotel.bookings}</p>
                  <p className="text-xs text-muted-foreground">bookings</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Top Destinations */}
      <Card className="border-none shadow-[var(--shadow-card)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-lg text-foreground">
              Top Destinations
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              All Time
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {topDestinations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No destination data available</p>
          ) : (
            topDestinations.map((dest) => (
              <div
                key={dest.name}
                className="flex items-center gap-4"
              >
                <span className="text-2xl">{dest.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">
                      {dest.name}{dest.country ? `, ${dest.country}` : ""}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{dest.bookings}</span>
                      <span className="text-xs text-emerald-500 flex items-center gap-0.5">
                        <TrendingUpIcon className="w-3 h-3" />
                        {dest.growth}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(dest.bookings / maxDestBookings) * 100} 
                    className="h-1.5"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
