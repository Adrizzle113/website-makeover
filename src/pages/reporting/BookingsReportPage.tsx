import { useState } from "react";
import { format } from "date-fns";
import { EyeIcon, DownloadIcon, XCircleIcon, MoreHorizontalIcon } from "lucide-react";
import { ReportingLayout, ReportingFilterToolbar, BookingDrawer, StatusBadge } from "@/components/reporting";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ReportingFilters, ReportingBooking, SavedView } from "@/types/reporting";
import { toast } from "@/hooks/use-toast";

// Mock data
const mockBookings: ReportingBooking[] = [
  {
    id: "BK-2025-001",
    etgOrderId: "ETG-789456123",
    status: "confirmed",
    leadGuest: "John Smith",
    guestEmail: "john.smith@email.com",
    hotel: "Grand Hyatt Tokyo",
    city: "Tokyo",
    country: "Japan",
    checkIn: "2025-02-15",
    checkOut: "2025-02-18",
    nights: 3,
    roomType: "Deluxe King Room",
    clientTotal: 1850,
    supplierTotal: 1480,
    margin: 370,
    marginPercent: 20,
    currency: "USD",
    paymentType: "now_net",
    paymentStatus: "collected",
    agentName: "Sarah Johnson",
    groupName: "Acme Travel Corp",
    cancellationPolicy: "Free cancellation until Feb 13, 2025",
    cancellationDeadline: "2025-02-13T18:00:00Z",
    createdAt: "2025-01-10T14:30:00Z",
    confirmedAt: "2025-01-10T14:35:00Z",
  },
  {
    id: "BK-2025-002",
    etgOrderId: "ETG-456789123",
    status: "processing",
    leadGuest: "Emma Wilson",
    guestEmail: "emma.wilson@email.com",
    hotel: "The Ritz Paris",
    city: "Paris",
    country: "France",
    checkIn: "2025-03-01",
    checkOut: "2025-03-05",
    nights: 4,
    roomType: "Superior Suite",
    clientTotal: 4200,
    supplierTotal: 3360,
    margin: 840,
    marginPercent: 20,
    currency: "EUR",
    paymentType: "deposit",
    paymentStatus: "not_collected",
    agentName: "Michael Chen",
    groupName: "Global Adventures",
    cancellationPolicy: "Non-refundable",
    createdAt: "2025-01-12T09:15:00Z",
  },
  {
    id: "BK-2025-003",
    etgOrderId: "ETG-321654987",
    status: "cancelled",
    leadGuest: "David Brown",
    guestEmail: "david.brown@email.com",
    hotel: "Marina Bay Sands",
    city: "Singapore",
    country: "Singapore",
    checkIn: "2025-02-20",
    checkOut: "2025-02-23",
    nights: 3,
    roomType: "Premier Room",
    clientTotal: 2100,
    supplierTotal: 1680,
    margin: 420,
    marginPercent: 20,
    currency: "SGD",
    paymentType: "now_gross",
    paymentStatus: "collected",
    agentName: "Sarah Johnson",
    groupName: "Sunshine Holidays",
    cancellationPolicy: "Free cancellation until Feb 18, 2025",
    cancellationDeadline: "2025-02-18T18:00:00Z",
    createdAt: "2025-01-08T16:45:00Z",
    confirmedAt: "2025-01-08T16:50:00Z",
  },
  {
    id: "BK-2025-004",
    etgOrderId: "ETG-654987321",
    status: "confirmed",
    leadGuest: "Sophie Taylor",
    guestEmail: "sophie.taylor@email.com",
    hotel: "Four Seasons New York",
    city: "New York",
    country: "USA",
    checkIn: "2025-02-28",
    checkOut: "2025-03-02",
    nights: 2,
    roomType: "Park View Room",
    clientTotal: 1600,
    supplierTotal: 1280,
    margin: 320,
    marginPercent: 20,
    currency: "USD",
    paymentType: "hotel",
    paymentStatus: "pay_at_property",
    agentName: "John Smith",
    groupName: "Acme Travel Corp",
    cancellationPolicy: "Free cancellation until Feb 26, 2025",
    cancellationDeadline: "2025-02-26T18:00:00Z",
    createdAt: "2025-01-14T11:20:00Z",
    confirmedAt: "2025-01-14T11:25:00Z",
  },
  {
    id: "BK-2025-005",
    etgOrderId: "ETG-987321654",
    status: "failed",
    leadGuest: "James Anderson",
    guestEmail: "james.anderson@email.com",
    hotel: "Burj Al Arab",
    city: "Dubai",
    country: "UAE",
    checkIn: "2025-03-10",
    checkOut: "2025-03-14",
    nights: 4,
    roomType: "Deluxe Suite",
    clientTotal: 8500,
    supplierTotal: 6800,
    margin: 1700,
    marginPercent: 20,
    currency: "AED",
    paymentType: "now_net",
    paymentStatus: "not_collected",
    agentName: "Michael Chen",
    groupName: "Global Adventures",
    cancellationPolicy: "Free cancellation until Mar 8, 2025",
    cancellationDeadline: "2025-03-08T18:00:00Z",
    createdAt: "2025-01-15T08:00:00Z",
  },
];

