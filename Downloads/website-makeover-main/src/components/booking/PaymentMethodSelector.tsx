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

export function PaymentMethodSelector({
  value,
  onChange,
  availableMethods = ["deposit", "hotel"],
  disabled = false,
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
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{method.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {method.description}
                  </p>
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

        {/* Note for certification */}
        <p className="text-xs text-muted-foreground mt-4">
          * Card payments require additional certification. Currently supporting deposit and pay at hotel options.
        </p>
      </CardContent>
    </Card>
  );
}
