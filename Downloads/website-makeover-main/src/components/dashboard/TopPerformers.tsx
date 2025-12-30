import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUpIcon, TrendingDownIcon, StarIcon } from "lucide-react";

interface TopHotel {
  id: string;
  name: string;
  location: string;
  bookings: number;
  revenue: number;
  rating: number;
  trend: "up" | "down";
  trendValue: number;
  image?: string;
}

interface TopDestination {
  id: string;
  name: string;
  country: string;
  bookings: number;
  growth: number;
  flag: string;
}

const topHotels: TopHotel[] = [
  {
    id: "1",
    name: "The Beverly Hills Hotel",
    location: "Los Angeles, USA",
    bookings: 89,
    revenue: 142500,
    rating: 4.9,
    trend: "up",
    trendValue: 12,
  },
  {
    id: "2",
    name: "The Ritz Paris",
    location: "Paris, France",
    bookings: 76,
    revenue: 128000,
    rating: 4.8,
    trend: "up",
    trendValue: 8,
  },
  {
    id: "3",
    name: "Marina Bay Sands",
    location: "Singapore",
    bookings: 64,
    revenue: 98500,
    rating: 4.7,
    trend: "down",
    trendValue: 3,
  },
  {
    id: "4",
    name: "Burj Al Arab",
    location: "Dubai, UAE",
    bookings: 52,
    revenue: 156000,
    rating: 4.9,
    trend: "up",
    trendValue: 15,
  },
];

const topDestinations: TopDestination[] = [
  { id: "1", name: "Paris", country: "France", bookings: 245, growth: 18, flag: "🇫🇷" },
  { id: "2", name: "Tokyo", country: "Japan", bookings: 189, growth: 12, flag: "🇯🇵" },
  { id: "3", name: "Dubai", country: "UAE", bookings: 156, growth: 24, flag: "🇦🇪" },
  { id: "4", name: "New York", country: "USA", bookings: 142, growth: 8, flag: "🇺🇸" },
  { id: "5", name: "Bali", country: "Indonesia", bookings: 128, growth: 32, flag: "🇮🇩" },
];

export function TopPerformers() {
  const maxBookings = Math.max(...topHotels.map((h) => h.bookings));
  const maxDestBookings = Math.max(...topDestinations.map((d) => d.bookings));

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
              This Month
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {topHotels.map((hotel, index) => (
            <div
              key={hotel.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <span className="text-lg font-heading text-muted-foreground w-6">
                #{index + 1}
              </span>
              <Avatar className="h-10 w-10">
                <AvatarImage src={hotel.image} />
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
                  <span className="text-sm font-medium text-foreground">{hotel.rating}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  {hotel.trend === "up" ? (
                    <TrendingUpIcon className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <TrendingDownIcon className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs ${hotel.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                    {hotel.trendValue}%
                  </span>
                </div>
              </div>
              <div className="text-right w-20">
                <p className="text-sm font-medium text-foreground">{hotel.bookings}</p>
                <p className="text-xs text-muted-foreground">bookings</p>
              </div>
            </div>
          ))}
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
              This Month
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {topDestinations.map((dest, index) => (
            <div
              key={dest.id}
              className="flex items-center gap-4"
            >
              <span className="text-2xl">{dest.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">
                    {dest.name}, {dest.country}
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
