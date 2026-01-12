import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, isPast, isFuture, isToday, isWithinInterval } from "date-fns";
import {
  CalendarIcon,
  SearchIcon,
  XIcon,
  MapPinIcon,
  DownloadIcon,
  XCircleIcon,
  ChevronRightIcon,
  HotelIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Loader2Icon,
  RefreshCwIcon,
  RefreshCcwIcon,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CancellationModal } from "@/components/booking/CancellationModal";
import { bookingApi } from "@/services/bookingApi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserBookings, syncBookingFromApi, isUserAuthenticated } from "@/lib/bookingStorage";
import type { UserBooking, BookingStatus } from "@/types/userBooking";


const SAVED_ORDERS_KEY = "my_booking_order_ids";

// Get saved order IDs from localStorage
function getSavedOrderIds(): string[] {
  try {
    const saved = localStorage.getItem(SAVED_ORDERS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Save order IDs to localStorage
function saveOrderIds(ids: string[]) {
  localStorage.setItem(SAVED_ORDERS_KEY, JSON.stringify(ids));
}

// Map API status to our BookingStatus type
function mapApiStatus(apiStatus: string, checkOutDate: Date): BookingStatus {
  switch (apiStatus) {
    case "confirmed":
      return isPast(checkOutDate) ? "completed" : "confirmed";
    case "cancelled":
    case "failed":
      return "cancelled";
    case "processing":
    case "prebooked":
    case "idle":
      return "pending";
    default:
      return "pending";
  }
}

const statusConfig: Record<BookingStatus, { label: string; className: string; icon: React.ElementType }> = {
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: CheckCircleIcon,
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: ClockIcon,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: XCircleIcon,
  },
  completed: {
    label: "Completed",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: CheckCircleIcon,
  },
};

type TabFilter = "all" | "upcoming" | "past" | "cancelled";

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [sortBy, setSortBy] = useState<string>("check_in_asc");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<UserBooking | null>(null);
  const [downloadingVoucher, setDownloadingVoucher] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [currentPage, setCurrentPage] = useState(1);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const itemsPerPage = 5;

  // Fetch a single booking from API
  const fetchBookingFromApi = useCallback(async (orderId: string): Promise<UserBooking | null> => {
    try {
      const [orderInfoResponse, orderStatusResponse] = await Promise.all([
        bookingApi.getOrderInfo(orderId),
        bookingApi.getOrderStatus(orderId)
      ]);

      if (orderInfoResponse.status !== "ok" || !orderInfoResponse.data) {
        console.warn(`Failed to fetch order ${orderId}:`, orderInfoResponse.error);
        return null;
      }

      const apiData = orderInfoResponse.data;
      const statusData = orderStatusResponse.data;

      // Calculate nights
      const checkInDate = new Date(apiData.dates.check_in);
      const checkOutDate = new Date(apiData.dates.check_out);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

      const booking: UserBooking = {
        id: `bk-${apiData.order_id}`,
        orderId: apiData.order_id,
        hotelName: apiData.hotel.name,
        hotelImage: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400`, // Placeholder image
        hotelStars: apiData.hotel.star_rating || 4,
        city: apiData.hotel.city,
        country: apiData.hotel.country,
        address: apiData.hotel.address,
        checkIn: apiData.dates.check_in,
        checkOut: apiData.dates.check_out,
        nights: nights,
        roomType: apiData.room.name,
        roomCount: 1,
        guests: {
          adults: apiData.room.guests?.filter(g => !g.is_child).length || 2,
          children: apiData.room.guests?.filter(g => g.is_child).length || 0
        },
        status: mapApiStatus(apiData.status, checkOutDate),
        totalAmount: parseFloat(apiData.price.amount),
        currency: apiData.price.currency_code,
        paymentType: apiData.payment.type === "hotel" ? "pay_at_hotel" : "prepaid",
        cancellationPolicy: apiData.cancellation_policy || "Check with hotel for cancellation policy",
        cancellationDeadline: statusData?.cancellation_info?.free_cancellation_before,
        canCancel: apiData.status === "confirmed" && 
          !!statusData?.cancellation_info?.free_cancellation_before &&
          isFuture(new Date(statusData.cancellation_info.free_cancellation_before)),
        confirmedAt: apiData.status === "confirmed" ? apiData.updated_at : undefined,
        createdAt: apiData.created_at,
        voucherUrl: apiData.status === "confirmed" ? `/documents/voucher-${apiData.order_id}` : undefined
      };

      return booking;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      return null;
    }
  }, []);

  // Fetch all bookings
  const fetchAllBookings = useCallback(async (orderIds: string[]) => {
    if (orderIds.length === 0) {
      setBookings([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const bookingPromises = orderIds.map(id => fetchBookingFromApi(id));
    const results = await Promise.all(bookingPromises);
    const validBookings = results.filter((b): b is UserBooking => b !== null);
    
    setBookings(validBookings);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [fetchBookingFromApi]);

  // Initial load
  useEffect(() => {
    const savedOrderIds = getSavedOrderIds();
    fetchAllBookings(savedOrderIds);
  }, [fetchAllBookings]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const savedOrderIds = getSavedOrderIds();
    await fetchAllBookings(savedOrderIds);
    toast.success("Bookings refreshed");
  };

  // Add new order ID
  const handleAddOrderId = async () => {
    const trimmedId = orderIdInput.trim();
    if (!trimmedId) return;

    const savedOrderIds = getSavedOrderIds();
    if (savedOrderIds.includes(trimmedId)) {
      toast.error("Order already added");
      return;
    }

    setIsAddingOrder(true);
    const booking = await fetchBookingFromApi(trimmedId);
    
    if (booking) {
      const newOrderIds = [...savedOrderIds, trimmedId];
      saveOrderIds(newOrderIds);
      setBookings(prev => [...prev, booking]);
      setOrderIdInput("");
      toast.success("Booking added successfully");
    } else {
      toast.error("Could not find booking with that order ID");
    }
    
    setIsAddingOrder(false);
  };

  // Filter bookings based on tab, search, and date range
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          booking.hotelName.toLowerCase().includes(search) ||
          booking.city.toLowerCase().includes(search) ||
          booking.country.toLowerCase().includes(search) ||
          booking.orderId.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Tab filter
      const checkInDate = new Date(booking.checkIn);
      const checkOutDate = new Date(booking.checkOut);

      // Date range filter
      if (dateRange.from && dateRange.to) {
        if (!isWithinInterval(checkInDate, { start: dateRange.from, end: dateRange.to })) {
          return false;
        }
      }

      switch (activeTab) {
        case "upcoming":
          return (
            booking.status !== "cancelled" &&
            (isFuture(checkInDate) || isToday(checkInDate) || (isPast(checkInDate) && isFuture(checkOutDate)))
          );
        case "past":
          return booking.status === "completed" || (booking.status !== "cancelled" && isPast(checkOutDate));
        case "cancelled":
          return booking.status === "cancelled";
        default:
          return true;
      }
    });
  }, [bookings, searchQuery, activeTab, dateRange]);

  // Sort bookings
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      switch (sortBy) {
        case "check_in_asc":
          return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
        case "check_in_desc":
          return new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime();
        case "created_desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "amount_desc":
          return b.totalAmount - a.totalAmount;
        default:
          return 0;
      }
    });
  }, [filteredBookings, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);
  const paginatedBookings = sortedBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportBookings = () => {
    const csvContent = [
      ["Order ID", "Hotel", "City", "Check-in", "Check-out", "Nights", "Status", "Amount", "Currency"],
      ...sortedBookings.map(b => [
        b.orderId, b.hotelName, b.city, b.checkIn, b.checkOut, b.nights, b.status, b.totalAmount, b.currency
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-bookings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Export complete", { description: `${sortedBookings.length} bookings exported.` });
  };

  const handleCancelClick = (booking: UserBooking, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookingToCancel(booking);
    setCancelDialogOpen(true);
  };

  const handleDownloadVoucher = async (booking: UserBooking, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingVoucher(booking.orderId);
    
    try {
      const response = await bookingApi.downloadVoucher(booking.orderId);
      if (response.status === "ok" && response.data.url) {
        bookingApi.triggerDownload(
          response.data.url, 
          response.data.file_name || `voucher-${booking.orderId}.pdf`
        );
        toast.success("Voucher downloaded", {
          description: `Voucher for ${booking.hotelName} has been downloaded.`,
        });
      } else {
        throw new Error(response.error?.message || "Failed to download voucher");
      }
    } catch (error) {
      toast.error("Download failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setDownloadingVoucher(null);
    }
  };

  const handleCancellationComplete = (result: { 
    success: boolean; 
    refundAmount?: number; 
    message?: string; 
  }) => {
    if (result.success && bookingToCancel) {
      // In a real app, you would refetch bookings from the API
      toast.success("Booking cancelled", {
        description: `Your booking at ${bookingToCancel.hotelName} has been cancelled.`,
      });
    }
    setBookingToCancel(null);
  };

  const handleViewDetails = (booking: UserBooking) => {
    navigate(`/orders/${booking.orderId}`);
  };

  const getBookingTimeInfo = (booking: UserBooking) => {
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const today = new Date();

    if (booking.status === "cancelled") {
      return { label: "Cancelled", type: "cancelled" as const };
    }

    if (isPast(checkOut)) {
      return { label: "Completed", type: "past" as const };
    }

    if (isToday(checkIn)) {
      return { label: "Check-in Today", type: "today" as const };
    }

    if (isPast(checkIn) && isFuture(checkOut)) {
      return { label: "In Progress", type: "active" as const };
    }

    const daysUntil = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) {
      return { label: `In ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`, type: "soon" as const };
    }

    return { label: format(checkIn, "MMM d, yyyy"), type: "future" as const };
  };

  const tabCounts = useMemo(() => ({
    all: bookings.length,
    upcoming: bookings.filter((b) => {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      return b.status !== "cancelled" && (isFuture(checkIn) || isToday(checkIn) || (isPast(checkIn) && isFuture(checkOut)));
    }).length,
    past: bookings.filter((b) => {
      const checkOut = new Date(b.checkOut);
      return b.status === "completed" || (b.status !== "cancelled" && isPast(checkOut));
    }).length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  }), [bookings]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                <div>
                  <h1 className="text-lg font-heading text-foreground">My Bookings</h1>
                  <p className="text-xs text-muted-foreground">View and manage your reservations</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCwIcon className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </header>

          <div className="p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabFilter)} className="mb-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
                <TabsTrigger value="all" className="gap-2">
                  All
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {tabCounts.all}
                  </Badge>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              Upcoming
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {tabCounts.upcoming}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              Past
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {tabCounts.past}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="gap-2">
              Cancelled
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {tabCounts.cancelled}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search, Date Filter, Sort & Export */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by hotel, city, or booking ID..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("gap-2 w-full sm:w-auto", dateRange.from && "text-foreground")}>
                <CalendarIcon className="h-4 w-4" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                  : "Date Range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => { setDateRange({ from: range?.from, to: range?.to }); setCurrentPage(1); }}
                numberOfMonths={2}
              />
              {dateRange.from && (
                <div className="p-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })}>
                    Clear dates
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="check_in_asc">Check-in (Earliest)</SelectItem>
              <SelectItem value="check_in_desc">Check-in (Latest)</SelectItem>
              <SelectItem value="created_desc">Recently Booked</SelectItem>
              <SelectItem value="amount_desc">Price (High to Low)</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2" onClick={handleExportBookings}>
            <FileDown className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Info: Bookings auto-save from confirmation page */}
        <div className="flex items-center gap-2 mb-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <CheckCircleIcon className="w-4 h-4 text-primary" />
          <span>Bookings are automatically saved when you complete a reservation.</span>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {sortedBookings.length} booking{sortedBookings.length !== 1 ? "s" : ""} found
          {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
        </p>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <Skeleton className="w-full md:w-48 h-48" />
                    <div className="flex-1 p-5 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
        /* Bookings List */
        <div className="space-y-4">
          {paginatedBookings.map((booking) => {
            const statusInfo = statusConfig[booking.status];
            const timeInfo = getBookingTimeInfo(booking);
            const StatusIcon = statusInfo.icon;

            return (
              <Card
                key={booking.id}
                className="group transition-all duration-300 hover:shadow-lg hover:border-primary/20 cursor-pointer overflow-hidden"
                onClick={() => handleViewDetails(booking)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Hotel Image */}
                    <div className="relative w-full md:w-48 h-48 md:h-auto shrink-0">
                      <img
                        src={booking.hotelImage}
                        alt={booking.hotelName}
                        className="w-full h-full object-cover"
                      />
                      {/* Time indicator overlay */}
                      <div
                        className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                          timeInfo.type === "today"
                            ? "bg-primary text-primary-foreground"
                            : timeInfo.type === "soon"
                            ? "bg-amber-500 text-white"
                            : timeInfo.type === "active"
                            ? "bg-emerald-500 text-white"
                            : "bg-background/80 text-foreground"
                        }`}
                      >
                        {timeInfo.label}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-heading text-lg text-foreground">
                              {booking.hotelName}
                            </h3>
                            <Badge variant="outline" className={`capitalize ${statusInfo.className}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                            <MapPinIcon className="w-4 h-4" />
                            <span>
                              {booking.city}, {booking.country}
                            </span>
                            <span className="text-muted-foreground/50 mx-1">•</span>
                            <span className="flex items-center gap-0.5">
                              {Array.from({ length: booking.hotelStars }).map((_, i) => (
                                <span key={i} className="text-amber-400">★</span>
                              ))}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalendarIcon className="w-4 h-4 shrink-0" />
                              <span>
                                {format(new Date(booking.checkIn), "MMM d")} -{" "}
                                {format(new Date(booking.checkOut), "MMM d, yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <HotelIcon className="w-4 h-4 shrink-0" />
                              <span>
                                {booking.nights} night{booking.nights !== 1 ? "s" : ""} • {booking.roomType}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground mt-2">
                            Order ID: {booking.orderId}
                          </p>
                        </div>

                        {/* Price & Actions */}
                        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {booking.paymentType === "prepaid" ? "Paid" : "Pay at Hotel"}
                            </p>
                            <p className="font-heading text-xl text-foreground">
                              {booking.currency} {booking.totalAmount.toLocaleString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {booking.voucherUrl && booking.status !== "cancelled" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={(e) => handleDownloadVoucher(booking, e)}
                                disabled={downloadingVoucher === booking.orderId}
                              >
                                {downloadingVoucher === booking.orderId ? (
                                  <Loader2Icon className="w-4 h-4 animate-spin" />
                                ) : (
                                  <DownloadIcon className="w-4 h-4" />
                                )}
                                <span className="hidden sm:inline">Voucher</span>
                              </Button>
                            )}

                            {booking.canCancel && booking.status !== "cancelled" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => handleCancelClick(booking, e)}
                              >
                                <XCircleIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Cancel</span>
                              </Button>
                            )}

                            <Button variant="ghost" size="icon" className="shrink-0">
                              <ChevronRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Cancellation warning */}
                      {booking.cancellationDeadline &&
                        booking.status !== "cancelled" &&
                        isFuture(new Date(booking.cancellationDeadline)) && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2 text-sm">
                              <AlertCircleIcon className="w-4 h-4 text-amber-500" />
                              <span className="text-muted-foreground">
                                Free cancellation until{" "}
                                <span className="font-medium text-foreground">
                                  {format(new Date(booking.cancellationDeadline), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {sortedBookings.length === 0 && (
            <div className="text-center py-16">
              <HotelIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-heading text-lg text-foreground mb-2">No bookings found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : activeTab === "upcoming"
                  ? "You don't have any upcoming bookings"
                  : activeTab === "past"
                  ? "You don't have any past bookings"
                  : activeTab === "cancelled"
                  ? "You don't have any cancelled bookings"
                  : "Start exploring hotels to make your first booking"}
              </p>
              <Button onClick={() => navigate("/dashboard/search")}>Search Hotels</Button>
            </div>
            )}
          </div>
        )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8"
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Cancellation Modal */}
      <CancellationModal
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        orderId={bookingToCancel?.orderId || ""}
        hotelName={bookingToCancel?.hotelName || ""}
        checkIn={bookingToCancel?.checkIn || ""}
        checkOut={bookingToCancel?.checkOut || ""}
        totalAmount={bookingToCancel?.totalAmount || 0}
        currency={bookingToCancel?.currency || "USD"}
        cancellationPolicy={bookingToCancel?.cancellationPolicy}
        cancellationDeadline={bookingToCancel?.cancellationDeadline}
        onCancellationComplete={handleCancellationComplete}
      />
    </div>
  </SidebarProvider>
  );
}
