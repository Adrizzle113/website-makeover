import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, AlertCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { useBookingStore } from "@/stores/bookingStore";
import { GuestInformationSection, type Guest } from "@/components/booking/GuestInformationSection";
import { BookingDetailsSection } from "@/components/booking/BookingDetailsSection";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { ContinueToPaymentSection } from "@/components/booking/ContinueToPaymentSection";
import { PriceChangeModal } from "@/components/booking/PriceChangeModal";
import { toast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";

const BookingPage = () => {
  const navigate = useNavigate();
  const { selectedHotel, selectedRooms, searchParams, getTotalPrice } = useBookingStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isPrebooking, setIsPrebooking] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookingDetails, setBookingDetails] = useState({
    countryCode: "+1",
    phoneNumber: "",
    groupOfClients: "",
    specialRequests: "",
  });

  // Price change modal state
  const [showPriceChange, setShowPriceChange] = useState(false);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [newPrice, setNewPrice] = useState(0);

  useEffect(() => {
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

  const totalPrice = getTotalPrice();
  const nights = searchParams?.checkIn && searchParams?.checkOut
    ? differenceInDays(new Date(searchParams.checkOut), new Date(searchParams.checkIn))
    : 1;
  const totalWithNights = totalPrice * nights;

  const validateForm = (): boolean => {
    // Check lead guest
    const leadGuest = guests.find(g => g.isLead);
    if (!leadGuest) {
      toast({
        title: "Missing Lead Guest",
        description: "Please add a lead guest with their details.",
        variant: "destructive",
      });
      return false;
    }

    if (!leadGuest.firstName || !leadGuest.lastName) {
      toast({
        title: "Incomplete Guest Information",
        description: "Please enter the lead guest's first and last name.",
        variant: "destructive",
      });
      return false;
    }

    if (!leadGuest.email) {
      toast({
        title: "Email Required",
        description: "Please enter the lead guest's email address.",
        variant: "destructive",
      });
      return false;
    }

    // Check children ages
    const childrenWithoutAge = guests.filter(g => g.type === "child" && !g.age);
    if (childrenWithoutAge.length > 0) {
      toast({
        title: "Missing Child Age",
        description: "Please select the age for all children.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleContinueToPayment = async () => {
    if (!validateForm()) return;

    setIsPrebooking(true);

    try {
      // Simulate Prebook API call
      // In real implementation, call ratehawkApi.prebook()
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate price change scenario (20% chance for demo)
      const hasPriceChanged = Math.random() < 0.2;
      
      if (hasPriceChanged) {
        const priceIncrease = totalWithNights * 0.05; // 5% increase
        setOriginalPrice(totalWithNights);
        setNewPrice(totalWithNights + priceIncrease);
        setShowPriceChange(true);
        setIsPrebooking(false);
        return;
      }

      // Success - navigate to payment page
      const bookingId = `BK-${Date.now()}`;
      
      // Store booking data (in real app, this would be saved to backend)
      sessionStorage.setItem("pending_booking", JSON.stringify({
        bookingId,
        hotel: selectedHotel,
        rooms: selectedRooms,
        guests,
        bookingDetails,
        totalPrice: totalWithNights,
        searchParams,
      }));

      navigate(`/payment?booking_id=${bookingId}`);
      
    } catch (error) {
      toast({
        title: "Availability Error",
        description: "Unable to confirm room availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPrebooking(false);
    }
  };

  const handleAcceptPriceChange = () => {
    setShowPriceChange(false);
    
    const bookingId = `BK-${Date.now()}`;
    
    sessionStorage.setItem("pending_booking", JSON.stringify({
      bookingId,
      hotel: selectedHotel,
      rooms: selectedRooms,
      guests,
      bookingDetails,
      totalPrice: newPrice,
      searchParams,
      priceUpdated: true,
    }));

    navigate(`/payment?booking_id=${bookingId}`);
  };

  const handleDeclinePriceChange = () => {
    setShowPriceChange(false);
    toast({
      title: "Booking Cancelled",
      description: "The booking was cancelled due to the price change.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {/* Hero Section with Back Button */}
        <section className="bg-primary py-8 lg:py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <Button
              variant="ghost"
              onClick={() => navigate(`/hotel/${selectedHotel.id}`)}
              className="flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Hotel Details</span>
            </Button>
            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-primary-foreground">
              Complete Your Booking
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-primary-foreground/90">
              <span className="font-medium">{selectedHotel.name}</span>
              <div className="flex items-center">
                {[...Array(selectedHotel.starRating || 0)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-[hsl(var(--app-gold))] fill-current" />
                ))}
              </div>
              <span className="text-primary-foreground/70">•</span>
              <span className="text-sm">{selectedHotel.address}, {selectedHotel.city}</span>
            </div>
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
                  onGuestsChange={setGuests}
                />
                <BookingDetailsSection 
                  onDetailsChange={setBookingDetails}
                />
                <ContinueToPaymentSection
                  totalPrice={totalWithNights}
                  currency={selectedHotel.currency}
                  isLoading={isPrebooking}
                  onContinue={handleContinueToPayment}
                />
              </div>

              {/* Right Side - Summary */}
              <div className="lg:col-span-1">
                <BookingSummaryCard
                  hotel={selectedHotel}
                  rooms={selectedRooms}
                  searchParams={searchParams}
                  totalPrice={totalPrice}
                  isLoading={isPrebooking}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Price Change Modal */}
      <PriceChangeModal
        open={showPriceChange}
        onOpenChange={setShowPriceChange}
        originalPrice={originalPrice}
        newPrice={newPrice}
        currency={selectedHotel.currency}
        onAccept={handleAcceptPriceChange}
        onDecline={handleDeclinePriceChange}
      />
    </div>
  );
};

export default BookingPage;
