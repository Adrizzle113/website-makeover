import { useState, useMemo } from "react";
import { CreditCard, Lock, Wallet, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
}> = [
  {
    value: "deposit",
    label: "Deposit Payment",
    description: "Pay a deposit now, remaining balance due later",
    icon: Wallet,
  },
  {
    value: "hotel",
    label: "Pay at Hotel",
    description: "Payment collected at the property upon check-in",
    icon: Building2,
  },
  {
    value: "now",
    label: "Pay Now (Card)",
    description: "Full payment with credit/debit card",
    icon: CreditCard,
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
          className="space-y-4"
        >
          {filteredMethods.map((method, index) => {
            const Icon = method.icon;
            const isSelected = paymentType === method.value;

            return (
              <Label
                key={method.value}
                htmlFor={`payment-${method.value}`}
                className={cn(
                  "flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer",
                  "transition-all duration-300",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-soft"
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
                    "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                    isSelected 
                      ? "bg-primary text-primary-foreground scale-105" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-heading text-heading-sm text-foreground">{method.label}</p>
                  <p className="text-body-sm text-muted-foreground mt-1">{method.description}</p>
                </div>
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
                    isSelected ? "border-primary bg-primary/10" : "border-muted-foreground/30"
                  )}
                >
                  <div 
                    className={cn(
                      "rounded-full bg-primary transition-all duration-200",
                      isSelected ? "w-3 h-3" : "w-0 h-0"
                    )} 
                  />
                </div>
              </Label>
            );
          })}
        </RadioGroup>
      </div>

      {/* Card Payment Form - Only show for "now" payment type */}
      {paymentType === "now" && (
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
