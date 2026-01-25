import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft, AlertCircle, Lock, Bug, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookingProgressIndicator } from "@/components/booking/BookingProgressIndicator";
import { PaymentFormPanel } from "@/components/booking/PaymentFormPanel";
import { PaymentSummaryPanel } from "@/components/booking/PaymentSummaryPanel";
import { PriceConfirmationModal } from "@/components/booking/PriceConfirmationModal";
import { BillingAddress } from "@/components/booking/BillingAddressSection";
import { bookingApi } from "@/services/bookingApi";
import { toast } from "@/hooks/use-toast";
import {
  detectCardType,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
} from "@/lib/cardValidation";
import { getMockPendingBookingData } from "@/lib/mockBookingData";
import { sanitizeGuestName } from "@/lib/guestValidation";
import { 
  acquireLock, 
  releaseLock, 
  getCachedOrderForms, 
  clearLock, 
  clearAllLocks 
} from "@/lib/orderFormLock";
import type { 
  PendingBookingData, 
  PaymentType,
  PaymentTypeDetail,
  MultiroomPendingBookingData,
  OrderFormData,
  MultiroomOrderFinishParams,
  MultiroomGuests,
  MultiroomFailedRoom,
} from "@/types/etgBooking";
import { PartialRoomFailureModal } from "@/components/booking/PartialRoomFailureModal";

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  // Page states
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingPrice, setIsVerifyingPrice] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingData, setBookingData] = useState<PendingBookingData | MultiroomPendingBookingData | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("deposit");
  
  // ETG API order form data (single room)
  const [orderId, setOrderId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [formDataLoaded, setFormDataLoaded] = useState(false);

  // Multiroom order form data
  const [multiroomOrderForms, setMultiroomOrderForms] = useState<OrderFormData[]>([]);
  const [isMultiroom, setIsMultiroom] = useState(false);

  // Dynamic payment methods from API
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentType[]>(["deposit", "hotel", "now_net", "now_gross"]);
  // Full payment types with amounts (for finish request)
  const [paymentTypesData, setPaymentTypesData] = useState<PaymentTypeDetail[]>([]);
  // Recommended payment type from backend (priority: hotel > now > deposit)
  const [recommendedPaymentType, setRecommendedPaymentType] = useState<PaymentTypeDetail | null>(null);
  
  // Payota tokenization data (UUIDs are generated at payment time, not from API)
  const [isNeedCreditCardData, setIsNeedCreditCardData] = useState(false);
  const [isNeedCvc, setIsNeedCvc] = useState(true); // Default true for safety

  // Price confirmation state
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceModalType, setPriceModalType] = useState<"increase" | "decrease" | "unavailable">("increase");
  const [originalPrice, setOriginalPrice] = useState(0);
  const [verifiedPrice, setVerifiedPrice] = useState(0);
  const [priceVerified, setPriceVerified] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(false);

  // Payment error state
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Track if payment was attempted - prevents order form reload after payment failure
  const [paymentAttempted, setPaymentAttempted] = useState(false);

  // Session expired state - for recovery UI
  const [sessionExpired, setSessionExpired] = useState(false);

  // Partial room failure state - for multiroom bookings
  const [failedRooms, setFailedRooms] = useState<MultiroomFailedRoom[]>([]);
  const [showPartialFailureModal, setShowPartialFailureModal] = useState(false);
  
  // Retry state
  const [isRetrying, setIsRetrying] = useState(false);
  const [isRetryInProgress, setIsRetryInProgress] = useState(false);
  
  // Auto-recovery ref - prevents infinite loops when auto-retrying on stale sessions
  const autoRecoveryAttemptedRef = useRef(false);

  // Debug mode (enabled by ?debug=1)
  const isDebugMode = searchParams.get("debug") === "1";
  const [copiedDebug, setCopiedDebug] = useState(false);

  // Card validation errors
  const [cardErrors, setCardErrors] = useState<{
    cardNumber?: string;
    cardholderName?: string;
    expiryDate?: string;
    cvv?: string;
  }>({});

  // Billing address state
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [billingErrors, setBillingErrors] = useState<Partial<Record<keyof BillingAddress, string>>>({});

  // Detect card type from card number
  const cardType = useMemo(() => detectCardType(cardNumber), [cardNumber]);

  // Guard: Ensure selected paymentType is always valid (exists in availablePaymentMethods)
  useEffect(() => {
    if (availablePaymentMethods.length === 0) return;
    
    const isCurrentTypeAvailable = availablePaymentMethods.includes(paymentType);
    
    if (!isCurrentTypeAvailable) {
      // Current payment type is not available - switch to a valid fallback
      const fallback = availablePaymentMethods.includes("hotel") 
        ? "hotel" 
        : availablePaymentMethods.includes("deposit") 
          ? "deposit" 
          : availablePaymentMethods[0];
      
      console.log(`⚠️ Payment type "${paymentType}" not available - switching to "${fallback}"`);
      setPaymentType(fallback);
      
      // Show toast if this was a card payment type that's now unavailable
      if (paymentType === "now_net" || paymentType === "now_gross") {
        toast({
          title: "Card Payment Unavailable",
          description: "Card payment is not available for this booking. Please use an alternative payment method.",
        });
      }
    }
  }, [availablePaymentMethods, paymentType]);

  // Warn user if they try to navigate away during retry
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRetryInProgress) {
        e.preventDefault();
        e.returnValue = "Your booking session is being refreshed. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isRetryInProgress]);

  // Safety timeout - if retry overlay is shown for more than 30 seconds, reset it
  useEffect(() => {
    if (isRetryInProgress) {
      const timeout = setTimeout(() => {
        console.warn("⚠️ Retry timeout - resetting loading state after 30 seconds");
        setIsRetryInProgress(false);
        setIsRetrying(false);
        toast({
          title: "Session Refresh Timeout",
          description: "The booking session refresh took too long. Please try again or start a fresh booking.",
          variant: "destructive",
        });
      }, 30000);
      
      return () => clearTimeout(timeout);
    }
  }, [isRetryInProgress]);

  useEffect(() => {
    const loadAndVerify = async () => {
      const storedData = sessionStorage.getItem("pending_booking");
      if (!storedData) {
        setIsLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(storedData);
        if (parsed.bookingId !== bookingId) {
          setIsLoading(false);
          return;
        }

        setBookingData(parsed);
        
        // 📥 DEBUG: Log what's loaded from session storage
        console.log('📥 [PaymentPage] Loaded booking data rooms:', parsed.rooms?.map((r: any) => ({
          roomId: r.roomId,
          roomName: r.roomName,
          cancellationDeadline: r.cancellationDeadline,
          hasFreeCancellationBefore: r.hasFreeCancellationBefore,
          cancellationType: r.cancellationType,
          cancellationPolicy: r.cancellationPolicy,
        })));
        
        // 🔐 Log composition signature for debugging
        console.log('🔐 [PaymentPage] Composition signature from booking:', parsed.compositionSignature);
        
        // CRITICAL: Validate composition signature matches guest list
        // This catches cases where guests were modified after prebook
        if (parsed.compositionSignature) {
          const guestList = parsed.guests || [];
          const adults = guestList.filter((g: any) => g.type === 'adult').length;
          const childAges = guestList
            .filter((g: any) => g.type === 'child')
            .map((g: any) => g.age || 0)
            .sort((a: number, b: number) => a - b);
          const currentSignature = `adults:${adults},children:${childAges.join(',')}`;
          
          if (currentSignature !== parsed.compositionSignature) {
            console.error('❌ [PaymentPage] Composition mismatch!');
            console.error(`   Expected: ${parsed.compositionSignature}`);
            console.error(`   Current:  ${currentSignature}`);
            // Allow proceeding but log the mismatch for debugging
          } else {
            console.log('✅ [PaymentPage] Composition signature validated');
          }
        }
        
        setOriginalPrice(parsed.totalPrice || 0);
        setIsLoading(false);

        await verifyPrice(parsed);
        await loadOrderForm(parsed);
      } catch (e) {
        console.error("Failed to parse booking data:", e);
        setIsLoading(false);
      }
    };

    loadAndVerify();
  }, [bookingId]);

  // Load order form to get order_id and item_id for finish step
  const loadOrderForm = async (data: PendingBookingData | MultiroomPendingBookingData) => {
    // Check if this is a multiroom booking
    const multiroomData = data as MultiroomPendingBookingData;
    const isMultiroomBooking = multiroomData.isMultiroom && multiroomData.prebookedRooms && multiroomData.prebookedRooms.length > 1;
    setIsMultiroom(isMultiroomBooking);

    if (isMultiroomBooking) {
      // Multiroom order form flow
      await loadMultiroomOrderForm(multiroomData);
    } else {
      // Single room order form flow
      await loadSingleRoomOrderForm(data);
    }
  };

  // Load single room order form (existing logic)
  const loadSingleRoomOrderForm = async (data: PendingBookingData) => {
    if (!data.bookingHash || !data.bookingId) {
      console.warn("Missing bookingHash or bookingId for order form");
      setFormDataLoaded(true);
      return;
    }

    // CRITICAL: Validate that bookingHash is a prebooked hash (p-...)
    // If it's not, the order form will be created with wrong guest composition
    if (!data.bookingHash.startsWith('p-')) {
      console.error(`❌ Invalid bookingHash format: ${data.bookingHash.substring(0, 10)}...`);
      console.error(`   Expected p-... (from prebook), got ${data.bookingHash.substring(0, 2)}-...`);
      console.error(`   This will cause incorrect_children_data errors. Blocking payment.`);
      
      // Clear stale session and show error
      sessionStorage.removeItem("pending_booking");
      setFormDataLoaded(true);
      
      toast({
        title: "Booking Session Invalid",
        description: "Your booking session is stale. Please go back to the hotel and select a room again.",
        variant: "destructive",
      });
      return;
    }

    // CROSS-MOUNT RECOVERY: Check for cached order forms from lock (survives StrictMode remount)
    const cachedFromLock = getCachedOrderForms(data.bookingId);
    if (cachedFromLock && cachedFromLock.length > 0) {
      console.log("📦 Using cached order form from lock storage (cross-mount recovery)");
      const firstRoom = cachedFromLock[0];
      if (firstRoom) {
        setOrderId(firstRoom.order_id);
        setItemId(firstRoom.item_id);
        setIsNeedCreditCardData(firstRoom.is_need_credit_card_data || false);
        setIsNeedCvc(firstRoom.is_need_cvc ?? true);
      }
      setFormDataLoaded(true);
      return;
    }

    // CROSS-MOUNT LOCK: Prevent duplicate API calls from StrictMode double-mounting
    if (!acquireLock(data.bookingId)) {
      console.log("⏭️ Order form request already in flight (cross-mount lock), skipping duplicate call");
      return;
    }

    // Skip if already loaded or loading (React state guard - may not survive remount)
    if (formDataLoaded || isLoadingForm) {
      console.log("⏭️ Order form already loaded or loading, skipping API call");
      releaseLock(data.bookingId); // Release lock since we're not making the call
      return;
    }
    
    if (paymentAttempted && orderId && itemId) {
      console.log("⏭️ Payment already attempted with valid order data - skipping reload");
      releaseLock(data.bookingId);
      return;
    }

    // Check if we already have cached order form data from a previous session
    const cachedData = data as any;
    if (cachedData.orderId && cachedData.itemId && cachedData.paymentTypesData) {
      console.log("📦 Using cached order form data from session storage");
      setOrderId(cachedData.orderId);
      setItemId(cachedData.itemId);
      setFormDataLoaded(true);
      
      // Restore payment types data
      if (Array.isArray(cachedData.paymentTypesData) && cachedData.paymentTypesData.length > 0) {
        setPaymentTypesData(cachedData.paymentTypesData);
        
        // Rebuild available payment methods from cached data
        const paymentMethods: PaymentType[] = [];
        cachedData.paymentTypesData.forEach((pt: any) => {
          if (pt.type === "now") {
            paymentMethods.push("now_net", "now_gross");
            setIsNeedCreditCardData(pt.is_need_credit_card_data || false);
            setIsNeedCvc(pt.is_need_cvc ?? true);
          } else if (pt.type === "hotel") {
            paymentMethods.push("hotel");
          } else if (pt.type === "deposit") {
            paymentMethods.push("deposit");
          }
        });
        
        if (paymentMethods.length > 0) {
          setAvailablePaymentMethods(paymentMethods);
        }
        
        // Restore recommended payment type
        if (cachedData.recommendedPaymentType) {
          setRecommendedPaymentType(cachedData.recommendedPaymentType);
        }
        
        // Set default payment type - prefer card/hotel over deposit (deposit requires agency balance)
        const defaultType = paymentMethods.includes("now_net") ? "now_net" : 
                            paymentMethods.includes("now_gross") ? "now_gross" :
                            paymentMethods.includes("hotel") ? "hotel" : 
                            paymentMethods[0] || "deposit";
        const selectedType = cachedData.selectedPaymentType || defaultType;
        setPaymentType(selectedType);
      }
      
      toast({
        title: "Session Restored",
        description: "Your booking session was restored successfully.",
      });
      return;
    }

    setIsLoadingForm(true);

    try {
      const formResponse = await bookingApi.getOrderForm(
        data.bookingHash,
        data.bookingId
      );

      if (formResponse.error) {
        throw new Error(formResponse.error.message);
      }

      const roomsFromResponse = (formResponse.data as any).rooms || [];
      const primaryRoomFromResponse = roomsFromResponse[0] as any;
      const resolvedOrderId = formResponse.data.order_id ?? primaryRoomFromResponse?.order_id;
      const resolvedItemId = formResponse.data.item_id ?? primaryRoomFromResponse?.item_id;
      setOrderId(resolvedOrderId);
      setItemId(resolvedItemId);
      setFormDataLoaded(true);

      // Cache in lock storage for cross-mount recovery
      releaseLock(data.bookingId, [{
        order_id: resolvedOrderId,
        item_id: resolvedItemId,
        is_need_credit_card_data: false, // Will be updated below
        is_need_cvc: true,
      }]);

      // Handle recovered orders (from double_booking_form recovery)
      if ((formResponse.data as any)._recovered) {
        console.log("🔄 Using recovered order from previous booking attempt");
        toast({
          title: "Booking Recovered",
          description: "Your previous booking session was restored successfully.",
        });
      }

      // Store full payment types data with amounts
      const paymentTypesArray = formResponse.data.payment_types || 
        roomsFromResponse.flatMap((room: any) => room.payment_types || []);
      if (paymentTypesArray.length > 0) {
        setPaymentTypesData(paymentTypesArray);
      }

      // Find the "now" payment type to check card payment requirements
      const nowPaymentType = paymentTypesArray.find(
        (pt: any) => pt.type === "now"
      );

      // Extract card requirement fields from the "now" payment type
      // Note: pay_uuid and init_uuid are NOT from the API - they're generated at payment time
      if (nowPaymentType) {
        setIsNeedCreditCardData(nowPaymentType.is_need_credit_card_data || false);
        setIsNeedCvc(nowPaymentType.is_need_cvc ?? true);
        
        console.log("💳 Card payment config:", {
          is_need_credit_card_data: nowPaymentType.is_need_credit_card_data,
          is_need_cvc: nowPaymentType.is_need_cvc,
        });
      } else {
        // No "now" payment type available - card payment not supported
        setIsNeedCreditCardData(false);
      }

      // Determine available payment methods from the payment_types array
      // UUIDs are generated client-side, so we always allow "now" if it's in the response
      const paymentMethods: PaymentType[] = [];
      let hasValidCardPayment = false;
      
      paymentTypesArray.forEach((pt: any) => {
        if (pt.type === "now") {
          // Card payment is available - UUIDs will be generated at payment time
          hasValidCardPayment = true;
          paymentMethods.push("now_net", "now_gross");
        } else if (pt.type === "hotel") {
          paymentMethods.push("hotel");
        } else if (pt.type === "deposit") {
          paymentMethods.push("deposit");
        }
      });
      
      console.log('🏨 [PaymentPage] Available payment methods:', paymentMethods);
      
      // Only use API-provided payment methods - no forced fallbacks
      // If no payment methods available, show error state
      if (paymentMethods.length === 0) {
        console.error("❌ No payment methods available from API");
        toast({
          title: "Payment Not Available",
          description: "No payment methods available for this booking. Please go back and try a different rate.",
          variant: "destructive",
        });
      }
      setAvailablePaymentMethods(paymentMethods);

      // Store and auto-select recommended payment type (only if it's actually available)
      const recommendedPaymentType = formResponse.data.recommended_payment_type || 
        primaryRoomFromResponse?.recommended_payment_type;
      if (recommendedPaymentType) {
        const recommended = recommendedPaymentType;
        setRecommendedPaymentType(recommended);
        
        // Map API type to UI type (e.g., "now" might need to map to "now_net")
        let uiPaymentType: PaymentType = recommended.type === "now" ? "now_net" : recommended.type;
        
        // Only auto-select if the recommended type is actually available
        if (recommended.type === "now" && !hasValidCardPayment) {
          console.warn("⚠️ Recommended 'now' payment not available (missing UUIDs) - falling back");
          uiPaymentType = paymentMethods.includes("hotel") ? "hotel" : 
                          paymentMethods.includes("now_net") ? "now_net" : 
                          paymentMethods[0] || "deposit";
        } else if (!paymentMethods.includes(uiPaymentType) && !(uiPaymentType === "now_net" && paymentMethods.includes("now_net"))) {
          // If recommended type not in available methods, fallback
          uiPaymentType = paymentMethods.includes("hotel") ? "hotel" : 
                          paymentMethods.includes("now_net") ? "now_net" : 
                          paymentMethods[0] || "deposit";
        }
        
        setPaymentType(uiPaymentType);
        console.log("💡 Auto-selected payment type:", uiPaymentType, "(recommended:", recommended.type, ")");
      } else {
        // No recommendation - default to card payment or hotel (deposit requires agency balance)
        const defaultType = paymentMethods.includes("now_net") ? "now_net" : 
                            paymentMethods.includes("now_gross") ? "now_gross" :
                            paymentMethods.includes("hotel") ? "hotel" : 
                            paymentMethods[0] || "deposit";
        setPaymentType(defaultType);
        console.log("💡 No recommended payment type - defaulting to:", defaultType);
      }

      console.log("📋 Single room order form loaded:", {
        orderId: resolvedOrderId,
        paymentTypes: paymentMethods,
        paymentTypesData: paymentTypesArray,
        recommendedPaymentType: recommendedPaymentType?.type,
      });

      // Persist order form data to survive page refresh
      const updatedData = { 
        ...data, 
        orderId: resolvedOrderId,
        itemId: resolvedItemId,
        // Cache payment types data for session recovery
        paymentTypesData: paymentTypesArray,
        recommendedPaymentType: recommendedPaymentType || null,
        selectedPaymentType: paymentType,
      };
      setBookingData(updatedData);
      sessionStorage.setItem("pending_booking", JSON.stringify(updatedData));

    } catch (error) {
      // Release lock on failure (allows retry)
      releaseLock(data.bookingId);
      
      console.error("Failed to load order form:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRecoverableError = errorMessage.toLowerCase().includes("double_booking_form") || 
                                  errorMessage.toLowerCase().includes("booking form already exists") ||
                                  errorMessage.toLowerCase().includes("already exists for this book_hash");
      const isSessionExpired = errorMessage.toLowerCase().includes("booking session expired");
      
      // If recovery was attempted but failed (session expired), show recovery UI
      if (isRecoverableError || isSessionExpired) {
        console.log("⚠️ Order form issue detected - showing session expired UI");
        setSessionExpired(true);
        
        toast({
          title: "Booking Session Issue",
          description: "Your booking session has a conflict. Please start a fresh booking.",
          variant: "default",
        });
        
        setFormDataLoaded(true);
        return;
      }
      
      setFormDataLoaded(true);
      
      toast({
        title: "Form Loading Warning",
        description: "Unable to prepare booking form. You may continue, but booking might fail.",
        variant: "default",
      });
    } finally {
      setIsLoadingForm(false);
    }
  };

  // Load multiroom order forms
  const loadMultiroomOrderForm = async (data: MultiroomPendingBookingData, forceRefresh: boolean = false) => {
    if (!data.prebookedRooms || data.prebookedRooms.length === 0) {
      console.warn("No prebooked rooms for multiroom order form");
      setFormDataLoaded(true);
      return;
    }

    // If not forcing refresh, allow using cached results (fast path)
    if (!forceRefresh) {
      // CROSS-MOUNT RECOVERY: Check for cached order forms from lock (survives StrictMode remount)
      const cachedFromLock = getCachedOrderForms(data.bookingId);
      if (cachedFromLock && cachedFromLock.length > 0) {
        console.log("📦 Using cached order forms from lock storage (cross-mount recovery)");
        setMultiroomOrderForms(cachedFromLock);
        setFormDataLoaded(true);

        // Restore first room's data for card payment config
        const firstRoom = cachedFromLock[0];
        if (firstRoom) {
          setOrderId(firstRoom.order_id);
          setItemId(firstRoom.item_id);
          setIsNeedCreditCardData(firstRoom.is_need_credit_card_data || false);
          setIsNeedCvc(firstRoom.is_need_cvc ?? true);
        }
        return;
      }
    } else {
      console.log("🔄 Force refresh enabled - bypassing cache/state guards");
    }

    // ALWAYS use the cross-mount lock to avoid duplicate /order/form calls,
    // which can trigger "booking form already exists" errors.
    if (!acquireLock(data.bookingId)) {
      console.log("⏭️ Order form request already in flight (cross-mount lock), skipping duplicate call");
      return;
    }

    // Skip if already loaded or loading (unless forcing refresh)
    if (!forceRefresh && (formDataLoaded || isLoadingForm)) {
      console.log("⏭️ Multiroom order form already loaded or loading, skipping API call");
      releaseLock(data.bookingId); // Release lock since we're not making the call
      return;
    }

    // Check if we already have cached multiroom order form data in session storage (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = data as any;
      if (cachedData.multiroomOrderForms && Array.isArray(cachedData.multiroomOrderForms) && cachedData.multiroomOrderForms.length > 0) {
        console.log("📦 Using cached multiroom order form data from session storage");
        setMultiroomOrderForms(cachedData.multiroomOrderForms);
        setFormDataLoaded(true);

        // Cache in lock for future cross-mount recovery
        releaseLock(data.bookingId, cachedData.multiroomOrderForms);

        // Restore first room's data for card payment config
        const firstRoom = cachedData.multiroomOrderForms[0];
        if (firstRoom) {
          setOrderId(firstRoom.order_id);
          setItemId(firstRoom.item_id);
          setIsNeedCreditCardData(firstRoom.is_need_credit_card_data || false);
          setIsNeedCvc(firstRoom.is_need_cvc ?? true);

          // Restore payment methods if cached
          if (cachedData.availablePaymentMethods) {
            setAvailablePaymentMethods(cachedData.availablePaymentMethods);
          }
          if (cachedData.selectedPaymentType) {
            setPaymentType(cachedData.selectedPaymentType);
          }
        }

        toast({
          title: "Session Restored",
          description: "Your booking session was restored successfully.",
        });
        return;
      }
    }

    setIsLoadingForm(true);

    try {
      // Build prebooked_rooms array from prebookedRooms - backend expects field named "book_hash"
      const prebookedRoomsForApi = data.prebookedRooms.map(room => ({
        book_hash: room.booking_hash,
      }));

      console.log(`📋 Loading multiroom order form for ${prebookedRoomsForApi.length} rooms`);

      const formResponse = await bookingApi.getMultiroomOrderForm(
        prebookedRoomsForApi,
        data.bookingId,
        "en"
      );

      if (formResponse.error) {
        throw new Error(formResponse.error.message);
      }

      // Check for partial failures
      if (formResponse.data.failed_rooms > 0) {
        console.warn(`⚠️ ${formResponse.data.failed_rooms} room(s) failed to get order form`);
        
        // Log detailed error info for debugging
        if (formResponse.data.failed && formResponse.data.failed.length > 0) {
          formResponse.data.failed.forEach((failedRoom) => {
            console.error(`Room ${failedRoom.roomIndex + 1} failed:`, {
              error: failedRoom.error,
              code: failedRoom.code,
              book_hash: failedRoom.book_hash,
            });
          });
          
          // Store failed rooms for modal display
          setFailedRooms(formResponse.data.failed);
          setShowPartialFailureModal(true);
        } else {
          // Fallback to toast if no detailed failure info
          toast({
            title: "Some Rooms Unavailable",
            description: `${formResponse.data.failed_rooms} room(s) could not be processed.`,
            variant: "default",
          });
        }
      }

      // Store order forms for each room
      const orderForms: OrderFormData[] = formResponse.data.rooms.map(room => {
        const roomPaymentTypes = (room.payment_types || [])
          .map((pt: any) => (typeof pt === "string" ? pt : pt.type))
          .filter(Boolean);

        return {
          roomIndex: room.roomIndex,
          order_id: String(room.order_id),
          item_id: String(room.item_id),
          booking_hash: room.booking_hash,
          payment_types: roomPaymentTypes,
          is_need_credit_card_data: room.is_need_credit_card_data,
          is_need_cvc: room.is_need_cvc,
        };
      });

      // Cache order forms in lock storage for cross-mount recovery
      releaseLock(data.bookingId, orderForms);

      setMultiroomOrderForms(orderForms);
      setFormDataLoaded(true);

      // Use first room's data for card payment config
      if (orderForms.length > 0) {
        const firstRoom = orderForms[0];
        setOrderId(firstRoom.order_id);
        setItemId(firstRoom.item_id);
        setIsNeedCreditCardData(firstRoom.is_need_credit_card_data || false);
        setIsNeedCvc(firstRoom.is_need_cvc ?? true);
        
        // Extract payment types with amounts for multiroom (use first room's payment types)
        const firstRoomFromResponse = formResponse.data.rooms[0];
        if (firstRoomFromResponse?.payment_types_detail) {
          setPaymentTypesData(firstRoomFromResponse.payment_types_detail);
        } else {
          const flatPaymentTypes = formResponse.data.rooms
            .flatMap((room: any) => room.payment_types || [])
            .filter((pt: any) => typeof pt === "object");
          if (flatPaymentTypes.length > 0) {
            setPaymentTypesData(flatPaymentTypes);
          }
        }
        
      }

      // Get common payment types (intersection of all rooms)
      // UUIDs are generated client-side, so we always allow "now" if available
      const commonPaymentTypes = formResponse.data.payment_types_available || 
        orderForms.reduce((common, room) => {
          if (common.length === 0) return room.payment_types;
          return common.filter(type => room.payment_types.includes(type));
        }, [] as PaymentType[]);

      const paymentMethods: PaymentType[] = [];
      commonPaymentTypes.forEach(type => {
        if (type === "now") {
          // Card payment is available - UUIDs will be generated at payment time
          paymentMethods.push("now_net", "now_gross");
        } else {
          paymentMethods.push(type);
        }
      });
      
      // Only use API-provided payment methods - no forced fallbacks
      if (paymentMethods.length === 0) {
        console.error("❌ No payment methods available from API for multiroom");
      }
      setAvailablePaymentMethods(paymentMethods);

      // Store and auto-select recommended payment type from first room (only if available)
      const firstRoomFromResponse = formResponse.data.rooms[0];
      if (firstRoomFromResponse?.recommended_payment_type) {
        const recommended = firstRoomFromResponse.recommended_payment_type;
        setRecommendedPaymentType(recommended);
        
        // Map API type to UI type
        let uiPaymentType: PaymentType = recommended.type === "now" ? "now_net" : recommended.type;
        
        // Check if recommended type is in available methods
        if (!paymentMethods.includes(uiPaymentType) && !(uiPaymentType === "now_net" && paymentMethods.includes("now_net"))) {
          uiPaymentType = paymentMethods.includes("hotel") ? "hotel" : 
                          paymentMethods.includes("now_net") ? "now_net" : 
                          paymentMethods[0] || "deposit";
        }
        
        setPaymentType(uiPaymentType);
        console.log("💡 Multiroom: Auto-selected payment type:", uiPaymentType);
      } else {
        // No recommendation - default to hotel or now_net
        const defaultType = paymentMethods.includes("hotel") ? "hotel" : 
                            paymentMethods.includes("now_net") ? "now_net" : 
                            paymentMethods[0] || "deposit";
        setPaymentType(defaultType);
      }

      console.log("📋 Multiroom order forms loaded:", {
        totalRooms: orderForms.length,
        paymentTypes: paymentMethods,
      });

      // Update booking data with order forms and cache for session recovery
      const updatedData: MultiroomPendingBookingData = { 
        ...data, 
        orderForms,
        // Cache additional data for session recovery
        multiroomOrderForms: orderForms,
        availablePaymentMethods: paymentMethods,
        selectedPaymentType: paymentType,
      } as any;
      setBookingData(updatedData);
      sessionStorage.setItem("pending_booking", JSON.stringify(updatedData));

    } catch (error) {
      // Release lock on failure (allows retry)
      releaseLock(data.bookingId);
      
      console.error("Failed to load multiroom order form:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRecoverableError = errorMessage.toLowerCase().includes("double_booking_form") || 
                                  errorMessage.toLowerCase().includes("booking form already exists") ||
                                  errorMessage.toLowerCase().includes("already exists for this book_hash");
      const isSessionExpiredError = errorMessage.toLowerCase().includes("booking session expired");
      
      // CRITICAL: If this is a forceRefresh (called from handleRetryWithNewSession), 
      // always reset retry progress to prevent stuck overlay
      if (forceRefresh) {
        console.log("⚠️ forceRefresh failed - resetting retry progress");
        setIsRetryInProgress(false);
        setIsRetrying(false);
      }
      
      // AUTO-RECOVERY: If this is a stale session conflict and we haven't tried auto-recovery yet,
      // automatically generate a new booking ID and re-prebook (same as "Retry with New Session")
      if ((isRecoverableError || isSessionExpiredError) && !autoRecoveryAttemptedRef.current && !forceRefresh) {
        console.log("🔄 Auto-recovery: Detected stale booking session, generating new booking ID...");
        autoRecoveryAttemptedRef.current = true;
        setIsRetryInProgress(true); // Show loading overlay
        
        try {
          // Wait a tick to ensure state updates are processed
          await new Promise(resolve => setTimeout(resolve, 50));
          // Pass current bookingData directly to avoid state timing issues
          await handleRetryWithNewSession(data as MultiroomPendingBookingData);
          return; // handleRetryWithNewSession will reload the forms
        } catch (retryError) {
          console.error("❌ Auto-recovery failed:", retryError);
          setIsRetryInProgress(false);
          setIsRetrying(false);
          // Fall through to show the manual recovery modal
        }
      }
      
      // If recovery was attempted (manual or auto) but failed, show session expired UI
      if (isRecoverableError || isSessionExpiredError) {
        console.log("⚠️ Multiroom order form issue detected - showing session expired UI");
        setSessionExpired(true);
        
        toast({
          title: "Booking Session Issue",
          description: "Your booking session has a conflict. Please start a fresh booking.",
          variant: "default",
        });
        
        setFormDataLoaded(true);
        return;
      }
      
      setFormDataLoaded(true);
      
      toast({
        title: "Form Loading Error",
        description: "Unable to prepare booking forms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingForm(false);
    }
  };

  /**
   * Retry with new session - clears locks, generates new booking ID, re-prebooks (for multiroom),
   * and reloads order forms. This properly refreshes `booking_hash` values which are one-time tokens.
   * 
   * ETG API: "does not support different room types at one rate" + booking_hash is single-use.
   */
  const handleRetryWithNewSession = async (dataOverride?: MultiroomPendingBookingData) => {
    // Use passed data (for auto-recovery) or current state
    const data = dataOverride || bookingData;
    
    if (!data) {
      console.error("❌ handleRetryWithNewSession: No booking data available");
      setIsRetryInProgress(false);
      setIsRetrying(false);
      return;
    }
    
    // DON'T reset autoRecoveryAttemptedRef here - that causes infinite loops
    // It's reset when user manually clicks retry (via the button handler)
    
    setIsRetrying(true);
    setIsRetryInProgress(true); // Block UI with overlay
    setShowPartialFailureModal(false);
    setSessionExpired(false);
    
    try {
      // 1. Clear all existing locks
      if (data.bookingId) {
        clearLock(data.bookingId);
      }
      clearAllLocks();
      
      // 2. Generate new booking ID
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newBookingId = `BK-${timestamp}-${random}`;
      
      console.log(`🔄 Retry with new session: ${data.bookingId} → ${newBookingId}`);
      
      // 3. For multiroom bookings, we need to re-prebook to get fresh booking_hash values
      const multiroomData = data as MultiroomPendingBookingData;
      const prebookedRooms = multiroomData.prebookedRooms;
      
      // Check if we have the original book_hash values to re-prebook
      // They could be in prebookedRooms (from previous prebook) or in the raw session data
      const rawData = data as any;
      const hasOriginalHashes = prebookedRooms?.some((r) => r.book_hash) || 
                                 rawData.selectedRooms?.some((r: any) => r.book_hash);
      
      if (multiroomData.isMultiroom && hasOriginalHashes && prebookedRooms && prebookedRooms.length > 0) {
        console.log(`🔄 Re-prebooking ${prebookedRooms.length} rooms...`);
        
        // Build prebook request using ORIGINAL book_hash values
        // CRITICAL: Use original_book_hash (never overwritten) to ensure we use h-... not p-...
        const prebookRoomsPayload = prebookedRooms.map((room) => {
          // Prefer original_book_hash, fall back to book_hash, then try selectedRooms
          const rawSelectedRooms = (data as any).selectedRooms;
          const originalHash = room.original_book_hash || 
                               (room.book_hash?.startsWith('h-') ? room.book_hash : null) ||
                               rawSelectedRooms?.find((r: any) => r.roomId === room.originalRoomId)?.book_hash;
          
          if (!originalHash || !originalHash.startsWith('h-')) {
            console.error(`❌ Invalid hash for room ${room.roomIndex}: ${originalHash}`);
            throw new Error(`Cannot retry: missing original rate hash for room ${room.roomIndex + 1}`);
          }
          
          return {
            book_hash: originalHash, // MUST be h-... hash from rate selection
            guests: [{
              adults: data.searchParams.guests || 2,
              children: (data.searchParams.childrenAges || []).map((age: number) => ({ age })),
            }],
            residency: multiroomData.residency || "US",
            price_increase_percent: 20,
          };
        });
        
        console.log(`📤 Re-prebook payload hashes:`, prebookRoomsPayload.map(r => r.book_hash));
        
        // Call prebook API
        const prebookResponse = await bookingApi.prebook({
          rooms: prebookRoomsPayload,
          language: "en",
          currency: data.hotel?.currency || "USD",
        });
        
        if (prebookResponse.error || !prebookResponse.data?.rooms) {
          throw new Error(prebookResponse.error?.message || "Failed to re-prebook rooms");
        }
        
        console.log(`✅ Re-prebook successful: ${prebookResponse.data.successful_rooms}/${prebookResponse.data.total_rooms} rooms`);
        
        // 4. Build updated data with fresh prebook results
        // CRITICAL: Preserve original_book_hash so future retries also work
        // NOTE: Don't save to sessionStorage yet - wait until order forms load
        const updatedData: MultiroomPendingBookingData = {
          ...multiroomData,
          bookingId: newBookingId,
          prebookedRooms: prebookResponse.data.rooms.map((room: any, index: number) => {
            const originalHash = prebookedRooms[index]?.original_book_hash || 
                                 prebookedRooms[index]?.book_hash;
            return {
              roomIndex: room.roomIndex ?? index,
              originalRoomId: prebookedRooms[index]?.originalRoomId || `room-${index}`,
              booking_hash: room.booking_hash,        // Fresh p-... from new prebook
              book_hash: originalHash,                // Keep original h-...
              original_book_hash: originalHash,       // BACKUP: Never overwrite
              price_changed: room.price_changed,
              new_price: room.new_price,
              original_price: room.original_price,
              currency: room.currency || data.hotel?.currency || "USD",
            };
          }),
          // Clear cached order forms - will be populated by loadMultiroomOrderForm
          multiroomOrderForms: undefined,
          orderForms: undefined,
        } as any;
        
        // Update React state first (but NOT sessionStorage - that happens after API succeeds)
        setBookingData(updatedData);
        setFormDataLoaded(false);
        setMultiroomOrderForms([]);
        
        // 5. Load order forms with new prebook data (force refresh to bypass caching)
        // This function will update sessionStorage after successful API response
        await loadMultiroomOrderForm(updatedData, true);
        
        // 6. NOW save to sessionStorage - order forms are loaded and cached
        // This ensures we never save incomplete/undefined data
        const savedData = sessionStorage.getItem("pending_booking");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData.multiroomOrderForms && parsedData.multiroomOrderForms.length > 0) {
            console.log("✅ Session storage has valid order forms after retry");
          } else {
            console.warn("⚠️ Order forms not saved to session storage - will retry on next load");
          }
        }
        
      } else {
        // Single room booking - just update booking ID and reload
        const updatedData = { 
          ...data, 
          bookingId: newBookingId,
          orderId: undefined,
          itemId: undefined,
        };
        sessionStorage.setItem("pending_booking", JSON.stringify(updatedData));
        
        // Navigate and reload for single room (simpler flow)
        navigate(`/payment?booking_id=${newBookingId}`, { replace: true });
        window.location.reload();
        return;
      }
      
      // 6. Update URL without reload (for multiroom)
      navigate(`/payment?booking_id=${newBookingId}`, { replace: true });
      
      toast({
        title: "Session Refreshed",
        description: "Your booking session has been renewed. You can proceed with payment.",
      });
      
    } catch (error) {
      console.error("Failed to retry with new session:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to refresh booking session";
      
      toast({
        title: "Retry Failed",
        description: `${errorMessage}. Please go back and select your rooms again.`,
        variant: "destructive",
      });
      
      // Reset loading state before navigating
      setIsRetrying(false);
      setIsRetryInProgress(false);
      
      // Fallback: navigate to hotel page
      if (data?.hotel?.id) {
        navigate(`/hotel/${data.hotel.id}`);
      } else {
        navigate("/dashboard/search");
      }
    } finally {
      // ALWAYS reset loading states, even if navigation happened in catch block
      setIsRetrying(false);
      setIsRetryInProgress(false);
    }
  };

  const verifyPrice = async (data: PendingBookingData) => {
    setPriceVerified(true);
    setVerifiedPrice(data.totalPrice || 0);
  };

  const handlePriceAccept = () => {
    setPriceModalOpen(false);
    setPriceVerified(true);
    
    if (bookingData && verifiedPrice !== originalPrice) {
      const updatedData = { ...bookingData, totalPrice: verifiedPrice, priceUpdated: true };
      setBookingData(updatedData);
      sessionStorage.setItem("pending_booking", JSON.stringify(updatedData));
    }
  };

  const handlePriceDecline = () => {
    setPriceModalOpen(false);
    
    if (bookingData?.hotel?.id) {
      navigate(`/hotel/${bookingData.hotel.id}`);
    } else {
      navigate("/dashboard/search");
    }
  };

  // Validate card on blur
  const validateCardOnBlur = (field: string) => {
    const errors: typeof cardErrors = {};

    if (field === "cardNumber") {
      const result = validateCardNumber(cardNumber);
      if (!result.valid) errors.cardNumber = result.error;
    }

    if (field === "expiryDate") {
      const result = validateExpiryDate(expiryDate);
      if (!result.valid) errors.expiryDate = result.error;
    }

    if (field === "cvv") {
      const result = validateCVV(cvv, cardType.type);
      if (!result.valid) errors.cvv = result.error;
    }

    if (field === "cardholderName" && !cardholderName.trim()) {
      errors.cardholderName = "Cardholder name is required";
    }

    setCardErrors((prev) => ({ ...prev, ...errors }));
  };

  // Validate billing address
  const validateBillingAddress = (): boolean => {
    const errors: Partial<Record<keyof BillingAddress, string>> = {};

    if (!billingAddress.addressLine1.trim()) {
      errors.addressLine1 = "Address is required";
    }
    if (!billingAddress.city.trim()) {
      errors.city = "City is required";
    }
    if (!billingAddress.state.trim()) {
      errors.state = "State/Province is required";
    }
    if (!billingAddress.postalCode.trim()) {
      errors.postalCode = "Postal code is required";
    }
    if (!billingAddress.country) {
      errors.country = "Country is required";
    }

    setBillingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const errors: typeof cardErrors = {};
    let isValid = true;

    const cardResult = validateCardNumber(cardNumber);
    if (!cardResult.valid) {
      errors.cardNumber = cardResult.error;
      isValid = false;
    }

    if (!cardholderName.trim()) {
      errors.cardholderName = "Cardholder name is required";
      isValid = false;
    }

    const expiryResult = validateExpiryDate(expiryDate);
    if (!expiryResult.valid) {
      errors.expiryDate = expiryResult.error;
      isValid = false;
    }

    const cvvResult = validateCVV(cvv, cardType.type);
    if (!cvvResult.valid) {
      errors.cvv = cvvResult.error;
      isValid = false;
    }

    setCardErrors(errors);

    const billingValid = validateBillingAddress();
    
    if (!isValid || !billingValid) {
      toast({
        title: "Please fix the errors",
        description: "Check the highlighted fields and try again.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Helper to map UI payment types to API payment type
  const getApiPaymentType = (type: PaymentType): "deposit" | "hotel" | "now" => {
    if (type === "now_net" || type === "now_gross") return "now";
    return type;
  };

  const isCardPayment = paymentType === "now" || paymentType === "now_net" || paymentType === "now_gross";

  const handlePayment = async () => {
    if (isCardPayment && !validateForm()) return;

    // Validate order form data
    if (isMultiroom) {
      if (multiroomOrderForms.length === 0) {
        toast({
          title: "Booking Error",
          description: "Missing room booking data. Please go back and try again.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!orderId || !itemId) {
        toast({
          title: "Booking Error",
          description: "Missing booking reference. Please go back and try again.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);
    setPaymentError(null);
    setPaymentAttempted(true); // Prevent order form reload after payment attempt

    try {
      const leadGuest = bookingData!.guests.find((g) => g.isLead);

      // Step 1: Tokenize card if card payment type
      if (isCardPayment) {
        // Generate fresh UUIDs for Payota session
        const generatedPayUuid = crypto.randomUUID();
        const generatedInitUuid = crypto.randomUUID();

        const [month, year] = expiryDate.split("/");
        
        const tokenRequest = {
          object_id: String(orderId!),
          pay_uuid: generatedPayUuid,
          init_uuid: generatedInitUuid,
          user_first_name: leadGuest?.firstName || "",
          user_last_name: leadGuest?.lastName || "",
          is_cvc_required: isNeedCvc,
          cvc: cvv,
          credit_card_data_core: {
            card_number: cardNumber.replace(/\s/g, ""),
            card_holder: cardholderName.toUpperCase(),
            month: month.padStart(2, "0"),
            year: year,
          },
        };
        
        console.log("💳 Card tokenization request:", { 
          object_id: tokenRequest.object_id,
          pay_uuid: generatedPayUuid,
          init_uuid: generatedInitUuid,
          card_last_4: tokenRequest.credit_card_data_core.card_number.slice(-4),
        });

        // Call Payota tokenization endpoint
        const tokenResponse = await bookingApi.createCreditCardToken(tokenRequest);
        
        if (tokenResponse.status !== "ok") {
          const errorMsg = getPayotaErrorMessage(tokenResponse.error || "UNKNOWN_ERROR");
          throw new Error(errorMsg);
        }

        console.log("✅ Card tokenized successfully");

        // Step 2: Complete booking using finishBooking WITH the UUIDs
        const apiPaymentType = getApiPaymentType(paymentType);
        const selectedPayment = paymentTypesData.find(pt => pt.type === apiPaymentType);
        
        const email = leadGuest?.email;
        const phone = bookingData!.bookingDetails.phoneNumber 
          ? `${bookingData!.bookingDetails.countryCode}${bookingData!.bookingDetails.phoneNumber}`
          : undefined;

        if (!email) {
          throw new Error("Email is required to complete booking");
        }

        // Build return path for 3DS redirect (use partner_order_id)
        const partnerOrderId = bookingData!.bookingId;
        const returnPath = `${window.location.origin}/processing/${partnerOrderId}?order_id=${orderId}`;
        
        // Get free_cancellation_before from the selected room
        const freeCancellationBefore = bookingData!.rooms[0]?.cancellationDeadline;

        // ✅ DEBUG: Verify cancellation data before API call
        console.log('🔍 DEBUG - Card Payment - Booking cancellation data:', {
          room: bookingData!.rooms[0],
          cancellationDeadline: bookingData!.rooms[0]?.cancellationDeadline,
          hasFreeCancellationBefore: bookingData!.rooms[0]?.hasFreeCancellationBefore,
          cancellationType: bookingData!.rooms[0]?.cancellationType,
          freeCancellationBefore: freeCancellationBefore,
          paymentType: apiPaymentType,
        });

        // ✅ VALIDATION: Block deposit payment if free_cancellation_before is missing but required
        if (apiPaymentType === 'deposit' && bookingData!.rooms[0]?.hasFreeCancellationBefore && !freeCancellationBefore) {
          console.error('❌ CRITICAL: Deposit payment requires free_cancellation_before but it is missing!', {
            room: bookingData!.rooms[0],
            hasFreeCancellationBefore: bookingData!.rooms[0]?.hasFreeCancellationBefore,
          });
          throw new Error('Cancellation data missing for deposit payment. Please go back and reselect the room.');
        }

        // ✅ VALIDATION: Block if selectedPayment is missing (would result in 0.00 payment)
        if (!selectedPayment) {
          console.error('❌ CRITICAL: No payment type details found for:', apiPaymentType);
          throw new Error(`Payment type "${apiPaymentType}" not available. Please choose another payment method.`);
        }

        const finishResponse = await bookingApi.finishBooking({
          order_id: orderId!,
          item_id: itemId!,
          partner_order_id: bookingData!.bookingId,
          payment_type: apiPaymentType,
          payment_amount: selectedPayment.amount,
          payment_currency_code: selectedPayment.currency_code || bookingData!.hotel.currency || "USD",
        guests: bookingData!.guests.map((g) => ({
          first_name: sanitizeGuestName(g.firstName),
          last_name: sanitizeGuestName(g.lastName),
          is_child: g.type === "child",
          age: g.age,
        })),
          email,
          phone,
          // Include the tokenization UUIDs for card payments
          pay_uuid: generatedPayUuid,
          init_uuid: generatedInitUuid,
          // Include return path for 3DS redirect
          return_path: returnPath,
          // Include free_cancellation_before for refundable rates (prevents insufficient_b2b_balance)
          free_cancellation_before: freeCancellationBefore,
        });

        if (finishResponse.error) {
          throw new Error(finishResponse.error.message);
        }

        const finalOrderId = finishResponse.data?.order_id;
        if (!finalOrderId) {
          throw new Error("No order ID received from booking");
        }
        
        // Navigate using partner_order_id (required for status polling)
        // Pass order_id in query string for confirmation page
        if (isMultiroom) {
          const orderIds = multiroomOrderForms.map(f => f.order_id).join(",");
          navigate(`/processing/${partnerOrderId}?order_id=${finalOrderId}&multiroom=true&order_ids=${orderIds}`);
        } else {
          navigate(`/processing/${partnerOrderId}?order_id=${finalOrderId}`);
        }
        return;
      }

      // Step 2: Complete booking (non-card payments)
      if (isMultiroom) {
        // Multiroom finish
        await handleMultiroomFinish(leadGuest);
      } else {
        // Single room finish
        await handleSingleRoomFinish(leadGuest);
      }
      
    } catch (error) {
      console.error("Order finish failed:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to complete booking. Please try again.";
      
      // Check for payment session / UUID errors
      const isPaymentSessionError = 
        errorMessage.includes("Payment session expired") ||
        errorMessage.includes("pay_uuid") ||
        errorMessage.includes("init_uuid") ||
        errorMessage.toLowerCase().includes("invalid_pay_uuid") ||
        errorMessage.toLowerCase().includes("invalid_init_uuid");
      
      if (isPaymentSessionError && (paymentType === "now_net" || paymentType === "now_gross")) {
        // Try to fallback to "hotel" payment type
        const hotelPayment = paymentTypesData.find(pt => pt.type === "hotel");
        
        if (hotelPayment) {
          console.log("💡 Payment session error - suggesting hotel payment type");
          
          toast({
            title: "Card Payment Unavailable",
            description: "Card payment is temporarily unavailable. Please select 'Pay at Property' to continue.",
          });
          
          // Update available methods to exclude card payments
          setAvailablePaymentMethods(prev => 
            prev.filter(m => m !== "now_net" && m !== "now_gross")
          );
          setPaymentType("hotel");
          setPaymentError("Card payment unavailable. Please use Pay at Property option.");
          return;
        }
      }
      
      // Check for insufficient_b2b_balance error - show error but let user choose
      const isB2BBalanceError = errorMessage.toLowerCase().includes("insufficient_b2b_balance") ||
                                 errorMessage.toLowerCase().includes("b2b") ||
                                 errorMessage.toLowerCase().includes("insufficient balance") ||
                                 errorMessage.includes("402");
      
      if (isB2BBalanceError) {
        console.log("⚠️ B2B balance error - showing payment options");
        
        // Check what alternative payment methods are available
        const hasHotelPayment = availablePaymentMethods.includes("hotel");
        const hasCardPayment = availablePaymentMethods.some(m => m === "now" || m === "now_net" || m === "now_gross");
        
        let alternativeMessage = "";
        if (hasCardPayment) {
          alternativeMessage = "Please pay with a credit card instead.";
        } else if (hasHotelPayment) {
          alternativeMessage = "Please select 'Pay at Property' instead.";
        } else {
          alternativeMessage = "Please try a different payment method or contact support.";
        }
        
        toast({
          title: "Deposit Payment Unavailable",
          description: `Agency balance insufficient for "Book Now, Pay Later". ${alternativeMessage}`,
          variant: "destructive",
        });
        
        // If card payment is available, suggest switching to it
        if (hasCardPayment) {
          const cardMethod = availablePaymentMethods.find(m => m === "now_net" || m === "now_gross" || m === "now");
          if (cardMethod) {
            setPaymentType(cardMethod);
          }
          setPaymentError(`"Book Now, Pay Later" requires agency balance. Please complete payment with your credit card.`);
        } else if (hasHotelPayment) {
          setPaymentType("hotel");
          setPaymentError(`"Book Now, Pay Later" requires agency balance. Please use "Pay at Property" option.`);
        } else {
          setPaymentError("Deposit payment unavailable. Please contact support for assistance.");
        }
        return;
      }
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Single room finish (existing logic)
  const handleSingleRoomFinish = async (leadGuest: PendingBookingData["guests"][number] | undefined) => {
    // Get the API payment type
    const apiPaymentType = getApiPaymentType(paymentType);
    
    // Find the selected payment type details from order form
    const selectedPayment = paymentTypesData.find(pt => pt.type === apiPaymentType);
    
    if (!selectedPayment) {
      console.warn(`Payment type ${apiPaymentType} not found in paymentTypesData, using fallback`);
    }

    // Validate required contact info
    const email = leadGuest?.email;
    const phone = bookingData!.bookingDetails.phoneNumber 
      ? `${bookingData!.bookingDetails.countryCode}${bookingData!.bookingDetails.phoneNumber}`
      : undefined;

    if (!email) {
      throw new Error("Email is required to complete booking");
    }

    // Get free_cancellation_before from the selected room (use first room for single-room booking)
    const freeCancellationBefore = bookingData!.rooms[0]?.cancellationDeadline;

    // ✅ DEBUG: Verify cancellation data before API call
    console.log('🔍 DEBUG - Single Room Finish - Booking cancellation data:', {
      room: bookingData!.rooms[0],
      cancellationDeadline: bookingData!.rooms[0]?.cancellationDeadline,
      hasFreeCancellationBefore: bookingData!.rooms[0]?.hasFreeCancellationBefore,
      cancellationType: bookingData!.rooms[0]?.cancellationType,
      freeCancellationBefore: freeCancellationBefore,
      paymentType: apiPaymentType,
    });

    // ✅ VALIDATION: For deposit payment, we need a cancellation deadline (from free_cancellation_before OR policies)
    // The room must be refundable (cancellationType === 'free_cancellation' or hasFreeCancellationBefore === true)
    const room = bookingData!.rooms[0];
    const isRefundable = room?.hasFreeCancellationBefore || room?.cancellationType === 'free_cancellation';
    
    if (apiPaymentType === 'deposit') {
      if (!isRefundable) {
        console.error('❌ CRITICAL: Deposit payment not allowed for non-refundable rooms!', {
          room,
          hasFreeCancellationBefore: room?.hasFreeCancellationBefore,
          cancellationType: room?.cancellationType,
        });
        throw new Error('This rate does not support "Book Now, Pay Later". Please select Pay at Property or use card payment.');
      }
      
      if (!freeCancellationBefore) {
        console.error('❌ CRITICAL: Deposit payment requires cancellation deadline but it is missing!', {
          room,
          hasFreeCancellationBefore: room?.hasFreeCancellationBefore,
          cancellationType: room?.cancellationType,
        });
        throw new Error('Cancellation deadline missing for deposit payment. Please go back and reselect the room.');
      }
    }
    
    console.log('✅ Deposit payment validation passed:', {
      isRefundable,
      freeCancellationBefore,
      apiPaymentType,
    });

    // ✅ VALIDATION: Block if selectedPayment is missing (would result in 0.00 payment)
    if (!selectedPayment) {
      console.error('❌ CRITICAL: No payment type details found for:', apiPaymentType);
      throw new Error(`Payment type "${apiPaymentType}" not available. Please choose another payment method.`);
    }

    const response = await bookingApi.finishBooking({
      order_id: orderId!,
      item_id: itemId!,
      partner_order_id: bookingData!.bookingId,
      payment_type: apiPaymentType,
      payment_amount: selectedPayment?.amount || "0.00",
      payment_currency_code: selectedPayment?.currency_code || bookingData!.hotel.currency || "USD",
      guests: bookingData!.guests.map((g) => ({
        first_name: sanitizeGuestName(g.firstName),
        last_name: sanitizeGuestName(g.lastName),
        is_child: g.type === "child",
        age: g.age,
      })),
      email,
      phone,
      // Include free_cancellation_before for refundable rates (prevents insufficient_b2b_balance)
      free_cancellation_before: freeCancellationBefore,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    const finalOrderId = response.data?.order_id;
    if (!finalOrderId) {
      throw new Error("No order ID received from booking");
    }
    
    // Navigate using partner_order_id (required for status polling)
    const partnerOrderId = bookingData!.bookingId;
    navigate(`/processing/${partnerOrderId}?order_id=${finalOrderId}`);
  };

  // Multiroom finish
  const handleMultiroomFinish = async (leadGuest: PendingBookingData["guests"][number] | undefined) => {
    // Build rooms array for multiroom finish
    // CRITICAL: Use form.roomIndex to correctly align with bookingData.rooms
    // This ensures we get the right cancellationDeadline even when some rooms failed
    const rooms: MultiroomOrderFinishParams["rooms"] = multiroomOrderForms.map((form) => {
      // Build guests for this room
      // For simplicity, use same guests for all rooms (can be enhanced later)
      const searchParamsData = bookingData!.searchParams;
      const adultsCount = searchParamsData?.guests || 2;
      const childrenAges = searchParamsData?.childrenAges || [];
      
      const guestsForRoom: MultiroomGuests[] = [{
        adults: adultsCount,
        children: childrenAges.map(age => ({ age })),
      }];

      // Use form.roomIndex to get correct room data (not array index!)
      const roomData = bookingData!.rooms[form.roomIndex];
      
      return {
        order_id: form.order_id,
        item_id: form.item_id,
        guests: guestsForRoom,
        // Include free_cancellation_before for this room (prevents insufficient_b2b_balance)
        free_cancellation_before: roomData?.cancellationDeadline,
      };
    });

    // Get payment type details and contact info
    const apiPaymentType = getApiPaymentType(paymentType);
    const selectedPayment = paymentTypesData.find(pt => pt.type === apiPaymentType);
    
    // ✅ VALIDATION: Block if selectedPayment is missing (would result in 0.00 payment)
    if (!selectedPayment) {
      console.error('❌ CRITICAL: No payment type details found for multiroom:', apiPaymentType);
      throw new Error(`Payment type "${apiPaymentType}" not available. Please choose another payment method.`);
    }
    
    const email = leadGuest?.email;
    const phone = bookingData!.bookingDetails.phoneNumber 
      ? `${bookingData!.bookingDetails.countryCode}${bookingData!.bookingDetails.phoneNumber}`
      : undefined;

    if (!email) {
      throw new Error("Email is required to complete booking");
    }

    console.log(`📤 Multiroom finish with ${rooms.length} rooms`);

    const response = await bookingApi.finishBooking({
      rooms,
      payment_type: apiPaymentType,
      payment_amount: selectedPayment.amount,
      payment_currency_code: selectedPayment.currency_code || "USD",
      email,
      phone,
      partner_order_id: bookingData!.bookingId,
      language: "en",
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    // Handle partial failures
    if (response.data.failed_rooms > 0) {
      console.warn(`⚠️ ${response.data.failed_rooms} room(s) failed to complete`);
      toast({
        title: "Partial Booking Success",
        description: `${response.data.successful_rooms} of ${response.data.total_rooms} rooms booked successfully.`,
        variant: "default",
      });
    }

    // Get first successful order ID for processing page
    const orderIds = response.data.order_ids;
    if (!orderIds || orderIds.length === 0) {
      throw new Error("No order IDs received from multiroom booking");
    }

    // Navigate to processing page using partner_order_id (required for status polling)
    const primaryOrderId = orderIds[0];
    const allOrderIds = orderIds.join(",");
    const partnerOrderId = bookingData!.bookingId;
    navigate(`/processing/${partnerOrderId}?order_id=${primaryOrderId}&multiroom=true&order_ids=${allOrderIds}&total=${response.data.total_rooms}&success=${response.data.successful_rooms}`);
  };

  // Helper to get user-friendly Payota error messages
  const getPayotaErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      "INVALID_CARD_NUMBER": "The card number is invalid. Please check and try again.",
      "CARD_EXPIRED": "This card has expired. Please use a different card.",
      "INSUFFICIENT_FUNDS": "Insufficient funds. Please try a different card.",
      "CARD_DECLINED": "Your card was declined. Please contact your bank or try another card.",
      "INVALID_CVC": "The security code (CVV/CVC) is incorrect.",
      "PROCESSING_ERROR": "Payment processing error. Please try again.",
      "NETWORK_ERROR": "Network error. Please check your connection and try again.",
      "SESSION_EXPIRED": "Payment session expired. Please refresh and try again.",
      "UNKNOWN_ERROR": "An unexpected error occurred. Please try again.",
    };
    return errorMessages[errorCode] || `Payment error: ${errorCode}`;
  };

  // Get button text based on state
  const getButtonText = () => {
    if (isProcessing) return "Processing...";
    if (isVerifyingPrice) return "Verifying Price...";
    if (isLoadingForm) return "Preparing Booking...";
    
    const displayPrice = priceVerified ? verifiedPrice : bookingData?.totalPrice || 0;
    const currency = bookingData?.hotel?.currency || "USD";
    
    if (isCardPayment) {
      return `Pay ${currency} ${displayPrice.toFixed(2)}`;
    } else if (paymentType === "deposit") {
      return "Confirm Booking";
    }
    return "Confirm Pay at Property";
  };

  // Loading state
  // Show loading spinner ONLY if session is not expired - otherwise show the recovery UI
  if (isLoading && !sessionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    );
  }

  // No booking data
  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4 animate-fade-in">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                Payment Session Expired
              </h2>
              <p className="text-muted-foreground mb-6">
                Your booking session has expired. Please start a new booking.
              </p>
              <Button
                onClick={() => navigate("/dashboard/search")}
                className="bg-primary hover:bg-primary/90"
              >
                Start New Booking
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayPrice = priceVerified ? verifiedPrice : bookingData.totalPrice;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Full-screen blocking overlay during retry - prevents interaction and refresh */}
      {isRetryInProgress && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4 animate-fade-in">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-lg font-heading font-medium text-foreground">
              Refreshing your booking session...
            </p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Please wait, do not refresh the page.
            </p>
          </div>
        </div>
      )}

      {/* Price Confirmation Modal */}
      <PriceConfirmationModal
        open={priceModalOpen}
        onOpenChange={setPriceModalOpen}
        type={priceModalType}
        originalPrice={originalPrice}
        newPrice={verifiedPrice}
        currency={bookingData.hotel.currency}
        onAccept={handlePriceAccept}
        onDecline={handlePriceDecline}
      />

      {/* Hero Section - Explo Style */}
      <section className="relative min-h-[35vh] lg:min-h-[40vh] flex items-end px-4 py-8 md:px-8">
        {/* Rounded Container with Hotel Background */}
        <div
          className="absolute inset-4 md:inset-8 rounded-3xl md:rounded-[2.5rem] overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${bookingData.hotel.mainImage || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80"}')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container max-w-7xl w-full pb-8">
          <div className="flex gap-2 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-full px-4 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Booking</span>
            </Button>
            {/* DEV: Skip to confirmation */}
            <Button
              variant="ghost"
              onClick={() => {
                // Generate unique demo order ID and store mock booking data
                const demoOrderId = `DEMO-${Date.now()}`;
                const mockData = getMockPendingBookingData(demoOrderId);
                sessionStorage.setItem("pending_booking", JSON.stringify(mockData));
                navigate(`/orders/${demoOrderId}/confirmation`);
              }}
              className="flex items-center gap-2 bg-amber-500/80 backdrop-blur-sm text-white hover:bg-amber-500 rounded-full px-4 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <span>DEV: Skip to Confirmation</span>
            </Button>
          </div>
          
          <p 
            className="heading-spaced text-white/80 mb-3 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Secure Checkout
          </p>
          
          <h1 
            className="font-heading text-display-md md:text-display-lg text-white mb-4 opacity-0 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            Complete Your Payment
          </h1>
          
          <div 
            className="flex items-center gap-2 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Lock className="h-4 w-4 text-white/80" />
            <span className="text-white/80 text-body-md">256-bit SSL Encrypted</span>
          </div>
        </div>
      </section>

      {/* Progress Indicator - Floating Card */}
      <section className="relative -mt-6 z-20 px-4 md:px-8">
        <div className="container max-w-7xl">
          <div className="bg-card rounded-2xl shadow-card p-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <BookingProgressIndicator currentStep={3} />
          </div>
        </div>
      </section>

      {/* Main Content - Split Screen */}
      <main className="flex-1 py-10 lg:py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Debug Panel - Only visible with ?debug=1 */}
          {isDebugMode && bookingData && (
            <div className="mb-8 bg-amber-950/30 border border-amber-500/30 rounded-2xl p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-amber-400" />
                  <span className="font-heading font-semibold text-amber-400">Debug: Finish Payload Data</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                  onClick={() => {
                    const apiPaymentType = paymentType === "now_net" || paymentType === "now_gross" ? "now" : paymentType;
                    const selectedPayment = paymentTypesData.find(pt => pt.type === apiPaymentType);
                    const freeCancellationBefore = bookingData.rooms[0]?.cancellationDeadline;
                    const debugData = {
                      // Critical fields for /order/finish
                      free_cancellation_before: freeCancellationBefore || null,
                      hasFreeCancellationBefore: bookingData.rooms[0]?.hasFreeCancellationBefore,
                      payment_type: apiPaymentType,
                      payment_amount: selectedPayment?.amount || "MISSING",
                      payment_currency_code: selectedPayment?.currency_code || "MISSING",
                      // Order identifiers
                      order_id: orderId,
                      item_id: itemId,
                      partner_order_id: bookingData.bookingId,
                      // Room data
                      room: {
                        roomId: bookingData.rooms[0]?.roomId,
                        roomName: bookingData.rooms[0]?.roomName,
                        cancellationDeadline: bookingData.rooms[0]?.cancellationDeadline,
                        hasFreeCancellationBefore: bookingData.rooms[0]?.hasFreeCancellationBefore,
                        cancellationType: bookingData.rooms[0]?.cancellationType,
                      },
                      // All payment types from order form
                      paymentTypesData: paymentTypesData,
                    };
                    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
                    setCopiedDebug(true);
                    setTimeout(() => setCopiedDebug(false), 2000);
                  }}
                >
                  {copiedDebug ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedDebug ? "Copied!" : "Copy Full Payload"}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">free_cancellation_before:</span>
                    <span className={bookingData.rooms[0]?.cancellationDeadline ? "text-green-400" : "text-red-400 font-bold"}>
                      {bookingData.rooms[0]?.cancellationDeadline || "❌ MISSING"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">hasFreeCancellationBefore:</span>
                    <span className={bookingData.rooms[0]?.hasFreeCancellationBefore ? "text-green-400" : "text-yellow-400"}>
                      {String(bookingData.rooms[0]?.hasFreeCancellationBefore)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">payment_type:</span>
                    <span className="text-foreground">{paymentType === "now_net" || paymentType === "now_gross" ? "now" : paymentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">payment_amount:</span>
                    <span className={paymentTypesData.find(pt => pt.type === (paymentType === "now_net" || paymentType === "now_gross" ? "now" : paymentType))?.amount ? "text-foreground" : "text-red-400"}>
                      {paymentTypesData.find(pt => pt.type === (paymentType === "now_net" || paymentType === "now_gross" ? "now" : paymentType))?.amount || "❌ MISSING"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">order_id:</span>
                    <span className="text-foreground">{orderId || "loading..."}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">item_id:</span>
                    <span className="text-foreground">{itemId || "loading..."}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">partner_order_id:</span>
                    <span className="text-foreground text-xs">{bookingData.bookingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">formDataLoaded:</span>
                    <span className={formDataLoaded ? "text-green-400" : "text-yellow-400"}>{String(formDataLoaded)}</span>
                  </div>
                </div>
              </div>
              {bookingData.rooms[0]?.hasFreeCancellationBefore && !bookingData.rooms[0]?.cancellationDeadline && (
                <div className="mt-4 p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  ⚠️ <strong>CRITICAL:</strong> This room has hasFreeCancellationBefore=true but cancellationDeadline is missing!
                  This will cause deposit bookings to fail with insufficient_b2b_balance.
                </div>
              )}
            </div>
          )}

          {/* Payment Error Alert */}
          {paymentError && (
            <div className="mb-8 bg-destructive/10 border border-destructive/20 rounded-2xl p-5 flex items-start gap-4 animate-fade-in">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-heading text-lg font-semibold text-destructive">Payment Failed</p>
                <p className="text-body-md text-destructive/80 mt-1 whitespace-pre-line">{paymentError}</p>
                <div className="flex gap-3 mt-3">
                  {/* Show alternative payment options for B2B balance errors */}
                  {paymentError.includes("balance") && (
                    <>
                      {availablePaymentMethods.includes("hotel") && paymentType !== "hotel" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setPaymentType("hotel");
                            setPaymentError(null);
                          }}
                        >
                          Try Pay at Property
                        </Button>
                      )}
                      {(availablePaymentMethods.includes("now_net") || availablePaymentMethods.includes("now_gross")) && 
                       paymentType !== "now_net" && paymentType !== "now_gross" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setPaymentType(availablePaymentMethods.includes("now_net") ? "now_net" : "now_gross");
                            setPaymentError(null);
                          }}
                        >
                          Try Card Payment
                        </Button>
                      )}
                    </>
                  )}
                  <Button 
                    variant="link" 
                    className="text-destructive p-0 h-auto text-body-sm"
                    onClick={() => setPaymentError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Session Expired / Conflict Alert */}
          {sessionExpired && (
            <Card className="mb-8 border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 dark:bg-amber-800/30 rounded-full p-3 flex-shrink-0">
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-xl font-bold text-amber-700 dark:text-amber-400">
                      Booking Session Conflict
                    </h3>
                    <p className="text-body-md text-amber-600/90 dark:text-amber-300/80 mt-2">
                      Your previous booking attempt created a reservation that couldn't be recovered. 
                      This happens when the booking session expires or the system was temporarily unavailable.
                    </p>
                    <p className="text-body-sm text-amber-600/70 dark:text-amber-300/60 mt-2">
                      <strong>Recommended:</strong> Click "Start Fresh Booking" to return to the hotel and select your room again.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-4">
                      <Button 
                        onClick={() => {
                          // Clear lock for current booking
                          if (bookingData?.bookingId) {
                            clearLock(bookingData.bookingId);
                          }
                          clearAllLocks();
                          sessionStorage.removeItem("pending_booking");
                          if (bookingData?.hotel?.id) {
                            navigate(`/hotel/${bookingData.hotel.id}`);
                          } else {
                            navigate("/dashboard/search");
                          }
                        }}
                        className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Start Fresh Booking
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-amber-500 text-amber-700 hover:bg-amber-100 gap-2"
                        disabled={isRetrying}
                        onClick={() => {
                          // Reset auto-recovery flag for manual retry
                          autoRecoveryAttemptedRef.current = false;
                          handleRetryWithNewSession();
                        }}
                      >
                        {isRetrying && <Loader2 className="h-4 w-4 animate-spin" />}
                        Retry with New Session
                      </Button>
                      <Button 
                        variant="ghost"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => setSessionExpired(false)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
            {/* Left Panel - Payment Form */}
            <div className="order-2 lg:order-1">
              <div className="bg-card rounded-3xl shadow-card p-6 lg:p-8 opacity-0 animate-fade-in h-full" style={{ animationDelay: "0.1s" }}>
                <PaymentFormPanel
                  paymentType={paymentType}
                  onPaymentTypeChange={setPaymentType}
                  availableMethods={availablePaymentMethods}
                  recommendedType={recommendedPaymentType?.type}
                  isProcessing={isProcessing || isVerifyingPrice}
                  // Determine if rate is refundable (has free cancellation before deadline)
                  isRefundable={
                    bookingData?.rooms?.[0]?.hasFreeCancellationBefore ||
                    bookingData?.rooms?.[0]?.cancellationType === 'free_cancellation'
                  }
                  cardNumber={cardNumber}
                  onCardNumberChange={setCardNumber}
                  cardholderName={cardholderName}
                  onCardholderNameChange={setCardholderName}
                  expiryDate={expiryDate}
                  onExpiryDateChange={setExpiryDate}
                  cvv={cvv}
                  onCvvChange={setCvv}
                  saveCard={saveCard}
                  onSaveCardChange={setSaveCard}
                  cardErrors={cardErrors}
                  onValidateCard={validateCardOnBlur}
                  billingAddress={billingAddress}
                  onBillingAddressChange={setBillingAddress}
                  billingErrors={billingErrors}
                />
              </div>
            </div>

            {/* Right Panel - Order Summary - Floating Sticky Card */}
            <div className="order-1 lg:order-2">
              <div className="lg:sticky lg:top-8 opacity-0 animate-slide-in-right" style={{ animationDelay: "0.2s" }}>
                <div className="bg-card rounded-3xl shadow-card overflow-hidden">
                  <PaymentSummaryPanel
                    bookingData={bookingData}
                    displayPrice={displayPrice}
                    originalPrice={originalPrice}
                    priceVerified={priceVerified}
                    bookingId={bookingId || ""}
                    onConfirmBooking={handlePayment}
                    isProcessing={isProcessing}
                    isDisabled={isProcessing || isVerifyingPrice || isLoadingForm || !priceVerified || !formDataLoaded}
                    buttonText={getButtonText()}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Partial Room Failure Modal for Multiroom Bookings */}
      <PartialRoomFailureModal
        open={showPartialFailureModal}
        onOpenChange={setShowPartialFailureModal}
        failedRooms={failedRooms}
        successfulRooms={multiroomOrderForms.length}
        totalRooms={(bookingData as any)?.prebookedRooms?.length || bookingData?.rooms?.length || 0}
        roomNames={new Map(
          ((bookingData as any)?.selectedRooms || bookingData?.rooms || []).map((r: any, i: number) => [
            i,
            r.roomName || r.name || `Room ${i + 1}`,
          ])
        )}
        onContinue={() => {
          setShowPartialFailureModal(false);
          // Continue with successful rooms - form is already loaded
        }}
        onGoBack={() => {
          // Clear locks and session, then go back to hotel
          if (bookingData?.bookingId) {
            clearLock(bookingData.bookingId);
          }
          clearAllLocks();
          sessionStorage.removeItem("pending_booking");
          const hotelId = bookingData?.hotel?.id;
          if (hotelId) {
            navigate(`/hotel/${hotelId}`);
          } else {
            navigate("/dashboard/search");
          }
        }}
        onRetryWithNewSession={handleRetryWithNewSession}
      />
    </div>
  );
};

export default PaymentPage;
