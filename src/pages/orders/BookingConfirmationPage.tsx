import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  CheckCircleIcon,
  CalendarIcon, 
  MapPinIcon,
  DownloadIcon,
  ArrowRightIcon,
  StarIcon,
  Loader2Icon,
  FileTextIcon
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Mock order data (would come from API/state in real app)
const mockConfirmedOrder = {
  id: "ord_001",
  tripId: "og_12345",
  hotelName: "Soneva Fushi Resort",
  hotelStars: 5,
  city: "Baa Atoll",
  country: "Maldives",
  checkIn: "2025-01-15",
  checkOut: "2025-01-19",
  nights: 4,
  roomType: "Beach Villa with Pool",
  occupancy: { adults: 2, children: 0 },
  leadGuest: {
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com"
  },
  totalAmount: 2800,
  currency: "USD",
  confirmationNumber: "ETG-2024-789456"
};

export default function BookingConfirmationPage() {
  const { orderId } = useParams();
  const [order] = useState(mockConfirmedOrder);
  const [voucherReady, setVoucherReady] = useState(false);

  // Simulate voucher generation
  useEffect(() => {
    const timer = setTimeout(() => {
      setVoucherReady(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
      <StarIcon key={i} className="w-4 h-4 fill-sidebar-gold text-sidebar-gold" />
    ));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-10 h-10 text-emerald-500" />
              </div>
              <h1 className="font-heading text-heading-lg text-foreground mb-2">
                Booking Confirmed!
              </h1>
              <p className="text-muted-foreground">
                Your reservation has been successfully confirmed. A confirmation email has been sent to {order.leadGuest.email}.
              </p>
            </div>

            {/* Confirmation Number */}
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Confirmation Number</p>
                <p className="font-heading text-2xl text-primary tracking-wider">
                  {order.confirmationNumber}
                </p>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-1">
                    <h2 className="font-heading text-xl text-foreground mb-1">
                      {order.hotelName}
                    </h2>
                    <div className="flex items-center gap-1 mb-2">
                      {renderStars(order.hotelStars)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{order.city}, {order.country}</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Check-in</p>
                    <p className="font-medium text-foreground">{formatDate(order.checkIn)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Check-out</p>
                    <p className="font-medium text-foreground">{formatDate(order.checkOut)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Room Type</p>
                    <p className="font-medium text-foreground">{order.roomType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Guests</p>
                    <p className="font-medium text-foreground">
                      {order.occupancy.adults} adult{order.occupancy.adults !== 1 ? "s" : ""}
                      {order.occupancy.children > 0 && `, ${order.occupancy.children} child`}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Lead Guest</p>
                    <p className="font-medium text-foreground">
                      {order.leadGuest.firstName} {order.leadGuest.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="font-heading text-xl text-foreground">
                      {order.currency} {order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voucher Download */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <FileTextIcon className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Booking Voucher</p>
                      <p className="text-sm text-muted-foreground">
                        {voucherReady ? "Ready to download" : "Generating voucher..."}
                      </p>
                    </div>
                  </div>
                  <Button 
                    disabled={!voucherReady}
                    className="gap-2"
                  >
                    {voucherReady ? (
                      <>
                        <DownloadIcon className="w-4 h-4" />
                        Download Voucher
                      </>
                    ) : (
                      <>
                        <Loader2Icon className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                asChild
              >
                <Link to={`/orders/${order.id}`}>
                  <CalendarIcon className="w-4 h-4" />
                  View Order Details
                </Link>
              </Button>
              <Button 
                className="flex-1 gap-2"
                asChild
              >
                <Link to={`/trips/${order.tripId}`}>
                  View Trip
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-muted-foreground mt-8">
              Need help? Contact our support team at{" "}
              <a href="mailto:support@travelhub.com" className="text-primary hover:underline">
                support@travelhub.com
              </a>
            </p>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
