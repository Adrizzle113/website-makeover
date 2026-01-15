import { useState, useMemo } from "react";
import { CreditCard, Lock, Wallet, Building2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BillingAddressSection, type BillingAddress } from "@/components/booking/BillingAddressSection";
import { PaymentTrustBadges } from "@/components/booking/PaymentTrustBadges";
import {
  detectCardType,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  formatCardNumber,
  formatExpiryDate,
} from "@/lib/cardValidation";
import type { PaymentType } from "@/types/etgBooking";
import { cn } from "@/lib/utils";

interface PaymentFormPanelProps {
  paymentType: PaymentType;
  onPaymentTypeChange: (type: PaymentType) => void;
  availableMethods?: PaymentType[];
  recommendedType?: PaymentType;
  isProcessing?: boolean;
  // Card state
  cardNumber: string;
  onCardNumberChange: (value: string) => void;
  cardholderName: string;
  onCardholderNameChange: (value: string) => void;
  expiryDate: string;
  onExpiryDateChange: (value: string) => void;
  cvv: string;
  onCvvChange: (value: string) => void;
  saveCard: boolean;
  onSaveCardChange: (value: boolean) => void;
  cardErrors: {
    cardNumber?: string;
    cardholderName?: string;
    expiryDate?: string;
    cvv?: string;
  };
  onValidateCard: (field: string) => void;
  // Billing address
  billingAddress: BillingAddress;
  onBillingAddressChange: (address: BillingAddress) => void;
  billingErrors: Partial<Record<keyof BillingAddress, string>>;
}

const PAYMENT_METHODS: Array<{
  value: PaymentType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  tooltip: {
    pros: string[];
    cons: string[];
    bestFor: string;
  };
}> = [
  {
    value: "deposit",
    label: "Book Now, Pay Later",
    description: "Pay via bank transfer, card, or invoice after booking",
    icon: Wallet,
    tooltip: {
      pros: ["Most flexible payment timing", "Multiple payment options", "Appears in closing documents"],
      cons: ["Requires manual payment follow-up", "Booking may cancel if not paid on time"],
      bestFor: "Agency bookings with invoice requirements",
    },
  },
  {
    value: "now_net",
    label: "Pay Now (NET)",
    description: "Your card charged at NET rate immediately",
    icon: CreditCard,
    tooltip: {
      pros: ["Instant confirmation", "Lower rate (NET price)", "Simple one-step process"],
      cons: ["Immediate charge", "Not in closing documents"],
      bestFor: "Direct agency payments when you want lowest price",
    },
  },
  {
    value: "now_gross",
    label: "Client's Card",
    description: "Client pays full price, you earn commission",
    icon: CreditCard,
    badge: "GROSS",
    tooltip: {
      pros: ["Earn commission automatically", "No upfront agency cost", "Client pays directly"],
      cons: ["Not in closing documents", "Need client's card details"],
      bestFor: "When client wants to pay directly and you earn commission",
    },
  },
  {
    value: "hotel",
    label: "Pay at Property",
    description: "Guest pays at check-in",
    icon: Building2,
    tooltip: {
      pros: ["No upfront payment", "Flexible for guests", "Good for uncertain bookings"],
      cons: ["Only available on select rates", "No payment guarantee"],
      bestFor: "Rates that allow property payment",
    },
  },
];

