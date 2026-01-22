import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Building2, Wallet } from "lucide-react";
import type { PaymentType } from "@/types/etgBooking";

interface PaymentMethodSelectorProps {
  value: PaymentType;
  onChange: (value: PaymentType) => void;
  availableMethods?: PaymentType[];
  disabled?: boolean;
  recommendedType?: PaymentType;
}

const PAYMENT_METHODS: Array<{
  value: PaymentType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  note?: string;
  badge?: string;
}> = [
  {
    value: "deposit",
    label: "Book Now, Pay Later",
    description: "Create an invoice and pay via bank transfer, card, or payment link from your account",
    icon: Wallet,
    note: "Requires pre-funded agency balance",
  },
  {
    value: "now_net",
    label: "Pay Now (NET Price)",
    description: "Your card will be charged the NET rate immediately upon booking",
    icon: CreditCard,
    note: "Recommended for most bookings",
  },
  {
    value: "now_gross",
    label: "Pay by Client's Card",
    description: "Client's card is charged the full price. You'll receive your commission per contract terms.",
    icon: CreditCard,
    badge: "GROSS + Commission",
  },
  {
    value: "hotel",
    label: "Pay at Property",
    description: "Guest pays directly at the hotel upon check-in",
    icon: Building2,
    note: "Rate dependent",
  },
];

export function PaymentMethodSelector({
  value,
  onChange,
  availableMethods = ["deposit", "hotel"],
  disabled = false,
  recommendedType,
}: PaymentMethodSelectorProps) {
  const filteredMethods = PAYMENT_METHODS.filter((method) =>
    availableMethods.includes(method.value)
  );

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Payment Method
          </h2>
        </div>

        <RadioGroup
          value={value}
          onValueChange={(v) => onChange(v as PaymentType)}
          disabled={disabled}
          className="space-y-4"
        >
          {filteredMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = value === method.value;

            return (
              <Label
                key={method.value}
                htmlFor={`payment-${method.value}`}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer
                  transition-all duration-200
                  ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <RadioGroupItem
                  value={method.value}
                  id={`payment-${method.value}`}
                  className="sr-only"
                />
                <div
                  className={`
                    w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                  `}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{method.label}</p>
                    {method.value === recommendedType && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Recommended
                      </span>
                    )}
                    {method.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {method.description}
                  </p>
                  {method.note && (
                    <p className="text-xs text-muted-foreground/70 italic mt-1">
                      {method.note}
                    </p>
                  )}
                </div>
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${isSelected ? "border-primary" : "border-muted-foreground"}
                  `}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
              </Label>
            );
          })}
        </RadioGroup>

        {/* Note */}
        <p className="text-xs text-muted-foreground mt-4">
          * Card bookings paid by bank card are not indicated in closing documents.
        </p>
      </CardContent>
    </Card>
  );
}
