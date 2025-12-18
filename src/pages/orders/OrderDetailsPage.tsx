import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeftIcon,
  CalendarIcon, 
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  CreditCardIcon,
  ClockIcon,
  FileTextIcon,
  DownloadIcon,
  ExternalLinkIcon,
  StarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  HotelIcon
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Order, OrderStatus, OrderTimelineEvent } from "@/types/trips";

// Mock data
const mockOrder: Order = {
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
  cancellationPolicy: "Free cancellation until January 10, 2025 at 23:59 UTC. After this date, cancellation will incur a fee of 100% of the booking total.",
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
      name: "Booking Voucher",
      url: "/documents/doc_001",
      generatedAt: "2024-12-10T10:32:00Z",
      fileSize: 245000
    },
    {
      id: "doc_002",
      orderId: "ord_001",
      tripId: "og_12345",
      type: "confirmation",
      name: "Booking Confirmation",
      url: "/documents/doc_002",
      generatedAt: "2024-12-10T10:32:00Z",
      fileSize: 189000
    }
  ]
};

const mockTimeline: OrderTimelineEvent[] = [
  {
    id: "evt_001",
    orderId: "ord_001",
    type: "created",
    description: "Booking created",
    timestamp: "2024-12-10T10:30:00Z"
  },
  {
    id: "evt_002",
    orderId: "ord_001",
    type: "confirmed",
    description: "Payment processed and booking confirmed",
    timestamp: "2024-12-10T10:32:00Z"
  },
  {
    id: "evt_003",
    orderId: "ord_001",
    type: "document_generated",
    description: "Voucher and confirmation documents generated",
    timestamp: "2024-12-10T10:32:00Z"
  }
];

const statusColors: Record<OrderStatus, string> = {
  confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const paymentTypeLabels: Record<string, string> = {
  now: "Paid in Full",
  deposit: "Deposit Paid",
  pay_at_hotel: "Pay at Hotel"
};

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const [order] = useState(mockOrder);
  const [timeline] = useState(mockTimeline);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const renderStars = (count: number) => {
    return Array.from({ length: count }, (_, i) => (
      <StarIcon key={i} className="w-4 h-4 fill-sidebar-gold text-sidebar-gold" />
    ));
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "confirmed":
        return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />;
      case "cancelled":
        return <AlertCircleIcon className="w-4 h-4 text-red-500" />;
      case "document_generated":
        return <FileTextIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          {/* Back Link */}
          <Link 
            to={`/trips/${order.tripId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Trip
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={`capitalize ${statusColors[order.status]}`}
                        >
                          {order.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Order #{order.id}
                        </span>
                      </div>
                      <h1 className="font-heading text-heading-md text-foreground mb-2">
                        {order.hotelName}
                      </h1>
                      <div className="flex items-center gap-1 mb-2">
                        {renderStars(order.hotelStars)}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{order.hotelAddress}</span>
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                      <HotelIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Check-in</p>
                      <p className="font-medium text-foreground">{formatDate(order.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Check-out</p>
                      <p className="font-medium text-foreground">{formatDate(order.checkOut)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Duration</p>
                      <p className="font-medium text-foreground">{order.nights} night{order.nights !== 1 ? "s" : ""}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Room</p>
                      <p className="font-medium text-foreground">{order.roomType}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Guest */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserIcon className="w-5 h-5" />
                    Lead Guest Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {order.leadGuest.firstName} {order.leadGuest.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">Lead Guest</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MailIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{order.leadGuest.email}</span>
                    </div>
                    {order.leadGuest.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                        <span>{order.leadGuest.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-1">Occupancy</p>
                    <p className="text-sm">
                      {order.occupancy.adults} adult{order.occupancy.adults !== 1 ? "s" : ""}
                      {order.occupancy.children > 0 && `, ${order.occupancy.children} child${order.occupancy.children !== 1 ? "ren" : ""}`}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment & Cancellation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCardIcon className="w-5 h-5" />
                    Payment & Cancellation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground mb-0.5">Payment Status</p>
                      <p className="font-medium text-foreground">{paymentTypeLabels[order.paymentType]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-0.5">Total Amount</p>
                      <p className="font-heading text-xl text-foreground">
                        {order.currency} {order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Cancellation Policy</p>
                    <p className="text-sm text-muted-foreground">{order.cancellationPolicy}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClockIcon className="w-5 h-5" />
                    Booking Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timeline.map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {getTimelineIcon(event.type)}
                          </div>
                          {index < timeline.length - 1 && (
                            <div className="w-px h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-foreground">{event.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(event.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileTextIcon className="w-5 h-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <FileTextIcon className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.fileSize)} • PDF
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={doc.url}>
                            <ExternalLinkIcon className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <DownloadIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full mt-2" asChild>
                    <Link to={`/orders/${order.id}/documents`}>
                      View All Documents
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <DownloadIcon className="w-4 h-4" />
                    Download Voucher
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <MailIcon className="w-4 h-4" />
                    Email to Guest
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
                    <AlertCircleIcon className="w-4 h-4" />
                    Request Cancellation
                  </Button>
                </CardContent>
              </Card>

              {/* Trip Reference */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">Part of Trip</p>
                  <Link 
                    to={`/trips/${order.tripId}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{order.tripId}</span>
                    </div>
                    <ExternalLinkIcon className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
