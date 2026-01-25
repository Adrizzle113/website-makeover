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
import { clearAllLocks } from "@/lib/orderFormLock";
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
    setSearchParams,
    getTotalPrice, 
    setBookingHash,
    bookingHash,
    partnerOrderId,
    generateAndSetPartnerOrderId,
    residency, 
    selectedUpsells,
    clearRoomSelection,
    // Multiroom actions
    isMultiroomBooking,
    setPrebookedRooms,
    prebookedRooms,
    // State cleanup actions
    clearBookingState,
    clearBookingAttemptState,
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

  // Flatten rooms so each room instance is displayed separately
  // e.g., 1 entry with quantity:2 becomes 2 separate entries with quantity:1
  const flattenedRooms = useMemo(() => {
    const result: typeof selectedRooms = [];
    selectedRooms.forEach((room, originalIndex) => {
      for (let i = 0; i < room.quantity; i++) {
        result.push({
          ...room,
          roomId: room.quantity > 1 ? `${room.roomId}-instance-${i}` : room.roomId,
          quantity: 1, // Each is now individual
        });
      }
    });
    return result;
  }, [selectedRooms]);

  // Build room names map for multiroom modal
  const roomNamesMap = useMemo(() => {
    const map = new Map<number, string>();
    flattenedRooms.forEach((room, roomIndex) => {
      map.set(roomIndex, room.roomName || `Room ${roomIndex + 1}`);
    });
    return map;
  }, [flattenedRooms]);

  // Clear stale booking state on mount and generate fresh partner_order_id
  useEffect(() => {
    // Always clear previous booking attempt data to prevent double_booking_form errors
    clearBookingAttemptState();
    
    // Clear any stale order form locks from previous booking attempts
    clearAllLocks();
    
    // Short delay to allow store to hydrate from persistence
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    // Cleanup on unmount (navigating away from booking page)
    return () => {
      clearTimeout(timer);
      // Clear transient booking data when leaving the page
      clearBookingAttemptState();
    };
  }, [clearBookingAttemptState]);

  // Generate fresh partner_order_id for each booking attempt
  useEffect(() => {
    if (!isLoading && selectedHotel && selectedRooms.length > 0) {
      // Always generate a new partner_order_id for each booking attempt
      const newId = generateAndSetPartnerOrderId();
      console.log("🆕 Fresh partner_order_id for new booking attempt:", newId);
    }
  }, [isLoading, selectedHotel, selectedRooms.length, generateAndSetPartnerOrderId]);

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

    // CRITICAL: Calculate adults correctly by subtracting children from total guests
    // RateHawk requires guest composition to match original search exactly
    const totalGuestsFromParams = searchParams?.guests || 2;
    const childrenFromParams = searchParams?.childrenAges || [];
    const adultsFromParams = Math.max(1, totalGuestsFromParams - childrenFromParams.length);
    
    // Use form guest data if available, otherwise fall back to search params
    const formAdultCount = guests.filter(g => g.type === "adult").length;
    const formChildAges = guests
      .filter(g => g.type === "child" && typeof g.age === "number")
      .map(g => g.age as number);
    
    // IMPORTANT: Use search params as source of truth to ensure consistency
    const adultsCount = formAdultCount > 0 ? formAdultCount : adultsFromParams;
    const childrenAges = formChildAges.length > 0 ? formChildAges : childrenFromParams;
    
    console.log("📤 Single room prebook guest data:", {
      totalGuestsFromParams,
      childrenFromParams,
      adultsFromParams,
      formAdultCount,
      formChildAges,
      finalAdults: adultsCount,
      finalChildren: childrenAges,
    });

    const response = await bookingApi.prebook({
      book_hash: bookHash,
      residency: residency || "US",
      currency: selectedHotel?.currency || "USD",
      price_increase_percent: 20,
      guests: [{
        adults: adultsCount,
        children: childrenAges.map(age => ({ age })),
      }],
      language: "en",
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
        // Get per-room config if available, otherwise use global counts
        const roomConfig = searchParams?.roomConfigs?.[roomIndex];
        const adultsCount = roomConfig?.adults ?? Math.max(1, (searchParams?.guests || 2) - (searchParams?.childrenAges?.length || 0));
        const childrenAges = roomConfig?.childrenAges ?? searchParams?.childrenAges ?? [];
        
        console.log("📤 Multiroom prebook guest data for room", roomIndex, ":", {
          adultsCount,
          childrenAges,
          usingRoomConfig: !!roomConfig,
        });
        
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
    // CRITICAL: Store original h-... hash from selectedRooms, NOT from API response
    // The API returns book_hash as alias for booking_hash (p-...), which breaks retry
    const prebookedRoomsData: PrebookedRoom[] = data.rooms.map((room, idx) => {
      const originalRoom = selectedRooms[Math.floor(idx / (selectedRooms[0]?.quantity || 1))];
      const originalBookHash = originalRoom?.book_hash || "";
      return {
        roomIndex: room.roomIndex,
        originalRoomId: originalRoom?.roomId || "",
        booking_hash: room.booking_hash,    // p-... from prebook (for order form)
        book_hash: originalBookHash,        // Keep original h-... 
        original_book_hash: originalBookHash, // BACKUP: Never overwritten
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
    
    // CRITICAL: Build composition signature for integrity validation
    // This signature captures the exact guest composition used for prebook
    // PaymentPage will verify this matches before calling finish
    const childrenAges = searchParams?.childrenAges || [];
    const totalGuests = searchParams?.guests || 1;
    const adultsCount = Math.max(1, totalGuests - childrenAges.length);
    const sortedChildrenAges = [...childrenAges].sort((a, b) => a - b);
    const compositionSignature = `adults:${adultsCount},children:${sortedChildrenAges.join(',')}`;
    
    console.log('🔐 [navigateToPayment] Composition signature:', compositionSignature);
    
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
      // CRITICAL: Include composition signature for PaymentPage integrity validation
      compositionSignature,
    };

    // 📦 DEBUG: Log what's being stored in session
    console.log('📦 [navigateToPayment] selectedRooms cancellation data:', selectedRooms.map(r => ({
      roomId: r.roomId,
      roomName: r.roomName,
      cancellationDeadline: r.cancellationDeadline,
      hasFreeCancellationBefore: r.hasFreeCancellationBefore,
      cancellationType: r.cancellationType,
      cancellationPolicy: r.cancellationPolicy,
    })));

    // Add multiroom data if applicable
    if (isMultiroomBooking && multiroomPrebookedRooms) {
      const multiroomBooking: MultiroomPendingBookingData = {
        ...basePendingBooking,
        isMultiroom: true,
        prebookedRooms: multiroomPrebookedRooms,
      };
      console.log('📦 [navigateToPayment] Storing multiroom booking with rooms:', multiroomBooking.rooms.map(r => ({
        roomId: r.roomId,
        cancellationDeadline: r.cancellationDeadline,
        hasFreeCancellationBefore: r.hasFreeCancellationBefore,
      })));
      sessionStorage.setItem("pending_booking", JSON.stringify(multiroomBooking));
    } else {
      console.log('📦 [navigateToPayment] Storing single booking with rooms:', basePendingBooking.rooms.map(r => ({
        roomId: r.roomId,
        cancellationDeadline: r.cancellationDeadline,
        hasFreeCancellationBefore: r.hasFreeCancellationBefore,
      })));
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

  // Handle guest composition change - update searchParams and navigate back to hotel
  const handleCompositionChangeConfirmed = (newComposition: { adults: number; childrenAges: number[] }) => {
    if (searchParams) {
      const totalGuests = newComposition.adults + newComposition.childrenAges.length;
      
      // Update searchParams with new composition
      setSearchParams({
        ...searchParams,
        guests: totalGuests,
        children: newComposition.childrenAges.length,
        childrenAges: newComposition.childrenAges,
      });
      
      console.log("🔄 Guest composition updated, navigating to hotel for rate refresh:", {
        oldGuests: searchParams.guests,
        oldChildren: searchParams.childrenAges,
        newGuests: totalGuests,
        newChildren: newComposition.childrenAges,
      });
    }
    
    // Clear room selection since rates are now stale
    clearRoomSelection();
    
    // CRITICAL: Also clear booking attempt state to prevent stale hashes from being reused
    clearBookingAttemptState();
    
    // CRITICAL: Clear localStorage selectedHotel to force HotelDetailsPage to use
    // the updated searchParams from store (with correct children ages)
    try {
      localStorage.removeItem("selectedHotel");
      console.log("🗑️ Cleared localStorage selectedHotel to force fresh rate fetch with new guest composition");
    } catch (e) {
      console.warn("Failed to clear selectedHotel from localStorage:", e);
    }
    
    // Navigate back to hotel details to re-select room with new rates
    if (selectedHotel) {
      toast({
        title: "Guest Composition Updated",
        description: "Please select a room again with the updated guest count.",
      });
      navigate(`/hoteldetails/${selectedHotel.id}`);
    }
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
                    rooms={flattenedRooms}
                    hotel={selectedHotel}
                    onGuestsChange={setGuests}
                    onCompositionChangeConfirmed={handleCompositionChangeConfirmed}
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