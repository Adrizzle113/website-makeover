import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBookingStore } from "@/stores/bookingStore";
import { 
  BookingSummaryPanel,
  GuestFormPanel,
  PriceChangeModal,
  type Guest,
  type PricingSnapshot,
} from "@/components/booking";
import { bookingApi } from "@/services/bookingApi";
import { toast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import type { PendingBookingData } from "@/types/etgBooking";

const BookingPage = () => {
  const navigate = useNavigate();
  const { hotelId } = useParams<{ hotelId: string }>();
  const { 
    selectedHotel, 
    selectedRooms, 
    searchParams, 
    getTotalPrice, 
    setBookingHash, 
    partnerOrderId,
    generateAndSetPartnerOrderId,
    residency, 
    selectedUpsells 
  } = useBookingStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPrebooking, setIsPrebooking] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookingDetails, setBookingDetails] = useState({
    countryCode: "+1",
    phoneNumber: "",
    specialRequests: "",
  });

  // Price change modal state
  const [showPriceChange, setShowPriceChange] = useState(false);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [prebookHash, setPrebookHash] = useState<string | null>(null);

  // Form state
  const [termsValid, setTermsValid] = useState(false);
  const [pricingSnapshot, setPricingSnapshot] = useState<PricingSnapshot | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && selectedHotel && selectedRooms.length > 0 && !partnerOrderId) {
      generateAndSetPartnerOrderId();
    }
  }, [isLoading, selectedHotel, selectedRooms, partnerOrderId, generateAndSetPartnerOrderId]);

  useEffect(() => {
    if (!isLoading && hotelId && selectedHotel && hotelId !== selectedHotel.id) {
      navigate(`/hoteldetails/${hotelId}`, { replace: true });
    }
  }, [hotelId, selectedHotel, isLoading, navigate]);

  // Callbacks must be defined before any early returns to satisfy React's rules of hooks
  const handleGuestsChange = useCallback((newGuests: Guest[]) => {
    setGuests(newGuests);
  }, []);

  const handleDetailsChange = useCallback((details: { countryCode: string; phoneNumber: string; specialRequests: string }) => {
    setBookingDetails(prev => ({ ...prev, ...details }));
  }, []);

  const handleTermsChange = useCallback((valid: boolean) => {
    setTermsValid(valid);
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

  const hasRequiredData = selectedHotel && selectedRooms.length > 0;

  if (!hasRequiredData) {
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
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate(-1)} className="bg-primary hover:bg-primary/90">
                  Go Back
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Search Hotels
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  const nights = searchParams?.checkIn && searchParams?.checkOut
    ? Math.max(1, differenceInDays(new Date(searchParams.checkOut), new Date(searchParams.checkIn)))
    : 1;
  const displayPrice = pricingSnapshot?.clientPrice || totalPrice;

  const validateForm = (): boolean => {
    const leadGuest = guests.find(g => g.isLead);
    if (!leadGuest) {
      toast({ title: "Missing Lead Guest", description: "Please add a lead guest with their details.", variant: "destructive" });
      return false;
    }
    if (!leadGuest.firstName || !leadGuest.lastName) {
      toast({ title: "Incomplete Guest Information", description: "Please enter the lead guest's first and last name.", variant: "destructive" });
      return false;
    }
    if (!leadGuest.email) {
      toast({ title: "Email Required", description: "Please enter the lead guest's email address.", variant: "destructive" });
      return false;
    }
    if (!termsValid) {
      toast({ title: "Terms Required", description: "Please accept all required terms and conditions.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const runPrebook = async (): Promise<{ success: boolean; priceChanged: boolean; newPrice?: number; bookingHash?: string }> => {
    const firstRoom = selectedRooms[0];
    const bookHash = firstRoom?.book_hash || firstRoom?.match_hash;

    if (!bookHash) throw new Error("No rate selected for prebook");
    if (bookHash.startsWith('room_') || bookHash.startsWith('rate_') || bookHash === 'default' || bookHash === 'fallback') {
      throw new Error("Invalid room selection - please go back and select a room with available rates");
    }
    if (!bookHash.startsWith('m-') && !bookHash.startsWith('h-') && !bookHash.startsWith('p-')) {
      throw new Error("Invalid hash format - please try selecting the room again");
    }

    const response = await bookingApi.prebook({
      book_hash: bookHash,
      residency: residency || "US",
      currency: selectedHotel?.currency || "USD",
    });

    if (response.error) throw new Error(response.error.message);

    const data = response.data as any;
    const bookingHashFromApi = data.booking_hash || data.prebooked_hash || data.book_hash;

    if (!bookingHashFromApi) throw new Error("Prebook succeeded but no booking hash was returned");

    const priceChanged = Boolean(data.price_changed);
    const newPriceVal = typeof data.new_price === "number" ? data.new_price : undefined;

    setBookingHash(bookingHashFromApi);

    if (priceChanged && typeof newPriceVal === "number") {
      return { success: true, priceChanged: true, newPrice: newPriceVal, bookingHash: bookingHashFromApi };
    }
    return { success: true, priceChanged: false, bookingHash: bookingHashFromApi };
  };

  const handleContinueToPayment = async () => {
    if (!validateForm()) return;
    setIsPrebooking(true);

    try {
      const result = await runPrebook();
      if (result.priceChanged && result.newPrice) {
        setOriginalPrice(totalPrice);
        setNewPrice(result.newPrice);
        setPrebookHash(result.bookingHash || null);
        setShowPriceChange(true);
        setIsPrebooking(false);
        return;
      }
      navigateToPayment(displayPrice, result.bookingHash);
    } catch (error) {
      toast({
        title: "Availability Error",
        description: error instanceof Error ? error.message : "Unable to confirm room availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPrebooking(false);
    }
  };

  const navigateToPayment = (finalPrice: number, bookingHash?: string) => {
    const bookingId = partnerOrderId || generateAndSetPartnerOrderId();
    const leadGuest = guests.find(g => g.isLead);
    const guestResidency = (leadGuest as Guest & { citizenship?: string })?.citizenship || residency || "US";

    const pendingBooking: PendingBookingData = {
      bookingId,
      bookingHash: bookingHash || "",
      hotel: {
        id: selectedHotel.id,
        name: selectedHotel.name,
        address: selectedHotel.address,
        city: selectedHotel.city,
        country: selectedHotel.country,
        starRating: selectedHotel.starRating,
        currency: selectedHotel.currency,
        mainImage: selectedHotel.mainImage,
      },
      rooms: selectedRooms,
      guests: guests.map(g => ({
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email,
        type: g.type,
        age: g.age,
        isLead: g.isLead,
        citizenship: (g as Guest & { citizenship?: string }).citizenship,
      })),
      bookingDetails: { ...bookingDetails, groupOfClients: "" },
      totalPrice: finalPrice,
      searchParams: searchParams!,
      pricingSnapshot: pricingSnapshot ? {
        netPrice: pricingSnapshot.netPrice,
        commission: pricingSnapshot.commission,
        commissionType: pricingSnapshot.commissionType,
        commissionValue: pricingSnapshot.commission,
        clientPrice: finalPrice,
      } : null,
      residency: guestResidency,
      upsells: selectedUpsells.map(u => ({
        id: u.id,
        type: u.type,
        name: u.name,
        price: u.price,
        currency: u.currency,
        roomId: u.roomId,
        newTime: u.newTime,
      })),
    };

    sessionStorage.setItem("pending_booking", JSON.stringify(pendingBooking));
    navigate(`/payment?booking_id=${bookingId}`);
  };

  const handleAcceptPriceChange = () => {
    setShowPriceChange(false);
    if (pricingSnapshot) {
      setPricingSnapshot({
        ...pricingSnapshot,
        netPrice: newPrice,
        clientPrice: newPrice + pricingSnapshot.commission,
      });
    }
    navigateToPayment(newPrice + (pricingSnapshot?.commission || 0), prebookHash || undefined);
  };

  const handleDeclinePriceChange = () => {
    setShowPriceChange(false);
    toast({ title: "Booking Cancelled", description: "The booking was cancelled due to the price change." });
  };


  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Booking Summary (Dark) */}
      <div className="w-full lg:w-[45%] xl:w-[40%] lg:min-h-screen lg:sticky lg:top-0">
        <BookingSummaryPanel
          hotel={selectedHotel}
          rooms={selectedRooms}
          searchParams={searchParams}
          totalPrice={totalPrice}
          clientPrice={pricingSnapshot?.clientPrice}
          commission={pricingSnapshot?.commission}
        />
      </div>

      {/* Right Panel - Guest Form (Light) */}
      <div className="w-full lg:w-[55%] xl:w-[60%] lg:min-h-screen">
        <GuestFormPanel
          rooms={selectedRooms}
          hotel={selectedHotel}
          isLoading={isPrebooking}
          onGuestsChange={handleGuestsChange}
          onDetailsChange={handleDetailsChange}
          onTermsChange={handleTermsChange}
          onContinue={handleContinueToPayment}
        />
      </div>

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
