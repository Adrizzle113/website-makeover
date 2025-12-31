import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft, AlertCircle, Lock } from "lucide-react";
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
import type { PendingBookingData, PaymentType } from "@/types/etgBooking";

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  // Page states
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingPrice, setIsVerifyingPrice] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingData, setBookingData] = useState<PendingBookingData | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("deposit");
  
  // ETG API order form data
  const [orderId, setOrderId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [formDataLoaded, setFormDataLoaded] = useState(false);

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

  // Load booking data and verify price on mount
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
  const loadOrderForm = async (data: PendingBookingData) => {
    if (!data.bookingHash || !data.bookingId) {
      console.warn("Missing bookingHash or bookingId for order form");
      setFormDataLoaded(true);
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

      setOrderId(formResponse.data.order_id);
      setItemId(formResponse.data.item_id);
      setFormDataLoaded(true);

      const updatedData = { 
        ...data, 
        orderId: formResponse.data.order_id,
        itemId: formResponse.data.item_id,
      };
      setBookingData(updatedData);
      sessionStorage.setItem("pending_booking", JSON.stringify(updatedData));

    } catch (error) {
      console.error("Failed to load order form:", error);
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

  const handlePayment = async () => {
    if (paymentType === "now" && !validateForm()) return;

    if (!orderId || !itemId) {
      toast({
        title: "Booking Error",
        description: "Missing booking reference. Please go back and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const leadGuest = bookingData!.guests.find((g) => g.isLead);
      
      const response = await bookingApi.finishBooking({
        order_id: orderId,
        item_id: itemId,
        partner_order_id: bookingData!.bookingId,
        payment_type: paymentType,
        guests: bookingData!.guests.map((g) => ({
          first_name: g.firstName,
          last_name: g.lastName,
          is_child: g.type === "child",
          age: g.age,
        })),
        email: leadGuest?.email,
        phone: bookingData!.bookingDetails.phoneNumber 
          ? `${bookingData!.bookingDetails.countryCode}${bookingData!.bookingDetails.phoneNumber}`
          : undefined,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const finalOrderId = response.data?.order_id;
      if (!finalOrderId) {
        throw new Error("No order ID received from booking");
      }
      
      navigate(`/processing/${finalOrderId}`);
      
    } catch (error) {
      console.error("Order finish failed:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to complete booking. Please try again.";
      
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

  // Get button text based on state
  const getButtonText = () => {
    if (isProcessing) return "Processing...";
    if (isVerifyingPrice) return "Verifying Price...";
    if (isLoadingForm) return "Preparing Booking...";
    
    const displayPrice = priceVerified ? verifiedPrice : bookingData?.totalPrice || 0;
    const currency = bookingData?.hotel?.currency || "USD";
    
    if (paymentType === "now") {
      return `Pay ${currency} ${displayPrice.toFixed(2)}`;
    } else if (paymentType === "deposit") {
      return "Confirm Deposit Booking";
    }
    return "Confirm Pay at Hotel";
  };

  // Loading state
  if (isLoading) {
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
              onClick={() => navigate(`/orders/demo-order/confirmation`)}
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
          {/* Payment Error Alert */}
          {paymentError && (
            <div className="mb-8 bg-destructive/10 border border-destructive/20 rounded-2xl p-5 flex items-start gap-4 animate-fade-in">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-heading text-lg font-semibold text-destructive">Payment Failed</p>
                <p className="text-body-md text-destructive/80 mt-1">{paymentError}</p>
                <Button 
                  variant="link" 
                  className="text-destructive p-0 h-auto text-body-sm mt-2"
                  onClick={() => setPaymentError(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
            {/* Left Panel - Payment Form */}
            <div className="order-2 lg:order-1">
              <div className="bg-card rounded-3xl shadow-card p-6 lg:p-8 opacity-0 animate-fade-in h-full" style={{ animationDelay: "0.1s" }}>
                <PaymentFormPanel
                  paymentType={paymentType}
                  onPaymentTypeChange={setPaymentType}
                  availableMethods={["deposit", "hotel"]}
                  isProcessing={isProcessing || isVerifyingPrice}
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
    </div>
  );
};

export default PaymentPage;
