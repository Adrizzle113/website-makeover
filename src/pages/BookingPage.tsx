import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { useBookingStore } from "@/stores/bookingStore";
import { GuestInformationSection } from "@/components/booking/GuestInformationSection";
import { BookingDetailsSection } from "@/components/booking/BookingDetailsSection";
import { PaymentMethodSection } from "@/components/booking/PaymentMethodSection";
import { ClientPriceSection } from "@/components/booking/ClientPriceSection";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";

const BookingPage = () => {
  const navigate = useNavigate();
  const { selectedHotel, selectedRooms, searchParams, getTotalPrice, getTotalRooms } = useBookingStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading check
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!selectedHotel || selectedRooms.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                Booking Information Not Available
              </h2>
              <p className="text-muted-foreground mb-6">
                We couldn't find the booking details. Please go back and select your room again.
              </p>
              <Button
                onClick={() => navigate(-1)}
                className="bg-primary hover:bg-primary/90"
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalRooms = getTotalRooms();
  const totalPrice = getTotalPrice();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {/* Hero Section with Back Button */}
        <section className="bg-primary py-8 lg:py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Hotel</span>
            </Button>
            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-primary-foreground">
              Complete Your Booking
            </h1>
            <p className="text-primary-foreground/80 mt-2">
              {selectedHotel.name} • {totalRooms} room{totalRooms > 1 ? 's' : ''} selected
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 lg:py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side - Forms */}
              <div className="lg:col-span-2 space-y-6">
                <GuestInformationSection 
                  rooms={selectedRooms}
                  hotel={selectedHotel}
                />
                <BookingDetailsSection />
                <PaymentMethodSection />
                <ClientPriceSection totalPrice={totalPrice} currency={selectedHotel.currency} />
              </div>

              {/* Right Side - Summary */}
              <div className="lg:col-span-1">
                <BookingSummaryCard
                  hotel={selectedHotel}
                  rooms={selectedRooms}
                  searchParams={searchParams}
                  totalPrice={totalPrice}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BookingPage;