const mockSavedViews: SavedView[] = [
  { id: "1", name: "This Month", filters: {}, createdAt: "2025-01-01", isDefault: true },
  { id: "2", name: "Unpaid Bookings", filters: { paymentStatus: ["not_collected"] as any }, createdAt: "2025-01-01" },
  { id: "3", name: "Cancellations", filters: { status: ["cancelled"] }, createdAt: "2025-01-01" },
];

export function BookingsReportPage() {
  const [filters, setFilters] = useState<ReportingFilters>({});
  const [selectedBooking, setSelectedBooking] = useState<ReportingBooking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleExport = (format: "csv" | "excel") => {
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: "Your download will start shortly.",
    });
  };

  const handleRowClick = (booking: ReportingBooking) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  // Filter bookings based on current filters
  const filteredBookings = mockBookings.filter((booking) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        booking.id.toLowerCase().includes(search) ||
        booking.etgOrderId.toLowerCase().includes(search) ||
        booking.leadGuest.toLowerCase().includes(search) ||
        booking.hotel.toLowerCase().includes(search) ||
        booking.city.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    if (filters.status?.length && !filters.status.includes(booking.status)) return false;
    if (filters.paymentType?.length && !filters.paymentType.includes(booking.paymentType)) return false;
    return true;
  });

  return (
    <ReportingLayout title="Bookings" description="View and manage all hotel bookings">
      <ReportingFilterToolbar
        filters={filters}
        onFiltersChange={setFilters}
        savedViews={mockSavedViews}
        onExport={handleExport}
        userRole="admin"
      />

      <div className="mt-6 border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Booking ID</TableHead>
              <TableHead className="font-semibold">ETG Order</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Guest</TableHead>
              <TableHead className="font-semibold">Hotel</TableHead>
              <TableHead className="font-semibold">City</TableHead>
              <TableHead className="font-semibold">Check-in</TableHead>
              <TableHead className="font-semibold">Check-out</TableHead>
              <TableHead className="font-semibold text-right">Client Total</TableHead>
              <TableHead className="font-semibold text-right">Supplier</TableHead>
              <TableHead className="font-semibold text-right">Margin</TableHead>
              <TableHead className="font-semibold">Payment</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.map((booking) => (
              <TableRow
                key={booking.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(booking)}
              >
                <TableCell className="font-mono text-sm">{booking.id}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{booking.etgOrderId}</TableCell>
                <TableCell>
                  <StatusBadge status={booking.status} />
                </TableCell>
                <TableCell>{booking.leadGuest}</TableCell>
                <TableCell className="max-w-[200px] truncate">{booking.hotel}</TableCell>
                <TableCell>{booking.city}</TableCell>
                <TableCell>{format(new Date(booking.checkIn), "MMM d, yyyy")}</TableCell>
                <TableCell>{format(new Date(booking.checkOut), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right font-mono">
                  {booking.currency} {booking.clientTotal.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {booking.currency} {booking.supplierTotal.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono text-emerald-600">
                    {booking.currency} {booking.margin.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({booking.marginPercent}%)
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={booking.paymentStatus} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontalIcon className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRowClick(booking); }}>
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Download Confirmation
                      </DropdownMenuItem>
                      {booking.status !== "cancelled" && (
                        <DropdownMenuItem 
                          onClick={(e) => e.stopPropagation()}
                          className="text-red-600"
                        >
                          <XCircleIcon className="w-4 h-4 mr-2" />
                          Cancel Booking
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredBookings.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No bookings found matching your filters.
          </div>
        )}
      </div>

      <BookingDrawer
        booking={selectedBooking}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </ReportingLayout>
  );
}
