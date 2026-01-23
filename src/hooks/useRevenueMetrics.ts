import { useMemo } from "react";
import { useReportingBookings } from "./useReportingBookings";
import type { 
  ReportingFilters, 
  RevenueMetrics, 
  RevenueByCity, 
  RevenueByAgent, 
  TopHotel 
} from "@/types/reporting";

export interface HighCancellationHotel {
  hotelName: string;
  city: string;
  bookingsCount: number;
  cancellations: number;
  cancellationRate: number;
  lostRevenue: number;
  currency: string;
}

export interface UseRevenueMetricsResult {
  metrics: RevenueMetrics;
  revenueByCity: RevenueByCity[];
  revenueByAgent: RevenueByAgent[];
  topHotels: TopHotel[];
  highCancellationHotels: HighCancellationHotel[];
  isLoading: boolean;
  error: string | null;
}

export function useRevenueMetrics(filters?: ReportingFilters): UseRevenueMetricsResult {
  // Fetch bookings without status filter to get all bookings for calculations
  const filtersWithoutStatus = useMemo(() => {
    if (!filters) return undefined;
    const { status, ...rest } = filters;
    return rest;
  }, [filters]);
  
  const { bookings, isLoading, error } = useReportingBookings(filtersWithoutStatus);

  // Calculate main metrics
  const metrics = useMemo<RevenueMetrics>(() => {
    if (!bookings.length) {
      return {
        grossSales: 0,
        supplierCost: 0,
        margin: 0,
        marginPercent: 0,
        cancellationLosses: 0,
        currency: "USD",
      };
    }

    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const cancelled = bookings.filter((b) => b.status === "cancelled");

    const grossSales = confirmed.reduce((sum, b) => sum + b.clientTotal, 0);
    const supplierCost = confirmed.reduce((sum, b) => sum + b.supplierTotal, 0);
    const margin = confirmed.reduce((sum, b) => sum + b.margin, 0);
    const cancellationLosses = cancelled.reduce((sum, b) => sum + b.clientTotal, 0);
    const marginPercent = grossSales > 0 ? (margin / grossSales) * 100 : 0;

    // Get most common currency
    const currencyCounts: Record<string, number> = {};
    bookings.forEach((b) => {
      currencyCounts[b.currency] = (currencyCounts[b.currency] || 0) + 1;
    });
    const currency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "USD";

    return {
      grossSales,
      supplierCost,
      margin,
      marginPercent: Math.round(marginPercent * 10) / 10,
      cancellationLosses,
      currency,
    };
  }, [bookings]);

  // Calculate revenue by city
  const revenueByCity = useMemo<RevenueByCity[]>(() => {
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const cityMap = new Map<string, { 
      city: string; 
      country: string; 
      bookingsCount: number; 
      revenue: number; 
      margin: number 
    }>();

    confirmed.forEach((booking) => {
      const city = booking.city || "Unknown";
      const country = booking.country || "Unknown";
      const key = `${city}-${country}`;
      
      const existing = cityMap.get(key);
      if (existing) {
        existing.bookingsCount += 1;
        existing.revenue += booking.clientTotal;
        existing.margin += booking.margin;
      } else {
        cityMap.set(key, {
          city,
          country,
          bookingsCount: 1,
          revenue: booking.clientTotal,
          margin: booking.margin,
        });
      }
    });

    return Array.from(cityMap.values())
      .map((item) => ({ ...item, currency: metrics.currency }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [bookings, metrics.currency]);

  // Calculate revenue by agent (currently single-user, prepared for multi-agent)
  const revenueByAgent = useMemo<RevenueByAgent[]>(() => {
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const agentMap = new Map<string, { 
      agentId: string; 
      agentName: string; 
      bookingsCount: number; 
      revenue: number; 
      margin: number 
    }>();

    confirmed.forEach((booking) => {
      const agentId = booking.agentId || "current-user";
      const agentName = booking.agentName || "Current User";
      
      const existing = agentMap.get(agentId);
      if (existing) {
        existing.bookingsCount += 1;
        existing.revenue += booking.clientTotal;
        existing.margin += booking.margin;
      } else {
        agentMap.set(agentId, {
          agentId,
          agentName,
          bookingsCount: 1,
          revenue: booking.clientTotal,
          margin: booking.margin,
        });
      }
    });

    return Array.from(agentMap.values())
      .map((item) => ({ ...item, currency: metrics.currency }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [bookings, metrics.currency]);

  // Calculate top hotels by margin
  const topHotels = useMemo<TopHotel[]>(() => {
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const hotelMap = new Map<string, { 
      hotelName: string; 
      city: string; 
      bookingsCount: number; 
      revenue: number; 
      margin: number 
    }>();

    confirmed.forEach((booking) => {
      const hotelName = booking.hotel || "Unknown Hotel";
      const city = booking.city || "Unknown";
      
      const existing = hotelMap.get(hotelName);
      if (existing) {
        existing.bookingsCount += 1;
        existing.revenue += booking.clientTotal;
        existing.margin += booking.margin;
      } else {
        hotelMap.set(hotelName, {
          hotelName,
          city,
          bookingsCount: 1,
          revenue: booking.clientTotal,
          margin: booking.margin,
        });
      }
    });

    return Array.from(hotelMap.values())
      .map((item) => ({
        ...item,
        marginPercent: item.revenue > 0 ? Math.round((item.margin / item.revenue) * 100 * 10) / 10 : 0,
        currency: metrics.currency,
      }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 10);
  }, [bookings, metrics.currency]);

  // Calculate high cancellation hotels
  const highCancellationHotels = useMemo<HighCancellationHotel[]>(() => {
    const hotelStats = new Map<string, { 
      hotelName: string; 
      city: string; 
      total: number; 
      cancelled: number; 
      lostRevenue: number 
    }>();

    bookings.forEach((booking) => {
      const hotelName = booking.hotel || "Unknown Hotel";
      const city = booking.city || "Unknown";
      const isCancelled = booking.status === "cancelled";
      
      const existing = hotelStats.get(hotelName);
      if (existing) {
        existing.total += 1;
        if (isCancelled) {
          existing.cancelled += 1;
          existing.lostRevenue += booking.clientTotal;
        }
      } else {
        hotelStats.set(hotelName, {
          hotelName,
          city,
          total: 1,
          cancelled: isCancelled ? 1 : 0,
          lostRevenue: isCancelled ? booking.clientTotal : 0,
        });
      }
    });

    return Array.from(hotelStats.values())
      .filter((item) => item.cancelled > 0)
      .map((item) => ({
        hotelName: item.hotelName,
        city: item.city,
        bookingsCount: item.total,
        cancellations: item.cancelled,
        cancellationRate: Math.round((item.cancelled / item.total) * 100 * 10) / 10,
        lostRevenue: item.lostRevenue,
        currency: metrics.currency,
      }))
      .sort((a, b) => b.cancellationRate - a.cancellationRate)
      .slice(0, 10);
  }, [bookings, metrics.currency]);

  return {
    metrics,
    revenueByCity,
    revenueByAgent,
    topHotels,
    highCancellationHotels,
    isLoading,
    error,
  };
}
