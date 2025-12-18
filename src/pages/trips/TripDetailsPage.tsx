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
  StarIcon
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

            {/* Trip Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <UsersIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Client</p>
                      <p className="font-medium text-foreground">{trip.clientName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPinIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destinations</p>
                      <p className="font-medium text-foreground">{trip.destinations.join(", ")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium text-foreground">
                        {formatDate(trip.dateRange.checkIn).split(",")[0]} - {formatDate(trip.dateRange.checkOut).split(",")[0]}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sidebar-gold/10 flex items-center justify-center">
                      <FileTextIcon className="w-5 h-5 text-sidebar-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Value</p>
                      <p className="font-heading text-lg text-foreground">
                        {trip.currency} {trip.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Orders List */}
          <div>
            <h2 className="font-heading text-heading-sm text-foreground mb-4">
              Bookings ({orders.length})
            </h2>

            <div className="space-y-4">
              {orders.map((order) => (
                <Card 
                  key={order.id}
                  className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/20"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Hotel Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <HotelIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-heading text-lg text-foreground">
                                {order.hotelName}
                              </h3>
                              <Badge 
                                variant="outline" 
                                className={`capitalize ${statusColors[order.status]}`}
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              {renderStars(order.hotelStars)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.city}, {order.country}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-0.5">Check-in</p>
                            <p className="font-medium text-foreground">{formatDate(order.checkIn)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-0.5">Check-out</p>
                            <p className="font-medium text-foreground">{formatDate(order.checkOut)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-0.5">Room</p>
                            <p className="font-medium text-foreground">{order.roomType}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-0.5">Guests</p>
                            <p className="font-medium text-foreground">
                              {order.occupancy.adults} adult{order.occupancy.adults !== 1 ? "s" : ""}
                              {order.occupancy.children > 0 && `, ${order.occupancy.children} child`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="flex items-center gap-4 lg:border-l lg:pl-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-0.5">
                            {order.nights} night{order.nights !== 1 ? "s" : ""}
                          </p>
                          <p className="font-heading text-lg text-foreground">
                            {order.currency} {order.totalAmount.toLocaleString()}
                          </p>
                          {order.documents.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {order.documents.length} document{order.documents.length !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
