import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeftIcon,
  CalendarIcon, 
  MapPinIcon,
  UsersIcon,
  DownloadIcon,
  FileTextIcon,
  HotelIcon,
  ChevronRightIcon,
  EditIcon,
  StarIcon,
  LayoutGrid,
  ListIcon,
  GitBranch
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TripTimeline, BookingCard, TripSummaryCards } from "@/components/trips";
import { Order, OrderStatus, Trip, TripStatus } from "@/types/trips";

// Mock data
const mockTrip: Trip = {
  id: "og_12345",
  name: "Maldives Honeymoon Package",
  clientName: "John & Sarah Smith",
  clientEmail: "john.smith@email.com",
  dateRange: { checkIn: "2025-01-15", checkOut: "2025-01-22" },
  destinations: ["Malé", "Baa Atoll"],
  bookingsCount: 2,
  status: "active",
  createdAt: "2024-12-10T10:30:00Z",
  updatedAt: "2024-12-10T10:30:00Z",
  totalAmount: 4500,
  currency: "USD"
};

const mockOrders: Order[] = [
  {
    id: "ord_001",
    tripId: "og_12345",
    hotelName: "Soneva Fushi Resort",
    hotelAddress: "Kunfunadhoo Island, Baa Atoll, Maldives",
    hotelStars: 5,
    city: "Baa Atoll",
    country: "Maldives",
    checkIn: "2025-01-15",
    checkOut: "2025-01-19",
    nights: 4,
    roomType: "Beach Villa with Pool",
    roomCount: 1,
    occupancy: { adults: 2, children: 0 },
    leadGuest: {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@email.com",
      phone: "+1 555-0123"
    },
    paymentType: "now",
    status: "confirmed",
    cancellationPolicy: "Free cancellation until Jan 10, 2025",
    cancellationDeadline: "2025-01-10T23:59:00Z",
    totalAmount: 2800,
    currency: "USD",
    createdAt: "2024-12-10T10:30:00Z",
    confirmedAt: "2024-12-10T10:32:00Z",
    documents: [
      {
        id: "doc_001",
        orderId: "ord_001",
        tripId: "og_12345",
        type: "voucher",
        name: "Booking Voucher - Soneva Fushi",
        url: "/documents/doc_001",
        generatedAt: "2024-12-10T10:32:00Z"
      }
    ]
  },
  {
    id: "ord_002",
    tripId: "og_12345",
    hotelName: "Park Hyatt Maldives",
    hotelAddress: "Hadahaa Island, Gaafu Alifu Atoll, Maldives",
    hotelStars: 5,
    city: "Malé",
    country: "Maldives",
    checkIn: "2025-01-19",
    checkOut: "2025-01-22",
    nights: 3,
    roomType: "Park Villa",
    roomCount: 1,
    occupancy: { adults: 2, children: 0 },
    leadGuest: {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@email.com",
      phone: "+1 555-0123"
    },
    paymentType: "now",
    status: "confirmed",
    cancellationPolicy: "Free cancellation until Jan 14, 2025",
    cancellationDeadline: "2025-01-14T23:59:00Z",
    totalAmount: 1700,
    currency: "USD",
    createdAt: "2024-12-10T10:45:00Z",
    confirmedAt: "2024-12-10T10:47:00Z",
    documents: [
      {
        id: "doc_002",
        orderId: "ord_002",
        tripId: "og_12345",
        type: "voucher",
        name: "Booking Voucher - Park Hyatt",
        url: "/documents/doc_002",
        generatedAt: "2024-12-10T10:47:00Z"
      }
    ]
  }
];

const statusColors: Record<TripStatus | OrderStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  mixed: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export default function TripDetailsPage() {
  const { orderGroupId } = useParams();
  const navigate = useNavigate();
  const [trip] = useState(mockTrip);
  const [orders] = useState(mockOrders);
  const [viewMode, setViewMode] = useState<"cards" | "timeline">("cards");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const renderStars = (count: number) => {
    return Array.from({ length: count }, (_, i) => (
      <StarIcon key={i} className="w-3.5 h-3.5 fill-sidebar-gold text-sidebar-gold" />
    ));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          {/* Back Link */}
          <Link 
            to="/trips"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Trips
          </Link>

          {/* Trip Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-heading text-heading-lg text-foreground">
                    {trip.name}
                  </h1>
                  <Badge 
                    variant="outline" 
                    className={`capitalize ${statusColors[trip.status]}`}
                  >
                    {trip.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Order Group: {trip.id}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <EditIcon className="w-4 h-4" />
                  Edit Trip Name
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <DownloadIcon className="w-4 h-4" />
                  Download All Vouchers
                </Button>
              </div>
            </div>

            {/* Trip Overview Cards - Using new component */}
            <TripSummaryCards trip={trip} orders={orders} />
          </div>

          <Separator className="my-8" />

          {/* Bookings Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-heading-sm text-foreground">
                Itinerary ({orders.length} bookings)
              </h2>
              
              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="gap-2"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Cards</span>
                </Button>
                <Button
                  variant={viewMode === "timeline" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("timeline")}
                  className="gap-2"
                >
                  <GitBranch className="w-4 h-4" />
                  <span className="hidden sm:inline">Timeline</span>
                </Button>
              </div>
            </div>

            {viewMode === "cards" ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <BookingCard
                    key={order.id}
                    order={order}
                    variant="detailed"
                    showActions={true}
                    onClick={() => navigate(`/orders/${order.id}`)}
                  />
                ))}
              </div>
            ) : (
              <TripTimeline orders={orders} />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
