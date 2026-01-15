import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft, AlertCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { useBookingStore } from "@/stores/bookingStore";
import { 
  GuestInformationSection, 
  BookingDetailsSection,
  BookingSummaryCard,
  ContinueToPaymentSection,
  PriceConfirmationModal,
  AgentPricingSection,
  BookingProgressIndicator,
  ArrivalTimeSection,
  TermsAndConditionsSection,
  BookingNoticesSection,
  BookingBreadcrumbs,
  SessionTimeout,
  RoomAddonsSection,
  MultiroomPriceChangeModal,
  getBookingErrorType,
  type Guest,
  type PricingSnapshot,
  type TermsState,
  type BookingErrorType,
} from "@/components/booking";
import { bookingApi } from "@/services/bookingApi";
import { toast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import type { 
  PendingBookingData, 
  MultiroomPrebookResponse,
  MultiroomPrebookParams,
  PrebookedRoom,
  MultiroomPendingBookingData,
} from "@/types/etgBooking";

const BookingPage = () => {
  const navigate = useNavigate();
  const { hotelId } = useParams<{ hotelId: string }>();
  const { 
    selectedHotel, 
    selectedRooms, 
    searchParams, 
    getTotalPrice, 
    setBookingHash,
    bookingHash,
    partnerOrderId,
    generateAndSetPartnerOrderId,
    residency, 
    selectedUpsells,
    // Multiroom actions
    isMultiroomBooking,
    setPrebookedRooms,
    prebookedRooms,
  } = useBookingStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPrebooking, setIsPrebooking] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookingDetails, setBookingDetails] = useState({
    countryCode: "+1",
    phoneNumber: "",
    groupOfClients: "",
    specialRequests: "",
  });

  // Price change modal state (single room)
  const [showPriceChange, setShowPriceChange] = useState(false);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [priceChangeType, setPriceChangeType] = useState<"increase" | "decrease" | "unavailable">("increase");

  // Multiroom price change modal state
  const [showMultiroomPriceChange, setShowMultiroomPriceChange] = useState(false);
  const [multiroomPrebookResponse, setMultiroomPrebookResponse] = useState<MultiroomPrebookResponse | null>(null);

  // Agent pricing state
  const [isPricingLocked, setIsPricingLocked] = useState(false);
  
  // New form state
  const [arrivalTime, setArrivalTime] = useState<string | null>(null);
  const [termsValid, setTermsValid] = useState(false);
  const [termsState, setTermsState] = useState<TermsState | null>(null);
  const [pricingSnapshot, setPricingSnapshot] = useState<PricingSnapshot | null>(null);
  const [bookingError, setBookingError] = useState<{ type: BookingErrorType; message?: string } | null>(null);

  // Calculate if this is a multiroom booking
  const isMultiroom = useMemo(() => isMultiroomBooking(), [selectedRooms]);

  // Build room names map for multiroom modal
  const roomNamesMap = useMemo(() => {
    const map = new Map<number, string>();
    let roomIndex = 0;
    selectedRooms.forEach((room) => {
      for (let i = 0; i < room.quantity; i++) {
        map.set(roomIndex, room.roomName || `Room ${roomIndex + 1}`);
        roomIndex++;
      }
    });
    return map;
  }, [selectedRooms]);

  useEffect(() => {
    // Short delay to allow store to hydrate from persistence
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Generate partner_order_id early when user enters booking page
  useEffect(() => {
    if (!isLoading && selectedHotel && selectedRooms.length > 0 && !partnerOrderId) {
      const newId = generateAndSetPartnerOrderId();
      console.log("Generated partner_order_id:", newId);
    }
  }, [isLoading, selectedHotel, selectedRooms, partnerOrderId, generateAndSetPartnerOrderId]);

  // Validate URL hotel ID matches store - redirect if mismatch
  useEffect(() => {
    if (!isLoading && hotelId && selectedHotel && hotelId !== selectedHotel.id) {
      navigate(`/hoteldetails/${hotelId}`, { replace: true });
    }
  }, [hotelId, selectedHotel, isLoading, navigate]);

  // Show loading state while checking store
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

  // Check if we have required data - redirect if not
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
                <Button
                  onClick={() => navigate(-1)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Go Back
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard/search")}
                >
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
  // totalPrice already includes all nights from the store
  const totalWithNights = totalPrice;

  // Use client price if available, otherwise net price
  const displayPrice = pricingSnapshot?.clientPrice || totalWithNights;

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

    // Check phone number
    if (!bookingDetails.phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a contact phone number.",
        variant: "destructive",
      });
      return false;
    }

    // Check terms and conditions
    if (!termsValid) {
      toast({
        title: "Terms Required",
        description: "Please accept all required terms and conditions.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Single room prebook (backward compatible)
  const runSingleRoomPrebook = async (): Promise<{ 
    success: boolean; 
    priceChanged: boolean; 
    newPrice?: number; 
    originalPrice?: number;
    bookingHash?: string;
    unavailable?: boolean;
  }> => {
    const firstRoom = selectedRooms[0];
    const bookHash = firstRoom?.book_hash;

    if (!bookHash) {
      throw new Error("No rate selected for prebook");
    }

    if (bookHash.startsWith('m-')) {
      console.error("Invalid hash format - received match_hash (m-...), need book_hash (h-...)");
      throw new Error("Invalid room selection - please go back and select a room with available rates.");
    }

    if (!bookHash.startsWith('h-') && !bookHash.startsWith('p-')) {
      console.error("Invalid hash format:", bookHash);
      throw new Error("Invalid room selection - please go back and select a room with available rates");
    }

    console.log("📤 Single room prebook with book_hash:", bookHash);

    const response = await bookingApi.prebook({
      book_hash: bookHash,
      residency: residency || "US",
      currency: selectedHotel?.currency || "USD",
      price_increase_percent: 20,
    });

    if (response.error) {
      if (response.error.code === "NO_AVAILABLE_RATES" || response.error.code === "RATE_NOT_FOUND") {
        console.warn("⚠️ Rate no longer available:", response.error);
        return { success: false, priceChanged: false, unavailable: true };
      }
      throw new Error(response.error.message);
    }

    const { booking_hash, price_changed, new_price, original_price } = response.data;
    setBookingHash(booking_hash);

    if (price_changed && new_price !== undefined) {
      return { 
        success: true, 
        priceChanged: true, 
        newPrice: new_price,
        originalPrice: original_price || totalWithNights,
        bookingHash: booking_hash,
      };
    }

    return { success: true, priceChanged: false, bookingHash: booking_hash };
  };

  // Multiroom prebook - handles multiple rooms in parallel
  const runMultiroomPrebook = async (): Promise<{
    success: boolean;
    partialSuccess: boolean;
    response: MultiroomPrebookResponse | null;
    prebookedRooms: PrebookedRoom[];
  }> => {
    // Build rooms array for multiroom prebook
    const rooms: MultiroomPrebookParams["rooms"] = [];
    let roomIndex = 0;

    for (const room of selectedRooms) {
      const bookHash = room.book_hash;
      
      if (!bookHash) {
        throw new Error(`No rate selected for room: ${room.roomName}`);
      }

      // For each quantity, add a separate room entry
      for (let i = 0; i < room.quantity; i++) {
        // Build guests for this room from the guests array
        // For simplicity, split guests evenly or use search params
        const adultsCount = searchParams?.guests || 2;
        const childrenAges = searchParams?.childrenAges || [];
        
        rooms.push({
          book_hash: bookHash.startsWith('h-') || bookHash.startsWith('p-') ? bookHash : undefined,
          match_hash: bookHash.startsWith('m-') ? bookHash : undefined,
          guests: [{
            adults: adultsCount,
            children: childrenAges.map(age => ({ age })),
          }],
          residency: residency || "US",
          price_increase_percent: 20,
        });
        roomIndex++;
      }
    }

    console.log(`📤 Multiroom prebook with ${rooms.length} rooms`);

    const response = await bookingApi.prebook({
      rooms,
      language: "en",
      currency: selectedHotel?.currency || "USD",
    }) as MultiroomPrebookResponse;

    if (response.error) {
      throw new Error(response.error.message);
    }

    const { data } = response;
    const allFailed = data.failed_rooms === data.total_rooms;
    const partialSuccess = data.failed_rooms > 0 && data.successful_rooms > 0;
    const anyPriceChanged = data.rooms.some(r => r.price_changed);

    // Convert to PrebookedRoom format and store
    const prebookedRoomsData: PrebookedRoom[] = data.rooms.map((room, idx) => {
      const originalRoom = selectedRooms[Math.floor(idx / (selectedRooms[0]?.quantity || 1))];
      return {
        roomIndex: room.roomIndex,
        originalRoomId: originalRoom?.roomId || "",
        booking_hash: room.booking_hash,
        book_hash: room.book_hash,
        price_changed: room.price_changed,
        new_price: room.new_price,
        original_price: room.original_price,
        currency: room.currency,
      };
    });

    setPrebookedRooms(prebookedRoomsData);

    // If first room succeeded, set its booking hash for backward compat
    if (data.rooms.length > 0) {
      setBookingHash(data.rooms[0].booking_hash);
    }

    return {
      success: !allFailed && !anyPriceChanged && !partialSuccess,
      partialSuccess,
      response,
      prebookedRooms: prebookedRoomsData,
    };
  };

  const handleContinueToPayment = async () => {
    if (!validateForm()) return;

    setIsPrebooking(true);
    setBookingError(null);

    try {
      if (isMultiroom) {
        // Multiroom flow
        const result = await runMultiroomPrebook();
        
        if (!result.response) {
          throw new Error("Failed to prebook rooms");
        }

        const { response } = result;
        const { data } = response;
        const allFailed = data.failed_rooms === data.total_rooms;
        const hasIssues = data.failed_rooms > 0 || data.rooms.some(r => r.price_changed);

        if (allFailed) {
          // All rooms unavailable - show multiroom modal
          setMultiroomPrebookResponse(response);
          setShowMultiroomPriceChange(true);
          setIsPrebooking(false);
          return;
        }

        if (hasIssues) {
          // Some rooms failed or price changed - show multiroom modal
          setMultiroomPrebookResponse(response);
          setShowMultiroomPriceChange(true);
          setIsPrebooking(false);
          return;
        }

        // All rooms succeeded without issues - proceed to payment
        setIsPricingLocked(true);
        navigateToPayment(displayPrice, data.rooms[0]?.booking_hash, true, result.prebookedRooms);
        
      } else {
        // Single room flow (existing logic)
        const result = await runSingleRoomPrebook();
        
        if (result.unavailable) {
          setPriceChangeType("unavailable");
          setShowPriceChange(true);
          setIsPrebooking(false);
          return;
        }

        if (result.priceChanged && result.newPrice) {
          const priceIncreased = result.newPrice > totalWithNights;
          setPriceChangeType(priceIncreased ? "increase" : "decrease");
          setOriginalPrice(result.originalPrice || totalWithNights);
          setNewPrice(result.newPrice);
          setShowPriceChange(true);
          setIsPrebooking(false);
          return;
        }

        setIsPricingLocked(true);
        navigateToPayment(displayPrice, result.bookingHash);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to confirm room availability";
      const errorType = getBookingErrorType(error instanceof Error ? error : new Error(errorMessage));
      
      setBookingError({
        type: errorType,
        message: errorMessage,
      });
      
      toast({
        title: "Booking Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPrebooking(false);
    }
  };

  const handleRetryBooking = () => {
    setBookingError(null);
    handleContinueToPayment();
  };

  const handleGoBackFromError = () => {
    navigate(`/hoteldetails/${selectedHotel.id}`);
  };

  const navigateToPayment = (
    finalPrice: number, 
    bookingHashParam?: string,
    isMultiroomBooking: boolean = false,
    multiroomPrebookedRooms?: PrebookedRoom[]
  ) => {
    // Use existing partner_order_id from store (generated on page load)
    const bookingId = partnerOrderId || generateAndSetPartnerOrderId();
    
    // Get lead guest citizenship for residency
    const leadGuest = guests.find(g => g.isLead);
    const guestResidency = (leadGuest as Guest & { citizenship?: string })?.citizenship || residency || "US";
    
    // Build base pending booking data
    const basePendingBooking: PendingBookingData = {
      bookingId,
      bookingHash: bookingHashParam || "",
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
      bookingDetails,
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

    // Add multiroom data if applicable
    if (isMultiroomBooking && multiroomPrebookedRooms) {
      const multiroomBooking: MultiroomPendingBookingData = {
        ...basePendingBooking,
        isMultiroom: true,
        prebookedRooms: multiroomPrebookedRooms,
      };
      sessionStorage.setItem("pending_booking", JSON.stringify(multiroomBooking));
    } else {
      sessionStorage.setItem("pending_booking", JSON.stringify(basePendingBooking));
    }

    navigate(`/payment?booking_id=${bookingId}`);
  };

  const handleAcceptPriceChange = () => {
    setShowPriceChange(false);
    
    // Lock pricing after accepting new price
    setIsPricingLocked(true);
    
    // Update pricing snapshot with new price
    if (pricingSnapshot) {
      const priceDiff = newPrice - totalWithNights;
      setPricingSnapshot({
        ...pricingSnapshot,
        netPrice: newPrice,
        clientPrice: newPrice + pricingSnapshot.commission,
      });
    }

    navigateToPayment(newPrice + (pricingSnapshot?.commission || 0), bookingHash || undefined);
  };

  const handleDeclinePriceChange = () => {
    setShowPriceChange(false);
    
    if (priceChangeType === "unavailable") {
      // Navigate back to hotel page to select a different room
      navigate(`/hoteldetails/${selectedHotel.id}`);
    } else {
      toast({
        title: "Booking Cancelled",
        description: "The booking was cancelled due to the price change.",
      });
    }
  };

  // Multiroom modal handlers
  const handleMultiroomAccept = () => {
    setShowMultiroomPriceChange(false);
    setIsPricingLocked(true);
    
    if (multiroomPrebookResponse && prebookedRooms.length > 0) {
      // Calculate new total price from prebooked rooms
      const newTotal = prebookedRooms.reduce((sum, room) => {
        return sum + (room.new_price || room.original_price || 0);
      }, 0);
      
      navigateToPayment(
        pricingSnapshot?.clientPrice || newTotal,
        prebookedRooms[0]?.booking_hash,
        true,
        prebookedRooms
      );
    }
  };

  const handleMultiroomDecline = () => {
    setShowMultiroomPriceChange(false);
    navigate(`/hoteldetails/${selectedHotel.id}`);
  };

  const handleMultiroomContinueWithAvailable = () => {
    setShowMultiroomPriceChange(false);
    setIsPricingLocked(true);
    
    // Filter to only successful rooms
    const successfulRooms = prebookedRooms.filter(room => 
      !multiroomPrebookResponse?.data.failed?.some(f => f.roomIndex === room.roomIndex)
    );
    
    if (successfulRooms.length > 0) {
      const newTotal = successfulRooms.reduce((sum, room) => {
        return sum + (room.new_price || room.original_price || 0);
      }, 0);
      
      navigateToPayment(
        pricingSnapshot?.clientPrice || newTotal,
        successfulRooms[0]?.booking_hash,
        true,
        successfulRooms
      );
    }
  };

  const handlePricingChange = (pricing: PricingSnapshot) => {
    setPricingSnapshot(pricing);
  };

  const handleUnlockRequest = async () => {
    setIsPricingLocked(false);
    toast({
      title: "Pricing Unlocked",
      description: "You can now edit the commission. Click 'Continue to Payment' to re-check availability.",
    });
  };

  const handleSessionExpire = () => {
    console.log("Session expired");
  };

  const handleSessionRestart = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {/* Hero Section - Explo Style with rounded container and hotel image */}
        <section className="relative min-h-[40vh] lg:min-h-[45vh] flex items-end px-4 py-8 md:px-8">
          {/* Rounded Container with Hotel Background Image */}
          <div
            className="absolute inset-4 md:inset-8 rounded-3xl md:rounded-[2.5rem] overflow-hidden bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${selectedHotel.mainImage || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80"}')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 container max-w-7xl w-full pb-8">
            <div className="flex items-start justify-between">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/hoteldetails/${selectedHotel.id}`)}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-full px-4 mb-4 opacity-0 animate-fade-in"
                  style={{ animationDelay: "0.1s" }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Hotel</span>
                </Button>
                
                <p 
                  className="heading-spaced text-white/80 mb-3 opacity-0 animate-fade-in"
                  style={{ animationDelay: "0.2s" }}
                >
                  Complete Your Reservation
                </p>
                
                <h1 
                  className="font-heading text-display-md md:text-display-lg text-white mb-4 opacity-0 animate-slide-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  {selectedHotel.name}
                </h1>
                
                <div 
                  className="flex flex-wrap items-center gap-3 opacity-0 animate-fade-in"
                  style={{ animationDelay: "0.4s" }}
                >
                  <div className="flex items-center gap-1 badge-pill bg-white/20 backdrop-blur-sm text-white">
                    {[...Array(selectedHotel.starRating || 0)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-gold fill-current" />
                    ))}
                  </div>
                  <span className="badge-pill bg-white/20 backdrop-blur-sm text-white">
                    {selectedHotel.city}, {selectedHotel.country}
                  </span>
                </div>
              </div>
              
              {/* Session Timer */}
              <div className="hidden md:block opacity-0 animate-fade-in" style={{ animationDelay: "0.5s" }}>
                <SessionTimeout
                  timeoutMinutes={30}
                  warningMinutes={5}
                  onExpire={handleSessionExpire}
                  onRestart={handleSessionRestart}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Progress Indicator - Floating Card Style */}
        <section className="relative -mt-6 z-20 px-4 md:px-8">
          <div className="container max-w-7xl">
            <div className="bg-card rounded-2xl shadow-card p-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <BookingProgressIndicator currentStep={2} />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-10 lg:py-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
              {/* Left Side - Forms */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-card rounded-2xl shadow-card p-6 lg:p-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                  <GuestInformationSection 
                    rooms={selectedRooms}
                    hotel={selectedHotel}
                    onGuestsChange={setGuests}
                  />
                </div>
                
                <div className="bg-card rounded-2xl shadow-card p-6 lg:p-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.15s" }}>
                  <ArrivalTimeSection 
                    defaultCheckInTime={selectedHotel.checkInTime || "15:00"}
                    onArrivalTimeChange={setArrivalTime}
                  />
                </div>
                
                <div className="bg-card rounded-2xl shadow-card p-6 lg:p-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  <RoomAddonsSection 
                    rooms={selectedRooms}
                    hotel={selectedHotel}
                  />
                </div>
                
                <div className="bg-card rounded-2xl shadow-card p-6 lg:p-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.25s" }}>
                  <BookingDetailsSection 
                    onDetailsChange={setBookingDetails}
                  />
                </div>
                
                <div className="bg-card rounded-2xl shadow-card p-6 lg:p-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                  <AgentPricingSection
                    netPrice={totalWithNights}
                    currency={selectedHotel.currency}
                    isLocked={isPricingLocked}
                    onPricingChange={handlePricingChange}
                    onUnlockRequest={handleUnlockRequest}
                  />
                </div>
                
                <div className="bg-card rounded-2xl shadow-card p-6 lg:p-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.35s" }}>
                  <BookingNoticesSection 
                    hotelName={selectedHotel.name}
                    checkInTime={selectedHotel.checkInTime}
                  />
                </div>
                
                <div className="bg-card rounded-2xl shadow-card p-6 lg:p-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                  <TermsAndConditionsSection 
                    hotelName={selectedHotel.name}
                    onValidChange={setTermsValid}
                    onTermsChange={setTermsState}
                  />
                </div>
                
                <div className="opacity-0 animate-fade-in" style={{ animationDelay: "0.45s" }}>
                  <ContinueToPaymentSection
                    totalPrice={displayPrice}
                    currency={selectedHotel.currency}
                    isLoading={isPrebooking}
                    onContinue={handleContinueToPayment}
                    error={bookingError}
                    onRetry={handleRetryBooking}
                    onGoBack={handleGoBackFromError}
                  />
                </div>
              </div>

              {/* Right Side - Summary - Floating Sticky Card */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-8 opacity-0 animate-slide-in-right" style={{ animationDelay: "0.3s" }}>
                  <div className="bg-card rounded-3xl shadow-card overflow-hidden">
                    <BookingSummaryCard
                      hotel={selectedHotel}
                      rooms={selectedRooms}
                      searchParams={searchParams}
                      totalPrice={totalPrice}
                      isLoading={isPrebooking}
                      clientPrice={pricingSnapshot?.clientPrice}
                      commission={pricingSnapshot?.commission}
                      taxes={selectedRooms.flatMap(room => room.taxes || [])}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Price Change / Unavailable Modal (Single Room) */}
      <PriceConfirmationModal
        open={showPriceChange}
        onOpenChange={setShowPriceChange}
        type={priceChangeType}
        originalPrice={originalPrice}
        newPrice={newPrice}
        currency={selectedHotel.currency}
        onAccept={handleAcceptPriceChange}
        onDecline={handleDeclinePriceChange}
      />

      {/* Multiroom Price Change Modal */}
      {multiroomPrebookResponse && (
        <MultiroomPriceChangeModal
          open={showMultiroomPriceChange}
          onOpenChange={setShowMultiroomPriceChange}
          prebookResponse={multiroomPrebookResponse}
          roomNames={roomNamesMap}
          currency={selectedHotel.currency}
          onAccept={handleMultiroomAccept}
          onDecline={handleMultiroomDecline}
          onContinueWithAvailable={handleMultiroomContinueWithAvailable}
        />
      )}
    </div>
  );
};

export default BookingPage;