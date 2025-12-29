import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, isPast, isFuture, isToday } from "date-fns";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed";

interface UserBooking {
  id: string;
  orderId: string;
  hotelName: string;
  hotelImage: string;
  hotelStars: number;
  city: string;
  country: string;
  address: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  roomCount: number;
  guests: {
    adults: number;
    children: number;
  };
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  paymentType: "prepaid" | "pay_at_hotel";
  cancellationPolicy: string;
  cancellationDeadline?: string;
  canCancel: boolean;
  confirmedAt?: string;
  createdAt: string;
  voucherUrl?: string;
}

// Mock data for demonstration
const mockBookings: UserBooking[] = [
  {
    id: "bk-001",
    orderId: "ETG-789456123",
    hotelName: "The Beverly Hills Hotel",
    hotelImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
    hotelStars: 5,
    city: "Los Angeles",
    country: "USA",
    address: "9641 Sunset Blvd, Beverly Hills, CA 90210",
    checkIn: "2025-02-15",
    checkOut: "2025-02-18",
    nights: 3,
    roomType: "Deluxe King Suite",
    roomCount: 1,
    guests: { adults: 2, children: 0 },
    status: "confirmed",
    totalAmount: 2850,
    currency: "USD",
    paymentType: "prepaid",
    cancellationPolicy: "Free cancellation until Feb 13, 2025",
    cancellationDeadline: "2025-02-13T18:00:00Z",
    canCancel: true,
    confirmedAt: "2025-01-10T14:35:00Z",
    createdAt: "2025-01-10T14:30:00Z",
    voucherUrl: "/documents/voucher-001",
  },
  {
    id: "bk-002",
    orderId: "ETG-456789123",
    hotelName: "The Ritz Paris",
    hotelImage: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400",
    hotelStars: 5,
    city: "Paris",
    country: "France",
    address: "15 Place Vendôme, 75001 Paris",
    checkIn: "2025-03-01",
    checkOut: "2025-03-05",
    nights: 4,
    roomType: "Superior Suite",
    roomCount: 1,
    guests: { adults: 2, children: 1 },
    status: "pending",
    totalAmount: 4200,
    currency: "EUR",
    paymentType: "prepaid",
    cancellationPolicy: "Non-refundable",
    canCancel: false,
    createdAt: "2025-01-12T09:15:00Z",
  },
  {
    id: "bk-003",
    orderId: "ETG-321654987",
    hotelName: "Marina Bay Sands",
    hotelImage: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
    hotelStars: 5,
    city: "Singapore",
    country: "Singapore",
    address: "10 Bayfront Avenue, Singapore 018956",
    checkIn: "2024-12-20",
    checkOut: "2024-12-23",
    nights: 3,
    roomType: "Premier Room",
    roomCount: 1,
    guests: { adults: 2, children: 0 },
    status: "completed",
    totalAmount: 1890,
    currency: "SGD",
    paymentType: "prepaid",
    cancellationPolicy: "Free cancellation until Dec 18, 2024",
    canCancel: false,
    confirmedAt: "2024-11-15T10:20:00Z",
    createdAt: "2024-11-15T10:15:00Z",
    voucherUrl: "/documents/voucher-003",
  },
  {
    id: "bk-004",
    orderId: "ETG-654987321",
    hotelName: "Four Seasons Resort Bali",
    hotelImage: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400",
    hotelStars: 5,
    city: "Bali",
    country: "Indonesia",
    address: "Jimbaran Bay, Bali 80361",
    checkIn: "2025-04-10",
    checkOut: "2025-04-15",
    nights: 5,
    roomType: "Ocean View Villa",
    roomCount: 1,
    guests: { adults: 2, children: 2 },
    status: "confirmed",
    totalAmount: 5500,
    currency: "USD",
    paymentType: "pay_at_hotel",
    cancellationPolicy: "Free cancellation until Apr 8, 2025",
    cancellationDeadline: "2025-04-08T18:00:00Z",
    canCancel: true,
    confirmedAt: "2025-01-05T16:45:00Z",
    createdAt: "2025-01-05T16:40:00Z",
  },
  {
    id: "bk-005",
    orderId: "ETG-987321654",
    hotelName: "Burj Al Arab",
    hotelImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400",
    hotelStars: 5,
    city: "Dubai",
    country: "UAE",
    address: "Jumeirah Beach Road, Dubai",
    checkIn: "2025-01-20",
    checkOut: "2025-01-24",
    nights: 4,
    roomType: "Deluxe Suite",
    roomCount: 1,
    guests: { adults: 2, children: 0 },
    status: "cancelled",
    totalAmount: 8500,
    currency: "AED",
    paymentType: "prepaid",
    cancellationPolicy: "Free cancellation until Jan 18, 2025",
    canCancel: false,
    createdAt: "2024-12-28T08:00:00Z",
  },
];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [sortBy, setSortBy] = useState<string>("check_in_asc");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<UserBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Filter bookings based on tab and search
  const filteredBookings = mockBookings.filter((booking) => {
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
    const today = new Date();

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

  // Sort bookings
  const sortedBookings = [...filteredBookings].sort((a, b) => {
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

  const handleCancelClick = (booking: UserBooking, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookingToCancel(booking);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    
    setCancelling(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCancelling(false);
    setCancelDialogOpen(false);
    
    toast.success("Booking cancelled successfully", {
      description: `Your booking at ${bookingToCancel.hotelName} has been cancelled.`,
    });
    
    setBookingToCancel(null);
  };

  const handleDownloadVoucher = (booking: UserBooking, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success("Downloading voucher...", {
      description: `Voucher for ${booking.hotelName} is being prepared.`,
    });
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

  const tabCounts = {
    all: mockBookings.length,
    upcoming: mockBookings.filter((b) => {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      return b.status !== "cancelled" && (isFuture(checkIn) || isToday(checkIn) || (isPast(checkIn) && isFuture(checkOut)));
    }).length,
    past: mockBookings.filter((b) => {
      const checkOut = new Date(b.checkOut);
      return b.status === "completed" || (b.status !== "cancelled" && isPast(checkOut));
    }).length,
    cancelled: mockBookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
            <div className="px-6 py-4 flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div>
                <h1 className="text-lg font-heading text-foreground">My Bookings</h1>
                <p className="text-xs text-muted-foreground">View and manage your reservations</p>
              </div>
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

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by hotel, city, or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="check_in_asc">Check-in (Earliest)</SelectItem>
              <SelectItem value="check_in_desc">Check-in (Latest)</SelectItem>
              <SelectItem value="created_desc">Recently Booked</SelectItem>
              <SelectItem value="amount_desc">Price (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {sortedBookings.length} booking{sortedBookings.length !== 1 ? "s" : ""} found
        </p>

        {/* Bookings List */}
        <div className="space-y-4">
          {sortedBookings.map((booking) => {
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
                              >
                                <DownloadIcon className="w-4 h-4" />
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
              <Button onClick={() => navigate("/")}>Search Hotels</Button>
            </div>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to cancel your booking at{" "}
                <span className="font-medium text-foreground">{bookingToCancel?.hotelName}</span>?
              </p>
              {bookingToCancel && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">
                    {format(new Date(bookingToCancel.checkIn), "MMM d")} -{" "}
                    {format(new Date(bookingToCancel.checkOut), "MMM d, yyyy")}
                  </p>
                  <p className="font-medium text-foreground mt-1">
                    {bookingToCancel.currency} {bookingToCancel.totalAmount.toLocaleString()}
                  </p>
                </div>
              )}
              <p className="text-sm">
                {bookingToCancel?.cancellationPolicy}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </SidebarProvider>
  );
}