export function PaymentFormPanel({
  paymentType,
  onPaymentTypeChange,
  availableMethods = ["deposit", "hotel"],
  isProcessing = false,
  cardNumber,
  onCardNumberChange,
  cardholderName,
  onCardholderNameChange,
  expiryDate,
  onExpiryDateChange,
  cvv,
  onCvvChange,
  saveCard,
  onSaveCardChange,
  cardErrors,
  onValidateCard,
  billingAddress,
  onBillingAddressChange,
  billingErrors,
  recommendedType,
}: PaymentFormPanelProps) {
  const cardType = useMemo(() => detectCardType(cardNumber), [cardNumber]);
  
  const filteredMethods = PAYMENT_METHODS.filter((method) =>
    availableMethods.includes(method.value)
  );

  const handleCardNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const detectedType = detectCardType(value);
    const maxLength = detectedType.type === "amex" ? 15 : 16;
    
    if (value.length <= maxLength) {
      onCardNumberChange(formatCardNumber(value, detectedType.type));
    }
  };

  const handleExpiryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      onExpiryDateChange(formatExpiryDate(value));
    }
  };

  const handleCvvInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const maxLength = cardType.type === "amex" ? 4 : 3;
    if (value.length <= maxLength) {
      onCvvChange(value);
    }
  };

  return (
    <div className="space-y-8">
      {/* Payment Method Selection */}
      <div>
        <p className="heading-spaced text-muted-foreground mb-4">Select Payment</p>
        <h2 className="font-heading text-heading-lg text-foreground mb-6">
          Choose Your Payment Method
        </h2>
        
        <RadioGroup
          value={paymentType}
          onValueChange={(v) => onPaymentTypeChange(v as PaymentType)}
          disabled={isProcessing}
          className="space-y-3"
        >
        <TooltipProvider delayDuration={200}>
          {filteredMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = paymentType === method.value;

            return (
              <div key={method.value} className="flex items-center gap-2">
                <Label
                  htmlFor={`payment-${method.value}`}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer flex-1",
                    "transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30",
                    isProcessing && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <RadioGroupItem
                    value={method.value}
                    id={`payment-${method.value}`}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
                      isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">{method.label}</p>
                      {method.value === recommendedType && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                          Recommended
                        </span>
                      )}
                      {method.badge && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                          {method.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{method.description}</p>
                  </div>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
                      isSelected ? "border-primary" : "border-muted-foreground/30"
                    )}
                  >
                    <div 
                      className={cn(
                        "rounded-full bg-primary transition-all duration-200",
                        isSelected ? "w-2.5 h-2.5" : "w-0 h-0"
                      )} 
                    />
                  </div>
                </Label>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs p-3">
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="font-semibold text-green-600 mb-1">✓ Pros</p>
                        <ul className="space-y-0.5 text-muted-foreground">
                          {method.tooltip.pros.map((pro, i) => (
                            <li key={i}>• {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-amber-600 mb-1">✗ Cons</p>
                        <ul className="space-y-0.5 text-muted-foreground">
                          {method.tooltip.cons.map((con, i) => (
                            <li key={i}>• {con}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-1 border-t">
                        <p className="text-foreground"><span className="font-medium">Best for:</span> {method.tooltip.bestFor}</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </TooltipProvider>
        </RadioGroup>
      </div>

      {/* Card Payment Form - Only show for card payment types */}
      {(paymentType === "now" || paymentType === "now_net" || paymentType === "now_gross") && (
        <div className="space-y-8 animate-fade-in">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="heading-spaced text-muted-foreground mb-2">Card Information</p>
                <h3 className="font-heading text-heading-md text-foreground">
                  Enter Your Card Details
                </h3>
              </div>
              
              {cardType.type !== "unknown" && (
                <div className="badge-pill bg-secondary text-secondary-foreground">
                  {cardType.name}
                </div>
              )}
            </div>

            <div className="space-y-6 bg-muted/30 rounded-2xl p-6">
              {/* Card Number */}
              <div>
                <Label htmlFor="cardNumber" className="text-body-sm font-medium text-foreground">
                  Card Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={handleCardNumberInput}
                    onBlur={() => onValidateCard("cardNumber")}
                    placeholder={cardType.type === "amex" ? "•••• •••••• •••••" : "•••• •••• •••• ••••"}
                    className={cn(
                      "pl-12 h-14 text-body-lg font-mono bg-background border-2 rounded-xl transition-all duration-200",
                      cardErrors.cardNumber ? "border-destructive" : "border-border focus:border-primary"
                    )}
                    disabled={isProcessing}
                  />
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                {cardErrors.cardNumber && (
                  <p className="text-body-sm text-destructive mt-2">{cardErrors.cardNumber}</p>
                )}
              </div>

              {/* Cardholder Name */}
              <div>
                <Label htmlFor="cardholderName" className="text-body-sm font-medium text-foreground">
                  Cardholder Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cardholderName"
                  value={cardholderName}
                  onChange={(e) => onCardholderNameChange(e.target.value.toUpperCase())}
                  onBlur={() => onValidateCard("cardholderName")}
                  placeholder="JOHN DOE"
                  className={cn(
                    "mt-2 h-14 text-body-lg uppercase bg-background border-2 rounded-xl transition-all duration-200",
                    cardErrors.cardholderName ? "border-destructive" : "border-border focus:border-primary"
                  )}
                  disabled={isProcessing}
                />
                {cardErrors.cardholderName && (
                  <p className="text-body-sm text-destructive mt-2">{cardErrors.cardholderName}</p>
                )}
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate" className="text-body-sm font-medium text-foreground">
                    Expiry Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="expiryDate"
                    value={expiryDate}
                    onChange={handleExpiryInput}
                    onBlur={() => onValidateCard("expiryDate")}
                    placeholder="MM/YY"
                    className={cn(
                      "mt-2 h-14 text-body-lg font-mono bg-background border-2 rounded-xl transition-all duration-200",
                      cardErrors.expiryDate ? "border-destructive" : "border-border focus:border-primary"
                    )}
                    disabled={isProcessing}
                  />
                  {cardErrors.expiryDate && (
                    <p className="text-body-sm text-destructive mt-2">{cardErrors.expiryDate}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cvv" className="text-body-sm font-medium text-foreground">
                    CVV <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="cvv"
                      type="password"
                      value={cvv}
                      onChange={handleCvvInput}
                      onBlur={() => onValidateCard("cvv")}
                      placeholder={cardType.type === "amex" ? "••••" : "•••"}
                      className={cn(
                        "h-14 text-body-lg font-mono bg-background border-2 rounded-xl transition-all duration-200",
                        cardErrors.cvv ? "border-destructive" : "border-border focus:border-primary"
                      )}
                      disabled={isProcessing}
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {cardErrors.cvv && (
                    <p className="text-body-sm text-destructive mt-2">{cardErrors.cvv}</p>
                  )}
                </div>
              </div>

              {/* Save Card */}
              <div className="flex items-center gap-3 pt-2">
                <Checkbox
                  id="saveCard"
                  checked={saveCard}
                  onCheckedChange={(checked) => onSaveCardChange(checked as boolean)}
                  disabled={isProcessing}
                  className="rounded-md"
                />
                <Label htmlFor="saveCard" className="text-body-sm cursor-pointer text-muted-foreground">
                  Save this card for future bookings
                </Label>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <BillingAddressSection
            value={billingAddress}
            onChange={onBillingAddressChange}
            errors={billingErrors}
            disabled={isProcessing}
          />
        </div>
      )}

      {/* Trust Badges */}
      <div className="pt-6">
        <PaymentTrustBadges variant="vertical" />
      </div>
    </div>
  );
}
