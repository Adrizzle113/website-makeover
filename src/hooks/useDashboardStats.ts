import { useMemo } from "react";
import { useReportingBookings, useBookingStats } from "./useReportingBookings";
import type { ReportingBooking } from "@/types/reporting";

export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export interface RecentBooking {
  id: string;
  hotel: string;
  guest: string;
  checkIn: string;
  total: string;
  status: "confirmed" | "processing" | "cancelled" | "completed";
}

export interface PipelineStage {
  id: string;
  name: string;
  count: number;
  value: number;
}

export interface ChartDataPoint {
  name: string;
  revenue: number;
  bookings: number;
  commission: number;
}

export interface TopHotel {
  name: string;
  location: string;
  bookings: number;
  revenue: number;
  rating: number;
  trend: "up" | "down" | "stable";
  trendValue: string;
}

export interface TopDestination {
  name: string;
  country: string;
  bookings: number;
  growth: number;
  flag: string;
}

export function useDashboardStats() {
  const { stats, isLoading: statsLoading } = useBookingStats();
  const { bookings, isLoading: bookingsLoading } = useReportingBookings();

  const isLoading = statsLoading || bookingsLoading;

  // Calculate dashboard stats
  const dashboardStats = useMemo((): DashboardStat[] => {
    if (!stats) {
      return [
        { title: "Total Revenue", value: "$0", change: "+0%", isPositive: true },
        { title: "Bookings", value: "0", change: "+0%", isPositive: true },
        { title: "Active Clients", value: "0", change: "+0%", isPositive: true },
        { title: "Commission", value: "$0", change: "+0%", isPositive: true },
      ];
    }

    // Count unique guests as clients
    const uniqueGuests = new Set(bookings.map((b) => b.guestEmail || b.leadGuest)).size;

    return [
      {
        title: "Total Revenue",
        value: `$${stats.totalRevenue.toLocaleString()}`,
        change: "+12.5%", // Would need historical data to calculate
        isPositive: true,
      },
      {
        title: "Bookings",
        value: stats.totalBookings.toString(),
        change: "+8.2%",
        isPositive: true,
      },
      {
        title: "Active Clients",
        value: uniqueGuests.toString(),
        change: "+5.1%",
        isPositive: true,
      },
      {
        title: "Commission",
        value: `$${stats.totalMargin.toLocaleString()}`,
        change: "+15.3%",
        isPositive: true,
      },
    ];
  }, [stats, bookings]);

  // Get recent bookings
  const recentBookings = useMemo((): RecentBooking[] => {
    return bookings.slice(0, 4).map((b) => ({
      id: b.id,
      hotel: b.hotel,
      guest: b.leadGuest,
      checkIn: b.checkIn,
      total: `${b.currency} ${b.clientTotal.toLocaleString()}`,
      status: b.status as RecentBooking["status"],
    }));
  }, [bookings]);

  // Calculate pipeline stages
  const pipelineStages = useMemo((): PipelineStage[] => {
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const processing = bookings.filter((b) => b.status === "processing");
    const cancelled = bookings.filter((b) => b.status === "cancelled");
    
    // Check-in dates to determine "upcoming" vs "completed"
    const now = new Date();
    const upcoming = confirmed.filter((b) => new Date(b.checkIn) > now);
    const completed = confirmed.filter((b) => new Date(b.checkOut) < now);
    const inProgress = confirmed.filter((b) => {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      return checkIn <= now && checkOut >= now;
    });

    return [
      {
        id: "pending",
        name: "Pending",
        count: processing.length,
        value: processing.reduce((sum, b) => sum + b.clientTotal, 0),
      },
      {
        id: "confirmed",
        name: "Confirmed",
        count: upcoming.length,
        value: upcoming.reduce((sum, b) => sum + b.clientTotal, 0),
      },
      {
        id: "in_progress",
        name: "In Progress",
        count: inProgress.length,
        value: inProgress.reduce((sum, b) => sum + b.clientTotal, 0),
      },
      {
        id: "completed",
        name: "Completed",
        count: completed.length,
        value: completed.reduce((sum, b) => sum + b.clientTotal, 0),
      },
    ];
  }, [bookings]);

  // Calculate chart data (group by month)
  const chartData = useMemo((): { monthly: ChartDataPoint[]; weekly: ChartDataPoint[] } => {
    if (bookings.length === 0) {
      return { monthly: [], weekly: [] };
    }

    // Group by month
    const monthlyData = new Map<string, { revenue: number; bookings: number; commission: number }>();
    
    bookings.forEach((b) => {
      const date = new Date(b.createdAt);
      const monthKey = date.toLocaleDateString("en-US", { month: "short" });
      
      const existing = monthlyData.get(monthKey) || { revenue: 0, bookings: 0, commission: 0 };
      monthlyData.set(monthKey, {
        revenue: existing.revenue + b.clientTotal,
        bookings: existing.bookings + 1,
        commission: existing.commission + b.margin,
      });
    });

    const monthly = Array.from(monthlyData.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));

    // For weekly, just use the last 4 entries or generate from bookings
    const weekly = monthly.slice(-4);

    return { monthly, weekly };
  }, [bookings]);

  // Calculate top hotels
  const topHotels = useMemo((): TopHotel[] => {
    const hotelStats = new Map<string, { bookings: number; revenue: number; city: string }>();

    bookings
      .filter((b) => b.status === "confirmed")
      .forEach((b) => {
        const existing = hotelStats.get(b.hotel) || { bookings: 0, revenue: 0, city: b.city };
        hotelStats.set(b.hotel, {
          bookings: existing.bookings + 1,
          revenue: existing.revenue + b.clientTotal,
          city: b.city,
        });
      });

    return Array.from(hotelStats.entries())
      .map(([name, data]) => ({
        name,
        location: data.city,
        bookings: data.bookings,
        revenue: data.revenue,
        rating: 4.5 + Math.random() * 0.5, // Placeholder rating
        trend: "up" as const,
        trendValue: "+5%",
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [bookings]);

  // Calculate top destinations
  const topDestinations = useMemo((): TopDestination[] => {
    const cityStats = new Map<string, { bookings: number; country: string }>();

    bookings
      .filter((b) => b.status === "confirmed")
      .forEach((b) => {
        const key = b.city || "Unknown";
        const existing = cityStats.get(key) || { bookings: 0, country: b.country || "" };
        cityStats.set(key, {
          bookings: existing.bookings + 1,
          country: b.country || existing.country,
        });
      });

    // Country to flag emoji mapping (simplified)
    const countryFlags: Record<string, string> = {
      USA: "🇺🇸",
      Japan: "🇯🇵",
      France: "🇫🇷",
      UK: "🇬🇧",
      Germany: "🇩🇪",
      Italy: "🇮🇹",
      Spain: "🇪🇸",
      Thailand: "🇹🇭",
      Singapore: "🇸🇬",
      UAE: "🇦🇪",
      China: "🇨🇳",
      Australia: "🇦🇺",
      Canada: "🇨🇦",
      Mexico: "🇲🇽",
      Brazil: "🇧🇷",
    };

    return Array.from(cityStats.entries())
      .map(([name, data]) => ({
        name,
        country: data.country,
        bookings: data.bookings,
        growth: Math.round(Math.random() * 30), // Placeholder growth
        flag: countryFlags[data.country] || "🌍",
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
  }, [bookings]);

  // Recent activity for pipeline
  const recentActivity = useMemo(() => {
    return bookings.slice(0, 4).map((b) => {
      let action = "New booking";
      let type: "new" | "confirmed" | "payment" | "cancelled" = "new";
      
      if (b.status === "confirmed") {
        action = "Confirmed";
        type = "confirmed";
      } else if (b.status === "cancelled") {
        action = "Cancellation";
        type = "cancelled";
      }
      
      if (b.paymentStatus === "collected") {
        action = "Payment received";
        type = "payment";
      }

      // Calculate relative time
      const createdAt = new Date(b.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let time = `${diffMins} min ago`;
      if (diffDays > 0) {
        time = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      } else if (diffHours > 0) {
        time = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      }

      return {
        id: b.id,
        action,
        hotel: b.hotel,
        time,
        type,
      };
    });
  }, [bookings]);

  return {
    isLoading,
    stats: dashboardStats,
    recentBookings,
    pipelineStages,
    chartData,
    topHotels,
    topDestinations,
    recentActivity,
    totalPipelineValue: pipelineStages.reduce((sum, s) => sum + s.value, 0),
    totalBookingsCount: bookings.length,
  };
}
